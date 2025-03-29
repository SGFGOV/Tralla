import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils/user-utils";
import { Message, User } from "@shared/schema";

interface ChatListItemProps {
  user: User;
  lastMessage: Message;
}

export default function ChatListItem({ user, lastMessage }: ChatListItemProps) {
  // Format timestamp
  const formatTime = (dateStr: string | Date) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    // If less than a day, show time
    if (diff < 24 * 60 * 60 * 1000) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    
    // If less than a week, show day
    if (diff < 7 * 24 * 60 * 60 * 1000) {
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      return days[date.getDay()];
    }
    
    // Otherwise show date
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };
  
  // Get message content based on type
  const getMessageContent = () => {
    if (lastMessage.type === 'virtual_hug') {
      return 'Sent a virtual hug';
    } else if (lastMessage.type === 'virtual_kiss') {
      return 'Sent a virtual kiss';
    } else {
      return lastMessage.content;
    }
  };

  // Check if there are unread messages
  const hasUnread = !lastMessage.read;
  
  return (
    <div className={`p-4 border-b border-neutral-200 flex items-center ${hasUnread ? 'bg-primary bg-opacity-5' : ''}`}>
      <div className="relative">
        <Avatar className="h-12 w-12">
          <AvatarImage src={user.avatar} alt={`${user.displayName} profile picture`} />
          <AvatarFallback>{getInitials(user.displayName)}</AvatarFallback>
        </Avatar>
        <div className={`absolute bottom-0 right-0 w-3 h-3 ${
          user.online ? 'bg-success' : 'bg-neutral-400'
        } rounded-full border-2 border-white`}></div>
      </div>
      
      <div className="ml-3 flex-1">
        <div className="flex justify-between">
          <h3 className="font-medium">{user.displayName}</h3>
          <span className="text-xs text-neutral-500">{formatTime(lastMessage.createdAt)}</span>
        </div>
        <p className={`text-sm ${hasUnread ? 'font-medium text-neutral-800' : 'text-neutral-600'} truncate`}>
          {getMessageContent()}
        </p>
      </div>
      
      {hasUnread && (
        <div className="ml-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center text-white text-xs font-medium">
          1
        </div>
      )}
    </div>
  );
}
