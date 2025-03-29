import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils/user-utils";
import { Message, User } from "@shared/schema";

interface ChatMessageProps {
  message: Message;
  isCurrentUser: boolean;
  otherUser?: User;
}

export default function ChatMessage({ 
  message, 
  isCurrentUser, 
  otherUser 
}: ChatMessageProps) {
  // Format timestamp
  const formatTime = (dateStr: string | Date) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  // Handle virtual interaction messages
  if (message.type === 'virtual_hug' || message.type === 'virtual_kiss') {
    return (
      <div className="my-6 flex justify-center">
        <div className="bg-neutral-100 px-4 py-2 rounded-full text-xs text-neutral-600">
          <i className={`fas fa-${message.type === 'virtual_hug' ? 'hands-heart' : 'kiss-wink-heart'} ${
            message.type === 'virtual_hug' ? 'text-accent' : 'text-primary'
          } mr-1`}></i>
          {isCurrentUser 
            ? `You sent a virtual ${message.type === 'virtual_hug' ? 'hug' : 'kiss'}`
            : `${otherUser?.displayName || 'User'} sent you a virtual ${message.type === 'virtual_hug' ? 'hug' : 'kiss'}`
          }
        </div>
      </div>
    );
  }
  
  // Regular message
  return (
    <div className={`mb-4 flex ${isCurrentUser ? 'justify-end' : ''}`}>
      {!isCurrentUser && (
        <Avatar className="h-8 w-8 mr-2 flex-shrink-0">
          <AvatarImage src={otherUser?.avatar} alt={otherUser?.displayName} />
          <AvatarFallback>{otherUser ? getInitials(otherUser.displayName) : 'U'}</AvatarFallback>
        </Avatar>
      )}
      
      <div className={`max-w-[75%] ${isCurrentUser ? 'mr-2' : 'ml-2'}`}>
        <div className={`p-3 rounded-xl shadow-sm ${
          isCurrentUser 
            ? 'bg-primary text-white rounded-br-none' 
            : 'bg-white rounded-bl-none'
        }`}>
          <p className={isCurrentUser ? 'text-white' : 'text-neutral-800'}>
            {message.content}
          </p>
        </div>
        
        <div className={`text-xs text-neutral-500 mt-1 ${
          isCurrentUser ? 'text-right' : ''
        }`}>
          {formatTime(message.createdAt)}
        </div>
      </div>
    </div>
  );
}
