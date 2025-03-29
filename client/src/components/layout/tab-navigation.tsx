import { useLocation } from "wouter";
import { useEffect, useState } from "react";

export default function TabNavigation() {
  const [location, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState('nearby');
  
  // Set active tab based on location
  useEffect(() => {
    if (location === '/' || location === '/nearby') {
      setActiveTab('nearby');
    } else if (location.startsWith('/chats')) {
      setActiveTab('chats');
    } else if (location.startsWith('/groups')) {
      setActiveTab('groups');
    } else if (location.startsWith('/profile')) {
      setActiveTab('profile');
    }
  }, [location]);
  
  // Handle tab click
  const handleTabClick = (tab: string) => {
    navigate(`/${tab}`);
  };
  
  return (
    <div className="px-2 border-b border-neutral-200">
      <div className="flex">
        <button 
          className={`flex-1 py-3 px-2 font-medium text-sm ${
            activeTab === 'nearby' 
              ? 'text-primary border-b-2 border-primary' 
              : 'text-neutral-500'
          }`}
          onClick={() => handleTabClick('nearby')}
        >
          <i className="fas fa-location-dot mr-1"></i> Nearby
        </button>
        
        <button 
          className={`flex-1 py-3 px-2 font-medium text-sm ${
            activeTab === 'chats' 
              ? 'text-primary border-b-2 border-primary' 
              : 'text-neutral-500'
          }`}
          onClick={() => handleTabClick('chats')}
        >
          <i className="fas fa-comment mr-1"></i> Chats
        </button>
        
        <button 
          className={`flex-1 py-3 px-2 font-medium text-sm ${
            activeTab === 'groups' 
              ? 'text-primary border-b-2 border-primary' 
              : 'text-neutral-500'
          }`}
          onClick={() => handleTabClick('groups')}
        >
          <i className="fas fa-users mr-1"></i> Groups
        </button>
        
        <button 
          className={`flex-1 py-3 px-2 font-medium text-sm ${
            activeTab === 'profile' 
              ? 'text-primary border-b-2 border-primary' 
              : 'text-neutral-500'
          }`}
          onClick={() => handleTabClick('profile')}
        >
          <i className="fas fa-user mr-1"></i> Profile
        </button>
      </div>
    </div>
  );
}
