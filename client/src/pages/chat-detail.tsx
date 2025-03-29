import { useState, useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../contexts/auth-context";
import { useWebSocket } from "@/hooks/use-web-socket";
import { useLocation } from "wouter";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import ChatMessage from "@/components/ui/chat-message";
import ChatInput from "@/components/ui/chat-input";
import { Button } from "@/components/ui/button";
import { Message, User } from "@shared/schema";
import { getInitials } from "@/lib/utils/user-utils";

interface ChatDetailProps {
  id: number;
}

export default function ChatDetail({ id }: ChatDetailProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [_, navigate] = useLocation();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { 
    messageReceived, 
    sendChatMessage, 
    sendVirtualInteraction 
  } = useWebSocket(user?.id);

  // Query other user's details
  const { data: otherUser } = useQuery<User>({ 
    queryKey: [`/api/users/${id}`],
    enabled: !!id,
  });

  // Query messages
  const { data: messages = [] } = useQuery<Message[]>({ 
    queryKey: [`/api/messages/${user?.id}/${id}`],
    enabled: !!user?.id && !!id,
  });

  // Mark messages as read
  useEffect(() => {
    if (messages.length > 0 && user?.id) {
      messages.forEach(message => {
        if (message.receiverId === user.id && !message.read) {
          fetch(`/api/messages/${message.id}/read`, {
            method: 'PATCH',
          });
        }
      });
    }
  }, [messages, user?.id]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Refresh messages when new message is received
  useEffect(() => {
    if (messageReceived && (
      messageReceived.senderId === id || messageReceived.receiverId === id
    )) {
      queryClient.invalidateQueries({ 
        queryKey: [`/api/messages/${user?.id}/${id}`]
      });
    }
  }, [messageReceived, id, user?.id, queryClient]);

  const handleSendMessage = (content: string) => {
    if (!content.trim()) return;
    sendChatMessage(id, content);
  };

  const handleSendVirtualHug = () => {
    sendVirtualInteraction(id, 'virtual_hug');
  };

  const handleSendVirtualKiss = () => {
    sendVirtualInteraction(id, 'virtual_kiss');
  };

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Header */}
      <header className="bg-white px-4 py-3 flex items-center border-b border-neutral-200">
        <Button 
          variant="ghost" 
          size="icon" 
          className="mr-2"
          onClick={() => navigate('/chats')}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </Button>
        
        <div className="flex items-center">
          <Avatar className="h-10 w-10">
            <AvatarImage src={otherUser?.avatar} alt={otherUser?.displayName} />
            <AvatarFallback>{otherUser ? getInitials(otherUser.displayName) : 'U'}</AvatarFallback>
          </Avatar>
          
          <div className="ml-3">
            <h2 className="font-semibold text-neutral-800">{otherUser?.displayName}</h2>
            <div className="text-xs text-neutral-500">
              {otherUser?.online ? 'Online' : 'Offline'}
            </div>
          </div>
        </div>
        
        <div className="ml-auto">
          <Button variant="ghost" size="icon">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="1" />
              <circle cx="12" cy="5" r="1" />
              <circle cx="12" cy="19" r="1" />
            </svg>
          </Button>
        </div>
      </header>
      
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 bg-neutral-50">
        {messages.map((message) => (
          <ChatMessage
            key={message.id}
            message={message}
            isCurrentUser={message.senderId === user?.id}
            otherUser={otherUser}
          />
        ))}
        
        <div ref={messagesEndRef} />
      </div>
      
      {/* Input */}
      <ChatInput 
        onSendMessage={handleSendMessage}
        onSendVirtualHug={handleSendVirtualHug}
        onSendVirtualKiss={handleSendVirtualKiss}
      />
    </div>
  );
}
