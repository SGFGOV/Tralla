import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { WebSocketServer, WebSocket } from "ws";
import { z } from "zod";
import {
  insertUserSchema,
  insertMessageSchema,
  insertGroupSchema,
  insertGroupMemberSchema,
  insertGroupMessageSchema,
  insertExpenseSchema,
  insertExpenseParticipantSchema,
  insertActivitySchema,
  insertActivityParticipantSchema,
  insertFriendSchema,
  insertGiftSuggestionSchema,
} from "@shared/schema";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";

interface WSMessage {
  type: string;
  payload: any;
}

interface UserConnection {
  userId: number;
  socket: WebSocket;
}

// Store active connections
const connections: UserConnection[] = [];

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  
  // Set up WebSocket server for real-time communication
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  wss.on('connection', (socket: WebSocket) => {
    let userId: number | null = null;
    
    socket.on('message', async (data: string) => {
      try {
        const message: WSMessage = JSON.parse(data);
        
        // Handle authentication
        if (message.type === 'auth') {
          userId = message.payload.userId;
          connections.push({ userId, socket });
          
          // Update user online status
          const user = await storage.getUser(userId);
          if (user) {
            await storage.updateUser(userId, { online: true });
            
            // Broadcast user online status to others
            broadcastUserStatus(userId, true);
          }
        }
        
        // Handle location updates
        if (message.type === 'location_update' && userId) {
          const { latitude, longitude } = message.payload;
          await storage.updateUserLocation(userId, latitude, longitude);
          
          // Get user's proximity settings
          const settings = await storage.getProximitySettings(userId);
          if (settings && settings.visible) {
            // Get nearby users and send them to the client
            const nearbyUsers = await storage.getNearbyUsers(userId, settings.radius);
            sendToUser(userId, {
              type: 'nearby_users',
              payload: nearbyUsers,
            });
          }
        }
        
        // Handle chat messages
        if (message.type === 'new_message' && userId) {
          const { receiverId, content, type } = message.payload;
          
          const newMessage = await storage.createMessage({
            senderId: userId,
            receiverId,
            content,
            type: type || 'text',
          });
          
          // Send to receiver if they're online
          sendToUser(receiverId, {
            type: 'new_message',
            payload: newMessage,
          });
          
          // Send confirmation to sender
          sendToUser(userId, {
            type: 'message_sent',
            payload: newMessage,
          });
        }
        
        // Handle group messages
        if (message.type === 'new_group_message' && userId) {
          const { groupId, content, type } = message.payload;
          
          // Check if user is a member of the group
          const member = await storage.getGroupMember(groupId, userId);
          if (member) {
            const newMessage = await storage.createGroupMessage({
              groupId,
              senderId: userId,
              content,
              type: type || 'text',
            });
            
            // Send to all group members
            const groupMembers = await storage.getGroupMembers(groupId);
            groupMembers.forEach((member) => {
              sendToUser(member.userId, {
                type: 'new_group_message',
                payload: {
                  message: newMessage,
                  groupId,
                },
              });
            });
          }
        }
        
        // Handle virtual interactions (hugs/kisses)
        if (message.type === 'virtual_interaction' && userId) {
          const { receiverId, interactionType } = message.payload;
          
          // Create a message with type 'virtual_hug' or 'virtual_kiss'
          const newMessage = await storage.createMessage({
            senderId: userId,
            receiverId,
            content: '',
            type: interactionType,
          });
          
          // Send to receiver if they're online
          sendToUser(receiverId, {
            type: 'virtual_interaction',
            payload: {
              message: newMessage,
              sender: await storage.getUser(userId),
            },
          });
        }
      } catch (error) {
        console.error("WebSocket error:", error);
      }
    });
    
    socket.on('close', async () => {
      if (userId) {
        // Remove connection
        const index = connections.findIndex((c) => c.userId === userId);
        if (index !== -1) {
          connections.splice(index, 1);
        }
        
        // Update user online status
        const user = await storage.getUser(userId);
        if (user) {
          await storage.updateUser(userId, {
            online: false,
            lastActive: new Date(),
          });
          
          // Broadcast user offline status to others
          broadcastUserStatus(userId, false);
        }
      }
    });
  });
  
  // Helper function to send message to a specific user
  function sendToUser(userId: number, message: any) {
    const userConnections = connections.filter((c) => c.userId === userId);
    userConnections.forEach((connection) => {
      if (connection.socket.readyState === WebSocket.OPEN) {
        connection.socket.send(JSON.stringify(message));
      }
    });
  }
  
  // Helper function to broadcast user status changes
  function broadcastUserStatus(userId: number, online: boolean) {
    connections.forEach((connection) => {
      if (connection.socket.readyState === WebSocket.OPEN && connection.userId !== userId) {
        connection.socket.send(JSON.stringify({
          type: 'user_status_change',
          payload: { userId, online },
        }));
      }
    });
  }
  
  // Error handling middleware
  const handleErrors = (err: any, res: Response) => {
    if (err instanceof ZodError) {
      const validationError = fromZodError(err);
      return res.status(400).json({ error: validationError.message });
    }
    
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  };
  
  // =====
  // Routes
  // =====
  
  // Authentication routes
  app.post('/api/auth/register', async (req: Request, res: Response) => {
    try {
      const data = insertUserSchema.parse(req.body);
      
      // Check if passwords match
      if (data.password !== data.confirmPassword) {
        return res.status(400).json({ error: 'Passwords do not match' });
      }
      
      // Check if username exists
      const existingUser = await storage.getUserByUsername(data.username);
      if (existingUser) {
        return res.status(400).json({ error: 'Username already taken' });
      }
      
      // Check if email exists
      const existingEmail = await storage.getUserByEmail(data.email);
      if (existingEmail) {
        return res.status(400).json({ error: 'Email already in use' });
      }
      
      // Create the user
      const user = await storage.createUser(data);
      
      // Return user without password
      const { password, ...userWithoutPassword } = user;
      res.status(201).json(userWithoutPassword);
    } catch (err) {
      handleErrors(err, res);
    }
  });
  
  app.post('/api/auth/login', async (req: Request, res: Response) => {
    try {
      const { username, password } = z.object({
        username: z.string(),
        password: z.string(),
      }).parse(req.body);
      
      // Find user by username
      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(401).json({ error: 'Invalid username or password' });
      }
      
      // Check password
      if (user.password !== password) {
        return res.status(401).json({ error: 'Invalid username or password' });
      }
      
      // Update user status
      await storage.updateUser(user.id, {
        online: true,
        lastActive: new Date(),
      });
      
      // Return user without password
      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (err) {
      handleErrors(err, res);
    }
  });
  
  app.post('/api/auth/logout', async (req: Request, res: Response) => {
    try {
      const { userId } = z.object({
        userId: z.number(),
      }).parse(req.body);
      
      // Update user status
      const user = await storage.getUser(userId);
      if (user) {
        await storage.updateUser(userId, {
          online: false,
          lastActive: new Date(),
        });
      }
      
      res.status(200).json({ success: true });
    } catch (err) {
      handleErrors(err, res);
    }
  });
  
  // User routes
  app.get('/api/users/:id', async (req: Request, res: Response) => {
    try {
      const userId = Number(req.params.id);
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      // Return user without password
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (err) {
      handleErrors(err, res);
    }
  });
  
  app.patch('/api/users/:id', async (req: Request, res: Response) => {
    try {
      const userId = Number(req.params.id);
      const updateData = req.body;
      
      // Don't allow updating password through this endpoint
      if (updateData.password) {
        delete updateData.password;
      }
      
      const updatedUser = await storage.updateUser(userId, updateData);
      
      // Return user without password
      const { password, ...userWithoutPassword } = updatedUser;
      res.json(userWithoutPassword);
    } catch (err) {
      handleErrors(err, res);
    }
  });
  
  // Proximity settings routes
  app.get('/api/users/:id/proximity-settings', async (req: Request, res: Response) => {
    try {
      const userId = Number(req.params.id);
      const settings = await storage.getProximitySettings(userId);
      
      if (!settings) {
        return res.status(404).json({ error: 'Settings not found' });
      }
      
      res.json(settings);
    } catch (err) {
      handleErrors(err, res);
    }
  });
  
  app.patch('/api/users/:id/proximity-settings', async (req: Request, res: Response) => {
    try {
      const userId = Number(req.params.id);
      const updateData = req.body;
      
      const updatedSettings = await storage.updateProximitySettings(userId, updateData);
      res.json(updatedSettings);
    } catch (err) {
      handleErrors(err, res);
    }
  });
  
  // Nearby users route
  app.get('/api/users/:id/nearby', async (req: Request, res: Response) => {
    try {
      const userId = Number(req.params.id);
      const radiusParam = req.query.radius as string;
      const radius = radiusParam ? Number(radiusParam) : 100;
      
      const nearbyUsers = await storage.getNearbyUsers(userId, radius);
      
      // Remove passwords
      const usersWithoutPasswords = nearbyUsers.map((user) => {
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
      });
      
      res.json(usersWithoutPasswords);
    } catch (err) {
      handleErrors(err, res);
    }
  });
  
  // Message routes
  app.get('/api/messages/:userId/:otherUserId', async (req: Request, res: Response) => {
    try {
      const userId = Number(req.params.userId);
      const otherUserId = Number(req.params.otherUserId);
      
      const messages = await storage.getMessages(userId, otherUserId);
      res.json(messages);
    } catch (err) {
      handleErrors(err, res);
    }
  });
  
  app.post('/api/messages', async (req: Request, res: Response) => {
    try {
      const messageData = insertMessageSchema.parse(req.body);
      const newMessage = await storage.createMessage(messageData);
      res.status(201).json(newMessage);
    } catch (err) {
      handleErrors(err, res);
    }
  });
  
  app.patch('/api/messages/:id/read', async (req: Request, res: Response) => {
    try {
      const messageId = Number(req.params.id);
      const updatedMessage = await storage.markMessageAsRead(messageId);
      res.json(updatedMessage);
    } catch (err) {
      handleErrors(err, res);
    }
  });
  
  app.get('/api/users/:id/chats', async (req: Request, res: Response) => {
    try {
      const userId = Number(req.params.id);
      const chats = await storage.getRecentChats(userId);
      
      // Remove passwords
      const chatsWithoutPasswords = chats.map((chat) => {
        const { password, ...userWithoutPassword } = chat.user;
        return { user: userWithoutPassword, lastMessage: chat.lastMessage };
      });
      
      res.json(chatsWithoutPasswords);
    } catch (err) {
      handleErrors(err, res);
    }
  });
  
  // Group routes
  app.get('/api/groups/:id', async (req: Request, res: Response) => {
    try {
      const groupId = Number(req.params.id);
      const group = await storage.getGroup(groupId);
      
      if (!group) {
        return res.status(404).json({ error: 'Group not found' });
      }
      
      res.json(group);
    } catch (err) {
      handleErrors(err, res);
    }
  });
  
  app.get('/api/users/:id/groups', async (req: Request, res: Response) => {
    try {
      const userId = Number(req.params.id);
      const groups = await storage.getGroupsByUser(userId);
      res.json(groups);
    } catch (err) {
      handleErrors(err, res);
    }
  });
  
  app.post('/api/groups', async (req: Request, res: Response) => {
    try {
      const groupData = insertGroupSchema.parse(req.body);
      const newGroup = await storage.createGroup(groupData);
      res.status(201).json(newGroup);
    } catch (err) {
      handleErrors(err, res);
    }
  });
  
  app.patch('/api/groups/:id', async (req: Request, res: Response) => {
    try {
      const groupId = Number(req.params.id);
      const updateData = req.body;
      
      const updatedGroup = await storage.updateGroup(groupId, updateData);
      res.json(updatedGroup);
    } catch (err) {
      handleErrors(err, res);
    }
  });
  
  // Group members routes
  app.get('/api/groups/:id/members', async (req: Request, res: Response) => {
    try {
      const groupId = Number(req.params.id);
      const members = await storage.getGroupMembers(groupId);
      
      // Remove passwords
      const membersWithoutPasswords = members.map((member) => {
        const { password, ...userWithoutPassword } = member.user;
        return { ...member, user: userWithoutPassword };
      });
      
      res.json(membersWithoutPasswords);
    } catch (err) {
      handleErrors(err, res);
    }
  });
  
  app.post('/api/groups/:id/members', async (req: Request, res: Response) => {
    try {
      const groupId = Number(req.params.id);
      const memberData = insertGroupMemberSchema.parse(req.body);
      
      if (memberData.groupId !== groupId) {
        return res.status(400).json({ error: 'Group ID mismatch' });
      }
      
      const newMember = await storage.addGroupMember(memberData);
      res.status(201).json(newMember);
    } catch (err) {
      handleErrors(err, res);
    }
  });
  
  app.delete('/api/groups/:groupId/members/:userId', async (req: Request, res: Response) => {
    try {
      const groupId = Number(req.params.groupId);
      const userId = Number(req.params.userId);
      
      await storage.removeGroupMember(groupId, userId);
      res.status(204).send();
    } catch (err) {
      handleErrors(err, res);
    }
  });
  
  app.patch('/api/groups/:groupId/members/:userId/role', async (req: Request, res: Response) => {
    try {
      const groupId = Number(req.params.groupId);
      const userId = Number(req.params.userId);
      const { role } = z.object({ role: z.string() }).parse(req.body);
      
      const updatedMember = await storage.updateGroupMemberRole(groupId, userId, role);
      res.json(updatedMember);
    } catch (err) {
      handleErrors(err, res);
    }
  });
  
  // Group messages routes
  app.get('/api/groups/:id/messages', async (req: Request, res: Response) => {
    try {
      const groupId = Number(req.params.id);
      const messages = await storage.getGroupMessages(groupId);
      
      // Remove passwords
      const messagesWithoutPasswords = messages.map((message) => {
        const { password, ...senderWithoutPassword } = message.sender;
        return { ...message, sender: senderWithoutPassword };
      });
      
      res.json(messagesWithoutPasswords);
    } catch (err) {
      handleErrors(err, res);
    }
  });
  
  app.post('/api/groups/:id/messages', async (req: Request, res: Response) => {
    try {
      const groupId = Number(req.params.id);
      const messageData = insertGroupMessageSchema.parse(req.body);
      
      if (messageData.groupId !== groupId) {
        return res.status(400).json({ error: 'Group ID mismatch' });
      }
      
      const newMessage = await storage.createGroupMessage(messageData);
      res.status(201).json(newMessage);
    } catch (err) {
      handleErrors(err, res);
    }
  });
  
  // Expense routes
  app.get('/api/expenses/:id', async (req: Request, res: Response) => {
    try {
      const expenseId = Number(req.params.id);
      const expense = await storage.getExpense(expenseId);
      
      if (!expense) {
        return res.status(404).json({ error: 'Expense not found' });
      }
      
      res.json(expense);
    } catch (err) {
      handleErrors(err, res);
    }
  });
  
  app.get('/api/groups/:id/expenses', async (req: Request, res: Response) => {
    try {
      const groupId = Number(req.params.id);
      const expenses = await storage.getExpensesByGroup(groupId);
      res.json(expenses);
    } catch (err) {
      handleErrors(err, res);
    }
  });
  
  app.post('/api/expenses', async (req: Request, res: Response) => {
    try {
      const expenseData = insertExpenseSchema.parse(req.body);
      const newExpense = await storage.createExpense(expenseData);
      res.status(201).json(newExpense);
    } catch (err) {
      handleErrors(err, res);
    }
  });
  
  app.patch('/api/expenses/:id', async (req: Request, res: Response) => {
    try {
      const expenseId = Number(req.params.id);
      const updateData = req.body;
      
      const updatedExpense = await storage.updateExpense(expenseId, updateData);
      res.json(updatedExpense);
    } catch (err) {
      handleErrors(err, res);
    }
  });
  
  // Expense participants routes
  app.get('/api/expenses/:id/participants', async (req: Request, res: Response) => {
    try {
      const expenseId = Number(req.params.id);
      const participants = await storage.getExpenseParticipants(expenseId);
      
      // Remove passwords
      const participantsWithoutPasswords = participants.map((participant) => {
        const { password, ...userWithoutPassword } = participant.user;
        return { ...participant, user: userWithoutPassword };
      });
      
      res.json(participantsWithoutPasswords);
    } catch (err) {
      handleErrors(err, res);
    }
  });
  
  app.post('/api/expenses/:id/participants', async (req: Request, res: Response) => {
    try {
      const expenseId = Number(req.params.id);
      const participantData = insertExpenseParticipantSchema.parse(req.body);
      
      if (participantData.expenseId !== expenseId) {
        return res.status(400).json({ error: 'Expense ID mismatch' });
      }
      
      const newParticipant = await storage.addExpenseParticipant(participantData);
      res.status(201).json(newParticipant);
    } catch (err) {
      handleErrors(err, res);
    }
  });
  
  app.patch('/api/expenses/:expenseId/participants/:userId/paid', async (req: Request, res: Response) => {
    try {
      const expenseId = Number(req.params.expenseId);
      const userId = Number(req.params.userId);
      const { paid } = z.object({ paid: z.boolean() }).parse(req.body);
      
      const updatedParticipant = await storage.updateExpenseParticipant(expenseId, userId, paid);
      res.json(updatedParticipant);
    } catch (err) {
      handleErrors(err, res);
    }
  });
  
  // Activity routes
  app.get('/api/activities/:id', async (req: Request, res: Response) => {
    try {
      const activityId = Number(req.params.id);
      const activity = await storage.getActivity(activityId);
      
      if (!activity) {
        return res.status(404).json({ error: 'Activity not found' });
      }
      
      res.json(activity);
    } catch (err) {
      handleErrors(err, res);
    }
  });
  
  app.get('/api/groups/:id/activities', async (req: Request, res: Response) => {
    try {
      const groupId = Number(req.params.id);
      const activities = await storage.getActivitiesByGroup(groupId);
      res.json(activities);
    } catch (err) {
      handleErrors(err, res);
    }
  });
  
  app.post('/api/activities', async (req: Request, res: Response) => {
    try {
      const activityData = insertActivitySchema.parse(req.body);
      const newActivity = await storage.createActivity(activityData);
      res.status(201).json(newActivity);
    } catch (err) {
      handleErrors(err, res);
    }
  });
  
  app.patch('/api/activities/:id', async (req: Request, res: Response) => {
    try {
      const activityId = Number(req.params.id);
      const updateData = req.body;
      
      const updatedActivity = await storage.updateActivity(activityId, updateData);
      res.json(updatedActivity);
    } catch (err) {
      handleErrors(err, res);
    }
  });
  
  // Activity participants routes
  app.get('/api/activities/:id/participants', async (req: Request, res: Response) => {
    try {
      const activityId = Number(req.params.id);
      const participants = await storage.getActivityParticipants(activityId);
      
      // Remove passwords
      const participantsWithoutPasswords = participants.map((participant) => {
        const { password, ...userWithoutPassword } = participant.user;
        return { ...participant, user: userWithoutPassword };
      });
      
      res.json(participantsWithoutPasswords);
    } catch (err) {
      handleErrors(err, res);
    }
  });
  
  app.post('/api/activities/:id/participants', async (req: Request, res: Response) => {
    try {
      const activityId = Number(req.params.id);
      const participantData = insertActivityParticipantSchema.parse(req.body);
      
      if (participantData.activityId !== activityId) {
        return res.status(400).json({ error: 'Activity ID mismatch' });
      }
      
      const newParticipant = await storage.addActivityParticipant(participantData);
      res.status(201).json(newParticipant);
    } catch (err) {
      handleErrors(err, res);
    }
  });
  
  app.patch('/api/activities/:activityId/participants/:userId/status', async (req: Request, res: Response) => {
    try {
      const activityId = Number(req.params.activityId);
      const userId = Number(req.params.userId);
      const { status } = z.object({ status: z.string() }).parse(req.body);
      
      const updatedParticipant = await storage.updateActivityParticipant(activityId, userId, status);
      res.json(updatedParticipant);
    } catch (err) {
      handleErrors(err, res);
    }
  });
  
  // Friend routes
  app.get('/api/users/:id/friends', async (req: Request, res: Response) => {
    try {
      const userId = Number(req.params.id);
      const friends = await storage.getFriends(userId);
      
      // Remove passwords
      const friendsWithoutPasswords = friends.map((friendship) => {
        const { password, ...friendWithoutPassword } = friendship.friend;
        return { ...friendship, friend: friendWithoutPassword };
      });
      
      res.json(friendsWithoutPasswords);
    } catch (err) {
      handleErrors(err, res);
    }
  });
  
  app.post('/api/friend-requests', async (req: Request, res: Response) => {
    try {
      const requestData = insertFriendSchema.parse(req.body);
      const newRequest = await storage.createFriendRequest(requestData);
      res.status(201).json(newRequest);
    } catch (err) {
      handleErrors(err, res);
    }
  });
  
  app.patch('/api/friend-requests/:userId/:friendId/status', async (req: Request, res: Response) => {
    try {
      const userId = Number(req.params.userId);
      const friendId = Number(req.params.friendId);
      const { status } = z.object({ status: z.string() }).parse(req.body);
      
      const updatedFriendship = await storage.updateFriendshipStatus(userId, friendId, status);
      res.json(updatedFriendship);
    } catch (err) {
      handleErrors(err, res);
    }
  });
  
  app.get('/api/users/:id/frequent-contacts', async (req: Request, res: Response) => {
    try {
      const userId = Number(req.params.id);
      const limitParam = req.query.limit as string;
      const limit = limitParam ? Number(limitParam) : 10;
      
      const frequentContacts = await storage.getFrequentContacts(userId, limit);
      
      // Remove passwords
      const contactsWithoutPasswords = frequentContacts.map((contact) => {
        const { password, ...friendWithoutPassword } = contact.friend;
        return { ...contact, friend: friendWithoutPassword };
      });
      
      res.json(contactsWithoutPasswords);
    } catch (err) {
      handleErrors(err, res);
    }
  });
  
  // Gift suggestion routes
  app.get('/api/users/:id/gift-suggestions', async (req: Request, res: Response) => {
    try {
      const userId = Number(req.params.id);
      const suggestions = await storage.getGiftSuggestions(userId);
      res.json(suggestions);
    } catch (err) {
      handleErrors(err, res);
    }
  });
  
  app.post('/api/gift-suggestions', async (req: Request, res: Response) => {
    try {
      const suggestionData = insertGiftSuggestionSchema.parse(req.body);
      const newSuggestion = await storage.createGiftSuggestion(suggestionData);
      res.status(201).json(newSuggestion);
    } catch (err) {
      handleErrors(err, res);
    }
  });
  
  app.patch('/api/gift-suggestions/:id', async (req: Request, res: Response) => {
    try {
      const suggestionId = Number(req.params.id);
      const updateData = req.body;
      
      const updatedSuggestion = await storage.updateGiftSuggestion(suggestionId, updateData);
      res.json(updatedSuggestion);
    } catch (err) {
      handleErrors(err, res);
    }
  });
  
  app.delete('/api/gift-suggestions/:id', async (req: Request, res: Response) => {
    try {
      const suggestionId = Number(req.params.id);
      await storage.deleteGiftSuggestion(suggestionId);
      res.status(204).send();
    } catch (err) {
      handleErrors(err, res);
    }
  });
  
  return httpServer;
}
