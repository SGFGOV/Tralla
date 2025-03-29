import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  onSendVirtualHug: () => void;
  onSendVirtualKiss: () => void;
}

export default function ChatInput({ 
  onSendMessage, 
  onSendVirtualHug, 
  onSendVirtualKiss 
}: ChatInputProps) {
  const [message, setMessage] = useState("");
  const [showVirtualActions, setShowVirtualActions] = useState(false);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim()) {
      onSendMessage(message.trim());
      setMessage("");
    }
  };
  
  return (
    <div className="bg-white p-3 border-t border-neutral-200">
      <form onSubmit={handleSubmit} className="flex items-center">
        <Button 
          type="button" 
          variant="ghost" 
          size="icon" 
          className="text-neutral-500"
          onClick={() => setShowVirtualActions(!showVirtualActions)}
        >
          <i className="fas fa-plus"></i>
        </Button>
        
        <Input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type a message..."
          className="mx-2 bg-neutral-100 border-none"
        />
        
        <Button type="submit" size="icon" disabled={!message.trim()}>
          <i className="fas fa-paper-plane"></i>
        </Button>
      </form>
      
      {showVirtualActions && (
        <div className="flex mt-2 space-x-2 p-2 bg-neutral-50 rounded-lg">
          <Button 
            variant="outline" 
            className="flex-1"
            onClick={() => {
              onSendVirtualHug();
              setShowVirtualActions(false);
            }}
          >
            <i className="fas fa-hands-heart text-accent mr-2"></i>
            Send Hug
          </Button>
          
          <Button 
            variant="outline" 
            className="flex-1"
            onClick={() => {
              onSendVirtualKiss();
              setShowVirtualActions(false);
            }}
          >
            <i className="fas fa-kiss-wink-heart text-primary mr-2"></i>
            Send Kiss
          </Button>
        </div>
      )}
    </div>
  );
}
