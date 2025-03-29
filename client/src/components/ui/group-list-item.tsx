import { Group } from "@shared/schema";

interface GroupListItemProps {
  group: Group;
}

export default function GroupListItem({ group }: GroupListItemProps) {
  // Default icon if not provided
  const icon = group.icon || "users";
  
  return (
    <div className="p-4 border-b border-neutral-200 hover:bg-neutral-50 transition-colors">
      <div className="flex items-center">
        <div className="w-12 h-12 rounded-lg overflow-hidden bg-neutral-200 flex items-center justify-center text-primary">
          <i className={`fas fa-${icon} text-2xl`}></i>
        </div>
        
        <div className="ml-3 flex-1">
          <div className="flex justify-between">
            <h3 className="font-medium">{group.name}</h3>
            <span className="text-xs text-neutral-500">{formatDate(group.createdAt)}</span>
          </div>
          <p className="text-sm text-neutral-600 truncate">
            {group.description || "No description provided."}
          </p>
        </div>
      </div>
      
      {/* Group Features */}
      <div className="mt-3 grid grid-cols-3 gap-2">
        <button className="p-2 text-center text-xs bg-neutral-100 rounded text-neutral-700">
          <i className="fas fa-comments block mb-1 text-secondary"></i>
          Chat
        </button>
        <button className="p-2 text-center text-xs bg-neutral-100 rounded text-neutral-700">
          <i className="fas fa-calendar-alt block mb-1 text-secondary"></i>
          Events
        </button>
        <button className="p-2 text-center text-xs bg-neutral-100 rounded text-neutral-700">
          <i className="fas fa-calculator block mb-1 text-secondary"></i>
          Split Bill
        </button>
      </div>
    </div>
  );
}

// Helper function to format date
function formatDate(dateStr: string | Date): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  
  // If less than a day
  if (diff < 24 * 60 * 60 * 1000) {
    const hours = Math.floor(diff / (60 * 60 * 1000));
    return hours === 0 ? 'Today' : `${hours}h ago`;
  }
  
  // If less than a week
  if (diff < 7 * 24 * 60 * 60 * 1000) {
    const days = Math.floor(diff / (24 * 60 * 60 * 1000));
    return `${days}d ago`;
  }
  
  // Otherwise show date
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}
