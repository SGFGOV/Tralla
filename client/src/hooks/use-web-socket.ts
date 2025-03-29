import { useEffect, useRef, useState, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";

interface WebSocketMessage {
  type: string;
  payload: any;
}

export const useWebSocket = (userId: number | undefined) => {
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<WebSocket | null>(null);
  const { toast } = useToast();
  
  const [nearbyUsers, setNearbyUsers] = useState<any[]>([]);
  const [messageReceived, setMessageReceived] = useState<any | null>(null);
  const [virtualInteraction, setVirtualInteraction] = useState<any | null>(null);
  const [userStatusChanges, setUserStatusChanges] = useState<any[]>([]);

  // Initialize connection
  useEffect(() => {
    if (!userId) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    const socket = new WebSocket(wsUrl);
    socketRef.current = socket;

    socket.onopen = () => {
      setConnected(true);
      // Authenticate on connection
      sendMessage({
        type: 'auth',
        payload: { userId },
      });
      
      toast({
        title: "Connected",
        description: "Real-time connection established",
      });
    };

    socket.onclose = () => {
      setConnected(false);
      toast({
        title: "Disconnected",
        description: "Real-time connection lost, trying to reconnect...",
        variant: "destructive",
      });
    };

    socket.onerror = (error) => {
      console.error("WebSocket error:", error);
      toast({
        title: "Connection Error",
        description: "Failed to establish real-time connection",
        variant: "destructive",
      });
    };

    socket.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data);
        
        // Handle different message types
        switch (message.type) {
          case 'nearby_users':
            setNearbyUsers(message.payload);
            break;
          case 'new_message':
          case 'message_sent':
            setMessageReceived(message.payload);
            break;
          case 'virtual_interaction':
            setVirtualInteraction(message.payload);
            toast({
              title: `${message.payload.sender.displayName} sent you a ${message.payload.message.type === 'virtual_hug' ? 'hug' : 'kiss'}`,
              description: "Send one back!",
            });
            break;
          case 'user_status_change':
            setUserStatusChanges(prev => [...prev, message.payload]);
            break;
          default:
            console.log('Unhandled message type:', message.type);
        }
      } catch (error) {
        console.error("Error parsing WebSocket message:", error);
      }
    };

    // Clean up on unmount
    return () => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.close();
      }
    };
  }, [userId, toast]);

  // Function to send messages
  const sendMessage = useCallback((message: WebSocketMessage) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(message));
      return true;
    }
    return false;
  }, []);

  // Location update
  const updateLocation = useCallback((latitude: number, longitude: number) => {
    return sendMessage({
      type: 'location_update',
      payload: { latitude, longitude },
    });
  }, [sendMessage]);

  // Send chat message
  const sendChatMessage = useCallback((receiverId: number, content: string, type: string = 'text') => {
    return sendMessage({
      type: 'new_message',
      payload: { receiverId, content, type },
    });
  }, [sendMessage]);

  // Send group message
  const sendGroupMessage = useCallback((groupId: number, content: string, type: string = 'text') => {
    return sendMessage({
      type: 'new_group_message',
      payload: { groupId, content, type },
    });
  }, [sendMessage]);

  // Send virtual interaction (hug/kiss)
  const sendVirtualInteraction = useCallback((receiverId: number, interactionType: 'virtual_hug' | 'virtual_kiss') => {
    return sendMessage({
      type: 'virtual_interaction',
      payload: { receiverId, interactionType },
    });
  }, [sendMessage]);

  // Reset state when message is processed
  const resetMessageReceived = useCallback(() => {
    setMessageReceived(null);
  }, []);

  // Reset state when virtual interaction is processed
  const resetVirtualInteraction = useCallback(() => {
    setVirtualInteraction(null);
  }, []);

  // Reset state when user status changes are processed
  const resetUserStatusChanges = useCallback(() => {
    setUserStatusChanges([]);
  }, []);

  return {
    connected,
    nearbyUsers,
    messageReceived,
    virtualInteraction,
    userStatusChanges,
    updateLocation,
    sendChatMessage,
    sendGroupMessage,
    sendVirtualInteraction,
    resetMessageReceived,
    resetVirtualInteraction,
    resetUserStatusChanges,
  };
};
