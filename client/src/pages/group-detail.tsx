import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../contexts/auth-context";
import { useWebSocket } from "@/hooks/use-web-socket";
import { useLocation } from "wouter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Group, GroupMessage, User } from "@shared/schema";
import ExpenseSplitter from "@/components/ui/expense-splitter";
import { getInitials } from "@/lib/utils/user-utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";

interface GroupDetailProps {
  id: number;
}

export default function GroupDetail({ id }: GroupDetailProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [_, navigate] = useLocation();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { sendGroupMessage } = useWebSocket(user?.id);
  const [message, setMessage] = useState("");
  const { toast } = useToast();
  const [inviteDialog, setInviteDialog] = useState(false);
  const [inviteUsername, setInviteUsername] = useState("");

  // Queries
  const { data: group } = useQuery<Group>({
    queryKey: [`/api/groups/${id}`],
    enabled: !!id
  });

  const { data: members = [] } = useQuery<(User & { role: string })[]>({
    queryKey: [`/api/groups/${id}/members`],
    enabled: !!id
  });

  const { data: messages = [] } = useQuery<(GroupMessage & { sender: User })[]>({
    queryKey: [`/api/groups/${id}/messages`],
    enabled: !!id
  });

  // Mutations
  const inviteMutation = useMutation({
    mutationFn: async (username: string) => {
      // First find user by username
      const userResponse = await fetch(`/api/users/search?username=${encodeURIComponent(username)}`);
      if (!userResponse.ok) {
        throw new Error("User not found");
      }
      const foundUser = await userResponse.json();
      
      // Add to group
      return apiRequest('POST', `/api/groups/${id}/members`, {
        groupId: id,
        userId: foundUser.id,
        role: 'member'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/groups/${id}/members`] });
      setInviteDialog(false);
      setInviteUsername("");
      toast({
        title: "Invitation Sent",
        description: "User has been added to the group",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to invite user: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  // Scrolling
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle send message
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    
    sendGroupMessage(id, message.trim());
    setMessage("");
    
    // Refetch messages
    setTimeout(() => {
      queryClient.invalidateQueries({ queryKey: [`/api/groups/${id}/messages`] });
    }, 500);
  };

  // Handle invite
  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteUsername.trim()) return;
    inviteMutation.mutate(inviteUsername.trim());
  };

  // Group icon
  const groupIcon = group?.icon || "users";

  if (!group) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Header */}
      <header className="bg-white px-4 py-3 flex items-center border-b border-neutral-200">
        <Button 
          variant="ghost" 
          size="icon" 
          className="mr-2"
          onClick={() => navigate('/groups')}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </Button>
        
        <div className="flex items-center">
          <div className="w-10 h-10 rounded-lg overflow-hidden bg-neutral-200 flex items-center justify-center text-primary">
            <i className={`fas fa-${groupIcon} text-xl`}></i>
          </div>
          
          <div className="ml-3">
            <h2 className="font-semibold text-neutral-800">{group.name}</h2>
            <div className="text-xs text-neutral-500">
              {members.length} members
            </div>
          </div>
        </div>
        
        <div className="ml-auto">
          <Dialog open={inviteDialog} onOpenChange={setInviteDialog}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M19 8l-2 3h4l-2 3" />
                </svg>
              </Button>
            </DialogTrigger>
            
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Invite to {group.name}</DialogTitle>
              </DialogHeader>
              
              <form onSubmit={handleInvite} className="space-y-4 pt-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Username</label>
                  <Input 
                    value={inviteUsername}
                    onChange={(e) => setInviteUsername(e.target.value)}
                    placeholder="Enter username to invite"
                  />
                </div>
                
                <DialogFooter>
                  <Button type="submit" disabled={inviteMutation.isPending}>
                    {inviteMutation.isPending ? "Inviting..." : "Invite User"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </header>
      
      {/* Tabs */}
      <Tabs defaultValue="chat" className="flex-1 flex flex-col">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="chat">Chat</TabsTrigger>
          <TabsTrigger value="expenses">Split Bills</TabsTrigger>
          <TabsTrigger value="events">Events</TabsTrigger>
        </TabsList>
        
        {/* Chat Tab */}
        <TabsContent value="chat" className="flex-1 flex flex-col">
          <div className="flex-1 overflow-y-auto p-4 bg-neutral-50">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="w-16 h-16 rounded-full bg-neutral-100 flex items-center justify-center mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-neutral-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-neutral-800">No messages yet</h3>
                <p className="text-sm text-neutral-500 mt-1">
                  Be the first to send a message to this group
                </p>
              </div>
            ) : (
              messages.map((msg) => (
                <div key={msg.id} className={`mb-4 flex ${msg.senderId === user?.id ? 'justify-end' : ''}`}>
                  {msg.senderId !== user?.id && (
                    <Avatar className="h-8 w-8 mr-2 flex-shrink-0">
                      <AvatarImage src={msg.sender.avatar} alt={msg.sender.displayName} />
                      <AvatarFallback>{getInitials(msg.sender.displayName)}</AvatarFallback>
                    </Avatar>
                  )}
                  
                  <div className={`max-w-[75%] ${msg.senderId === user?.id ? 'ml-2' : 'mr-2'}`}>
                    {msg.senderId !== user?.id && (
                      <div className="text-xs text-neutral-600 mb-1">
                        {msg.sender.displayName}
                      </div>
                    )}
                    
                    <div className={`p-3 rounded-xl shadow-sm ${
                      msg.senderId === user?.id 
                      ? 'bg-primary text-white rounded-br-none' 
                      : 'bg-white rounded-bl-none'
                    }`}>
                      <p className={msg.senderId === user?.id ? 'text-white' : 'text-neutral-800'}>
                        {msg.content}
                      </p>
                    </div>
                    
                    <div className={`text-xs text-neutral-500 mt-1 ${
                      msg.senderId === user?.id ? 'text-right' : ''
                    }`}>
                      {new Date(msg.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </div>
                  </div>
                </div>
              ))
            )}
            
            <div ref={messagesEndRef} />
          </div>
          
          {/* Input */}
          <div className="bg-white p-3 border-t border-neutral-200">
            <form onSubmit={handleSendMessage} className="flex items-center">
              <Button type="button" variant="ghost" size="icon" className="text-neutral-500">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2" />
                  <path d="M18 14h-8" />
                  <path d="M15 18h-5" />
                  <path d="M10 6h8v4h-8V6Z" />
                </svg>
              </Button>
              
              <Input
                type="text"
                placeholder="Type a message..."
                className="mx-2 bg-neutral-100 border-none"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
              
              <Button type="submit" size="icon" disabled={!message.trim()}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 2L11 13" />
                  <path d="M22 2l-7 20-4-9-9-4 20-7z" />
                </svg>
              </Button>
            </form>
          </div>
        </TabsContent>
        
        {/* Expenses Tab */}
        <TabsContent value="expenses" className="flex-1 overflow-y-auto">
          <ExpenseSplitter groupId={id} members={members} />
        </TabsContent>
        
        {/* Events Tab */}
        <TabsContent value="events" className="flex-1 overflow-y-auto p-4">
          <div className="bg-white rounded-lg p-4 border border-neutral-200">
            <h3 className="font-semibold text-lg mb-4">Upcoming Events</h3>
            
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="w-16 h-16 rounded-full bg-neutral-100 flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-neutral-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="16" y1="2" x2="16" y2="6"></line>
                  <line x1="8" y1="2" x2="8" y2="6"></line>
                  <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
              </div>
              <h3 className="text-lg font-medium text-neutral-800">No events scheduled</h3>
              <p className="text-sm text-neutral-500 mt-1">
                Plan your next activity with this group
              </p>
              <Button className="mt-4" onClick={() => toast({
                title: "Coming Soon",
                description: "Event planning will be available soon!",
              })}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 5v14M5 12h14" />
                </svg>
                Create Event
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
