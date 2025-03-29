import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../contexts/auth-context";
import { Link } from "wouter";
import ChatListItem from "@/components/ui/chat-list-item";
import { useWebSocket } from "@/hooks/use-web-socket";
import { useToast } from "@/hooks/use-toast";

export default function Chats() {
  const { user } = useAuth();
  const { messageReceived, resetMessageReceived } = useWebSocket(user?.id);
  const { toast } = useToast();

  // Query recent chats
  const { 
    data: chats = [], 
    isLoading, 
    refetch 
  } = useQuery({ 
    queryKey: [`/api/users/${user?.id}/chats`],
    enabled: !!user?.id,
  });

  // Refetch chats when new message is received
  useEffect(() => {
    if (messageReceived) {
      refetch();
      resetMessageReceived();
    }
  }, [messageReceived, refetch, resetMessageReceived]);

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="bg-white border-b border-neutral-200 p-4">
        <h2 className="font-semibold text-neutral-800">Recent Chats</h2>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : chats.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-neutral-100 flex items-center justify-center mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-neutral-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-neutral-800">No chats yet</h3>
          <p className="text-sm text-neutral-500 mt-1">
            Start a conversation with someone nearby
          </p>
        </div>
      ) : (
        <div>
          {chats.map((chat) => (
            <Link key={chat.user.id} href={`/chats/${chat.user.id}`}>
              <a>
                <ChatListItem 
                  user={chat.user}
                  lastMessage={chat.lastMessage}
                />
              </a>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
