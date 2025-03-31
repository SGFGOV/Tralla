import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { WebSocketServer, WebSocket } from "ws";
import { z } from "zod";
import { fileURLToPath } from "url";
import path from 'path';
import fs from 'fs';

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
  insertLanguagePreferenceSchema,
  insertNotificationSchema,
  insertPrivacySettingSchema,
  insertSocialMediaAccountSchema,
} from "@shared/schema";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import { bhashiniTranslation } from "./services/bhashiniTranslation";
import * as facialRecognition from "./services/facialRecognition";
import { Language } from "@shared/i18n";
import jwt from 'jsonwebtoken';
import multer from 'multer';

// Secret for signing JWT tokens
const JWT_SECRET = process.env.JWT_SECRET || 'tralla-jwt-secret';
const OAUTH_CLIENT_ID = process.env.OAUTH_CLIENT_ID || 'tralla-client';
const OAUTH_CLIENT_SECRET = process.env.OAUTH_CLIENT_SECRET || 'tralla-secret';

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
  
  // Translation routes
  app.post('/api/translate', async (req: Request, res: Response) => {
    try {
      const { text, targetLanguage, sourceLanguage, autoDetect } = z.object({
        text: z.string(),
        targetLanguage: z.enum(Object.values(Language) as [string, ...string[]]),
        sourceLanguage: z.enum(Object.values(Language) as [string, ...string[]]).optional(),
        autoDetect: z.boolean().optional().default(true)
      }).parse(req.body);
      
      // If empty text, return empty response
      if (!text.trim()) {
        return res.json({ translatedText: '', detectedLanguage: null });
      }
      
      let sourceLang = sourceLanguage;
      
      // Detect source language if not provided and autoDetect is true
      if (!sourceLang && autoDetect) {
        sourceLang = await bhashiniTranslation.detectLanguage(text);
      } else if (!sourceLang) {
        sourceLang = Language.ENGLISH; // Default to English if not specified
      }
      
      // Don't translate if source and target are the same
      if (sourceLang === targetLanguage) {
        return res.json({ 
          translatedText: text, 
          detectedLanguage: sourceLang 
        });
      }
      
      // Translate the text
      const translatedText = await bhashiniTranslation.translate(
        text, 
        sourceLang as Language, 
        targetLanguage as Language
      );
      
      res.json({
        translatedText,
        detectedLanguage: sourceLang
      });
    } catch (err) {
      handleErrors(err, res);
    }
  });
  
  app.post('/api/detect-language', async (req: Request, res: Response) => {
    try {
      const { text } = z.object({
        text: z.string()
      }).parse(req.body);
      
      if (!text.trim()) {
        return res.json({ detectedLanguage: Language.ENGLISH });
      }
      
      const detectedLanguage = await bhashiniTranslation.detectLanguage(text);
      res.json({ detectedLanguage });
    } catch (err) {
      handleErrors(err, res);
    }
  });
  
  // Language preferences routes
  app.get('/api/users/:id/language-preferences', async (req: Request, res: Response) => {
    try {
      const userId = Number(req.params.id);
      
      // Check if user exists
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      // Get language preferences from storage
      const preferences = await storage.getLanguagePreferences(userId);
      
      // If no preferences found, return default preferences
      if (!preferences) {
        return res.status(404).json({ 
          error: 'Language preferences not found',
          defaultPreferences: {
            userId,
            primaryLanguage: Language.ENGLISH,
            secondaryLanguages: [],
            autoTranslate: true,
            autoDetectLanguage: true
          }
        });
      }
      
      res.json(preferences);
    } catch (err) {
      handleErrors(err, res);
    }
  });
  
  app.post('/api/users/:id/language-preferences', async (req: Request, res: Response) => {
    try {
      const userId = Number(req.params.id);
      const preferenceData = insertLanguagePreferenceSchema.parse(req.body);
      
      if (preferenceData.userId !== userId) {
        return res.status(400).json({ error: 'User ID mismatch' });
      }
      
      // Create language preferences
      const preferences = await storage.createLanguagePreferences(preferenceData);
      res.status(201).json(preferences);
    } catch (err) {
      handleErrors(err, res);
    }
  });
  
  app.patch('/api/users/:id/language-preferences', async (req: Request, res: Response) => {
    try {
      const userId = Number(req.params.id);
      const updateData = req.body;
      
      // Update language preferences
      const preferences = await storage.updateLanguagePreferences(userId, updateData);
      res.json(preferences);
    } catch (err) {
      handleErrors(err, res);
    }
  });
  
  // Privacy settings routes
  app.get('/api/users/:id/privacy-settings', async (req: Request, res: Response) => {
    try {
      const userId = Number(req.params.id);
      
      // Check if user exists
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      // Get privacy settings from storage
      const settings = await storage.getPrivacySettings(userId);
      
      // If no settings found, return default settings
      if (!settings) {
        return res.status(404).json({
          error: 'Privacy settings not found',
          defaultSettings: {
            userId,
            showOnlineStatus: true,
            showLastActive: true,
            allowFriendRequests: true,
            allowProximityDiscovery: true,
            allowLocationSharing: true,
            showBirthday: true,
            showEmail: false,
            profileVisibility: 'public',
            messagesFromNonFriends: true
          }
        });
      }
      
      res.json(settings);
    } catch (err) {
      handleErrors(err, res);
    }
  });
  
  app.post('/api/users/:id/privacy-settings', async (req: Request, res: Response) => {
    try {
      const userId = Number(req.params.id);
      const settingData = insertPrivacySettingSchema.parse(req.body);
      
      if (settingData.userId !== userId) {
        return res.status(400).json({ error: 'User ID mismatch' });
      }
      
      // Create privacy settings
      const settings = await storage.createPrivacySettings(settingData);
      res.status(201).json(settings);
    } catch (err) {
      handleErrors(err, res);
    }
  });
  
  app.patch('/api/users/:id/privacy-settings', async (req: Request, res: Response) => {
    try {
      const userId = Number(req.params.id);
      const updateData = req.body;
      
      // Update privacy settings
      const settings = await storage.updatePrivacySettings(userId, updateData);
      res.json(settings);
    } catch (err) {
      handleErrors(err, res);
    }
  });
  
  // Voice message routes
  app.post('/api/voice-messages', async (req: Request, res: Response) => {
    try {
      const { audio, duration, messageId, groupMessageId, senderId, receiverId, groupId } = z.object({
        audio: z.string(), // Base64 encoded audio data
        duration: z.number(),
        messageId: z.number().optional(),
        groupMessageId: z.number().optional(),
        senderId: z.number(),
        receiverId: z.number().optional(),
        groupId: z.number().optional()
      }).parse(req.body);
      
      // Generate a filename for the audio file
      const filename = `voice_${Date.now()}_${Math.random().toString(36).substring(2, 15)}.webm`;
      
      // In a real app, we would store the audio file here:
      // await fs.writeFile(`./uploads/voice/${filename}`, Buffer.from(audio, 'base64'));
      
      let newMessageId;
      let newGroupMessageId;
      
      // Create a message if not provided
      if (!messageId && receiverId) {
        const newMessage = await storage.createMessage({
          senderId,
          receiverId,
          content: `[Voice message - ${duration}s]`,
          type: 'voice'
        });
        newMessageId = newMessage.id;
        
        // Send the message via WebSocket if the receiver is online
        sendToUser(receiverId, {
          type: 'new_message',
          payload: {
            ...newMessage,
            isVoiceMessage: true
          }
        });
      }
      
      // Create a group message if not provided
      if (!groupMessageId && groupId) {
        const newGroupMessage = await storage.createGroupMessage({
          groupId,
          senderId,
          content: `[Voice message - ${duration}s]`,
          type: 'voice'
        });
        newGroupMessageId = newGroupMessage.id;
        
        // Send the message to all group members
        const groupMembers = await storage.getGroupMembers(groupId);
        groupMembers.forEach((member) => {
          if (member.userId !== senderId) {
            sendToUser(member.userId, {
              type: 'new_group_message',
              payload: {
                message: {
                  ...newGroupMessage,
                  isVoiceMessage: true
                },
                groupId
              }
            });
          }
        });
      }
      
      // Create voice message record
      const voiceMessage = await storage.createVoiceMessage({
        messageId: messageId || newMessageId,
        groupMessageId: groupMessageId || newGroupMessageId,
        audioUrl: `/uploads/voice/${filename}`,
        duration,
        transcription: null,
        transcriptionLanguage: null
      });
      
      res.status(201).json(voiceMessage);
    } catch (err) {
      handleErrors(err, res);
    }
  });
  
  // Transcribe voice message route
  app.post('/api/voice-messages/:id/transcribe', async (req: Request, res: Response) => {
    try {
      const voiceMessageId = Number(req.params.id);
      const { targetLanguage } = z.object({
        targetLanguage: z.enum(Object.values(Language) as [string, ...string[]])
      }).parse(req.body);
      
      const voiceMessage = await storage.getVoiceMessage(voiceMessageId);
      if (!voiceMessage) {
        return res.status(404).json({ error: 'Voice message not found' });
      }
      
      // In a real application, we would:
      // 1. Use a speech-to-text service to transcribe the audio
      // 2. Store the transcription in the database
      // 3. Optionally translate the transcription to the target language
      
      // For now, simulate a transcription
      const simulatedTranscription = "This is a simulated transcription of the voice message.";
      
      // Update the voice message with the transcription
      const updatedVoiceMessage = await storage.updateVoiceMessage(voiceMessageId, {
        transcription: simulatedTranscription,
        transcriptionLanguage: Language.ENGLISH
      });
      
      // If the target language is different, translate the transcription
      if (targetLanguage !== Language.ENGLISH) {
        const translatedText = await bhashiniTranslation.translate(
          simulatedTranscription,
          Language.ENGLISH, 
          targetLanguage as Language
        );
        
        res.json({
          voiceMessage: updatedVoiceMessage,
          transcription: simulatedTranscription,
          translatedTranscription: translatedText,
          sourceLanguage: Language.ENGLISH,
          targetLanguage
        });
      } else {
        res.json({
          voiceMessage: updatedVoiceMessage,
          transcription: simulatedTranscription,
          translatedTranscription: null,
          sourceLanguage: Language.ENGLISH,
          targetLanguage
        });
      }
    } catch (err) {
      handleErrors(err, res);
    }
  });
  
  // Calendar Events Routes
  app.get('/api/users/:id/calendar-events', async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.id);
      if (isNaN(userId)) {
        return res.status(400).json({ error: 'Invalid user ID' });
      }

      const calendarEvents = await storage.getUserCalendarEvents(userId);
      return res.status(200).json(calendarEvents);
    } catch (error) {
      console.error('Error getting calendar events:', error);
      return res.status(500).json({ error: 'Failed to get calendar events' });
    }
  });

  app.get('/api/calendar-events/:id', async (req: Request, res: Response) => {
    try {
      const eventId = parseInt(req.params.id);
      if (isNaN(eventId)) {
        return res.status(400).json({ error: 'Invalid event ID' });
      }

      const calendarEvent = await storage.getCalendarEvent(eventId);
      if (!calendarEvent) {
        return res.status(404).json({ error: 'Calendar event not found' });
      }
      return res.status(200).json(calendarEvent);
    } catch (error) {
      console.error('Error getting calendar event:', error);
      return res.status(500).json({ error: 'Failed to get calendar event' });
    }
  });

  app.post('/api/calendar-events', async (req: Request, res: Response) => {
    try {
      const eventData = req.body;
      const calendarEvent = await storage.createCalendarEvent(eventData);
      return res.status(201).json(calendarEvent);
    } catch (error) {
      console.error('Error creating calendar event:', error);
      return res.status(500).json({ error: 'Failed to create calendar event' });
    }
  });

  app.patch('/api/calendar-events/:id', async (req: Request, res: Response) => {
    try {
      const eventId = parseInt(req.params.id);
      if (isNaN(eventId)) {
        return res.status(400).json({ error: 'Invalid event ID' });
      }

      const eventData = req.body;
      const updatedEvent = await storage.updateCalendarEvent(eventId, eventData);
      return res.status(200).json(updatedEvent);
    } catch (error) {
      console.error('Error updating calendar event:', error);
      return res.status(500).json({ error: 'Failed to update calendar event' });
    }
  });

  app.delete('/api/calendar-events/:id', async (req: Request, res: Response) => {
    try {
      const eventId = parseInt(req.params.id);
      if (isNaN(eventId)) {
        return res.status(400).json({ error: 'Invalid event ID' });
      }

      await storage.deleteCalendarEvent(eventId);
      return res.status(204).send();
    } catch (error) {
      console.error('Error deleting calendar event:', error);
      return res.status(500).json({ error: 'Failed to delete calendar event' });
    }
  });

  // Notification Routes
  app.get('/api/users/:id/notifications', async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.id);
      if (isNaN(userId)) {
        return res.status(400).json({ error: 'Invalid user ID' });
      }

      const notifications = await storage.getUserNotifications(userId);
      return res.status(200).json(notifications);
    } catch (error) {
      console.error('Error getting notifications:', error);
      return res.status(500).json({ error: 'Failed to get notifications' });
    }
  });

  app.get('/api/users/:id/notifications/unread-count', async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.id);
      if (isNaN(userId)) {
        return res.status(400).json({ error: 'Invalid user ID' });
      }

      const count = await storage.getUnreadNotificationsCount(userId);
      return res.status(200).json({ count });
    } catch (error) {
      console.error('Error getting unread notifications count:', error);
      return res.status(500).json({ error: 'Failed to get unread notifications count' });
    }
  });

  app.post('/api/notifications', async (req: Request, res: Response) => {
    try {
      const notificationData = req.body;
      const notification = await storage.createNotification(notificationData);
      
      // Send real-time notification to the user if they're connected
      const userConnection = connections.find(conn => conn.userId === notification.userId);
      if (userConnection && userConnection.socket.readyState === WebSocket.OPEN) {
        userConnection.socket.send(JSON.stringify({
          type: 'notification',
          payload: notification
        }));
      }
      
      return res.status(201).json(notification);
    } catch (error) {
      console.error('Error creating notification:', error);
      return res.status(500).json({ error: 'Failed to create notification' });
    }
  });

  app.patch('/api/notifications/:id/mark-as-read', async (req: Request, res: Response) => {
    try {
      const notificationId = parseInt(req.params.id);
      if (isNaN(notificationId)) {
        return res.status(400).json({ error: 'Invalid notification ID' });
      }

      const updatedNotification = await storage.markNotificationAsRead(notificationId);
      return res.status(200).json(updatedNotification);
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return res.status(500).json({ error: 'Failed to mark notification as read' });
    }
  });

  app.delete('/api/notifications/:id', async (req: Request, res: Response) => {
    try {
      const notificationId = parseInt(req.params.id);
      if (isNaN(notificationId)) {
        return res.status(400).json({ error: 'Invalid notification ID' });
      }

      await storage.deleteNotification(notificationId);
      return res.status(204).send();
    } catch (error) {
      console.error('Error deleting notification:', error);
      return res.status(500).json({ error: 'Failed to delete notification' });
    }
  });

  // Notification Preferences Routes
  app.get('/api/users/:id/notification-preferences', async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.id);
      if (isNaN(userId)) {
        return res.status(400).json({ error: 'Invalid user ID' });
      }

      const preferences = await storage.getNotificationPreferences(userId);
      if (!preferences) {
        return res.status(404).json({ error: 'Notification preferences not found' });
      }
      return res.status(200).json(preferences);
    } catch (error) {
      console.error('Error getting notification preferences:', error);
      return res.status(500).json({ error: 'Failed to get notification preferences' });
    }
  });

  app.post('/api/users/:id/notification-preferences', async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.id);
      if (isNaN(userId)) {
        return res.status(400).json({ error: 'Invalid user ID' });
      }

      // Ensure userId is set in the preferences
      const preferencesData = { ...req.body, userId };
      const preferences = await storage.createNotificationPreferences(preferencesData);
      return res.status(201).json(preferences);
    } catch (error) {
      console.error('Error creating notification preferences:', error);
      return res.status(500).json({ error: 'Failed to create notification preferences' });
    }
  });

  app.patch('/api/users/:id/notification-preferences', async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.id);
      if (isNaN(userId)) {
        return res.status(400).json({ error: 'Invalid user ID' });
      }

      const preferencesData = req.body;
      const updatedPreferences = await storage.updateNotificationPreferences(userId, preferencesData);
      return res.status(200).json(updatedPreferences);
    } catch (error) {
      console.error('Error updating notification preferences:', error);
      return res.status(500).json({ error: 'Failed to update notification preferences' });
    }
  });

  // ============================
  // Social Media Account Routes
  // ============================
  app.get('/api/users/:userId/social-media-accounts', async (req: Request, res: Response) => {
    try {
      const userId = Number(req.params.userId);
      const accounts = await storage.getUserSocialMediaAccounts(userId);
      
      // Sanitize sensitive data
      const sanitizedAccounts = accounts.map(account => {
        const { accessToken, refreshToken, ...safeAccount } = account;
        return safeAccount;
      });
      
      res.json(sanitizedAccounts);
    } catch (err) {
      handleErrors(err, res);
    }
  });

  app.post('/api/social-media-accounts', async (req: Request, res: Response) => {
    try {
      const accountData = insertSocialMediaAccountSchema.parse(req.body);
      const newAccount = await storage.createSocialMediaAccount(accountData);
      
      // Sanitize sensitive data before returning
      const { accessToken, refreshToken, ...safeAccount } = newAccount;
      res.status(201).json(safeAccount);
    } catch (err) {
      handleErrors(err, res);
    }
  });

  app.patch('/api/social-media-accounts/:id', async (req: Request, res: Response) => {
    try {
      const accountId = Number(req.params.id);
      const updateData = req.body;
      
      const updatedAccount = await storage.updateSocialMediaAccount(accountId, updateData);
      
      // Sanitize sensitive data before returning
      const { accessToken, refreshToken, ...safeAccount } = updatedAccount;
      res.json(safeAccount);
    } catch (err) {
      handleErrors(err, res);
    }
  });

  app.delete('/api/social-media-accounts/:id', async (req: Request, res: Response) => {
    try {
      const accountId = Number(req.params.id);
      
      await storage.deleteSocialMediaAccount(accountId);
      res.status(204).send();
    } catch (err) {
      handleErrors(err, res);
    }
  });

  // ============================
  // OAuth Client and Provider Routes
  // ============================
  
  // Middleware for verifying JWT token
  const verifyToken = (req: Request, res: Response, next: NextFunction) => {
    const bearerHeader = req.headers['authorization'];
    
    if (typeof bearerHeader !== 'undefined') {
      const bearer = bearerHeader.split(' ');
      const bearerToken = bearer[1];
      
      jwt.verify(bearerToken, JWT_SECRET, (err: any, decoded: any) => {
        if (err) {
          return res.status(401).json({ error: 'Invalid token' });
        }
        
        // Add the decoded token to the request object
        (req as any).user = decoded;
        next();
      });
    } else {
      res.status(401).json({ error: 'Token not provided' });
    }
  };

  // OAuth 2.0 Authorization Server routes (Tralla as a Provider)
  
  // Authorization endpoint
  app.get('/oauth/authorize', async (req: Request, res: Response) => {
    try {
      const { client_id, redirect_uri, response_type, scope, state } = req.query;
      
      // Validate request
      if (!client_id || !redirect_uri || response_type !== 'code') {
        return res.status(400).json({ error: 'Invalid request parameters' });
      }
      
      // Here you would normally verify the client_id against registered clients
      // and check if the redirect_uri matches what's registered for the client
      
      // For now we'll use our hardcoded client
      if (client_id !== OAUTH_CLIENT_ID) {
        return res.status(400).json({ error: 'Invalid client_id' });
      }
      
      // Generate an authorization code
      const authCode = Math.random().toString(36).substring(2, 15);
      
      // In a real implementation, we would store this code along with associated
      // client_id, redirect_uri, expiration time, etc.
      
      // For this demo, we'll redirect immediately with the code
      const redirectUrl = `${redirect_uri}?code=${authCode}&state=${state || ''}`;
      res.redirect(redirectUrl);
      
    } catch (err) {
      handleErrors(err, res);
    }
  });
  
  // Token endpoint
  app.post('/oauth/token', async (req: Request, res: Response) => {
    try {
      const { grant_type, code, redirect_uri, client_id, client_secret } = req.body;
      
      // Validate request
      if (!grant_type || !client_id || !client_secret) {
        return res.status(400).json({ error: 'Invalid request parameters' });
      }
      
      // Validate client credentials
      if (client_id !== OAUTH_CLIENT_ID || client_secret !== OAUTH_CLIENT_SECRET) {
        return res.status(401).json({ error: 'Invalid client credentials' });
      }
      
      if (grant_type === 'authorization_code') {
        // In a real implementation, we would validate the authorization code
        // and check that it matches the redirect_uri
        
        // Generate access token and refresh token
        const accessToken = jwt.sign({ 
          client_id, 
          scope: 'read profile' // Example scope
        }, JWT_SECRET, { expiresIn: '1h' });
        
        const refreshToken = jwt.sign({ 
          client_id,
          type: 'refresh'
        }, JWT_SECRET, { expiresIn: '30d' });
        
        res.json({
          access_token: accessToken,
          token_type: 'Bearer',
          expires_in: 3600, // 1 hour
          refresh_token: refreshToken
        });
      } else if (grant_type === 'refresh_token') {
        const { refresh_token } = req.body;
        
        if (!refresh_token) {
          return res.status(400).json({ error: 'Refresh token required' });
        }
        
        // Verify refresh token
        jwt.verify(refresh_token, JWT_SECRET, (err: any, decoded: any) => {
          if (err || !decoded || decoded.type !== 'refresh' || decoded.client_id !== client_id) {
            return res.status(401).json({ error: 'Invalid refresh token' });
          }
          
          // Generate new access token
          const accessToken = jwt.sign({ 
            client_id, 
            scope: 'read profile' // Example scope - ideally would take from the refresh token
          }, JWT_SECRET, { expiresIn: '1h' });
          
          res.json({
            access_token: accessToken,
            token_type: 'Bearer',
            expires_in: 3600, // 1 hour
          });
        });
      } else {
        res.status(400).json({ error: 'Unsupported grant type' });
      }
    } catch (err) {
      handleErrors(err, res);
    }
  });
  
  // Protected resource endpoint
  app.get('/oauth/userinfo', verifyToken, async (req: Request, res: Response) => {
    // Here we'd normally use the user ID from the token to fetch user data
    // For now, just return some demo data
    res.json({
      id: (req as any).user.sub || '12345',
      name: 'Demo User',
      email: 'demo@tralla.com',
      picture: 'https://via.placeholder.com/150'
    });
  });
  
  // OAuth client routes (Tralla as a Client)
  
  // This would integrate with external providers like Google, Facebook, etc.
  app.post('/api/auth/oauth/:provider', async (req: Request, res: Response) => {
    try {
      const { provider } = req.params;
      const { accessToken, refreshToken, profile } = req.body;
      
      // Validate the request
      if (!accessToken || !profile) {
        return res.status(400).json({ error: 'Invalid OAuth data' });
      }
      
      // Use the profile data to find or create a user
      const user = await storage.findOrCreateUserByOAuth(
        { ...profile, provider },
        accessToken,
        refreshToken || ''
      );
      
      // Create a JWT token for the user
      const token = jwt.sign({ 
        userId: user.id,
        username: user.username
      }, JWT_SECRET, { expiresIn: '24h' });
      
      // Remove password from user data
      const { password, ...userWithoutPassword } = user;
      
      res.json({
        token,
        user: userWithoutPassword
      });
    } catch (err) {
      handleErrors(err, res);
    }
  });

  // Stripe payment integration
  app.post('/api/payment/create-intent', async (req: Request, res: Response) => {
    try {
      // Ensure we have STRIPE_SECRET_KEY
      if (!process.env.STRIPE_SECRET_KEY) {
        return res.status(500).json({ error: 'Stripe secret key is not configured' });
      }
      
      const { amount, currency = 'usd' } = req.body;
      
      if (!amount) {
        return res.status(400).json({ error: 'Amount is required' });
      }
      
      // In a real implementation, you would use the Stripe SDK:
      // const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
      // const paymentIntent = await stripe.paymentIntents.create({
      //   amount: Math.round(amount * 100), // Convert to cents
      //   currency,
      // });
      
      // For now, return a mock payment intent
      res.json({
        clientSecret: 'mock_client_secret_' + Math.random().toString(36).substring(2, 15),
        amount,
        currency
      });
    } catch (err) {
      handleErrors(err, res);
    }
  });
  
  // Configure multer for file uploads
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const uploadDir = path.join(__dirname, '../uploads');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const storage2 = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const uniquePrefix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      const ext = path.extname(file.originalname);
      cb(null, uniquePrefix + ext);
    },
  });
  
  const upload = multer({ 
    storage: storage2,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max size
    fileFilter: (req, file, cb) => {
      // Accept only images
      if (file.mimetype.startsWith('image/')) {
        cb(null, true);
      } else {
        cb(new Error('Only image files are allowed'));
      }
    },
  });

  // Facial Recognition Routes
  app.post('/api/facial-recognition/register', upload.single('image'), async (req: Request, res: Response) => {
    try {
      const userId = Number(req.body.userId);
      
      if (!req.file) {
        return res.status(400).json({ error: 'No image file provided' });
      }
      
      const imageBuffer = fs.readFileSync(req.file.path);
      
      // Register face for user
      const success = await facialRecognition.registerUserFace(imageBuffer, userId);
      
      // Clean up the uploaded file
      fs.unlinkSync(req.file.path);
      
      if (success) {
        res.status(200).json({ success: true, message: 'Face registered successfully' });
      } else {
        res.status(400).json({ success: false, message: 'Failed to register face. No face detected in the image.' });
      }
    } catch (err) {
      handleErrors(err, res);
    }
  });
  
  app.post('/api/facial-recognition/identify', upload.single('image'), async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No image file provided' });
      }
      
      const imageBuffer = fs.readFileSync(req.file.path);
      
      // Identify user from face
      const userId = await facialRecognition.identifyUserFromImage(imageBuffer);
      
      // Clean up the uploaded file
      fs.unlinkSync(req.file.path);
      
      if (userId) {
        // Get user details
        const user = await storage.getUser(userId);
        if (user) {
          // Return user without password
          const { password, ...userWithoutPassword } = user;
          res.status(200).json({ success: true, user: userWithoutPassword });
        } else {
          res.status(404).json({ success: false, message: 'Identified user not found in database' });
        }
      } else {
        res.status(404).json({ success: false, message: 'No matching face found' });
      }
    } catch (err) {
      handleErrors(err, res);
    }
  });
  
  app.post('/api/facial-recognition/analyze', upload.single('image'), async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No image file provided' });
      }
      
      const imageBuffer = fs.readFileSync(req.file.path);
      
      // Get face features from image
      const features = await facialRecognition.getFaceFeaturesFromImage(imageBuffer);
      
      // Clean up the uploaded file
      fs.unlinkSync(req.file.path);
      
      if (features) {
        res.status(200).json({ success: true, features });
      } else {
        res.status(404).json({ success: false, message: 'No faces detected in the image' });
      }
    } catch (err) {
      handleErrors(err, res);
    }
  });
  
  return httpServer;
}
