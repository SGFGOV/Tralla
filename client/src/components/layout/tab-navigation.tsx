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
    } else if (location.startsWith('/facial-recognition')) {
      setActiveTab('facial-recognition');
    }
  }, [location]);
  
  // Handle tab click
  const handleTabClick = (tab: string) => {
    navigate(`/${tab}`);
  };
  
  return (
    <div className="px-1 sm:px-2 border-b border-neutral-200">
      <div className="flex flex-wrap">
        <button 
          className={`flex-1 py-2 sm:py-3 px-1 sm:px-2 font-medium text-xs sm:text-sm ${
            activeTab === 'nearby' 
              ? 'text-primary border-b-2 border-primary' 
              : 'text-neutral-500'
          }`}
          onClick={() => handleTabClick('nearby')}
        >
          <i className="fas fa-location-dot mr-1"></i> 
          <span className="hidden xs:inline">Nearby</span>
        </button>
        
        <button 
          className={`flex-1 py-2 sm:py-3 px-1 sm:px-2 font-medium text-xs sm:text-sm ${
            activeTab === 'chats' 
              ? 'text-primary border-b-2 border-primary' 
              : 'text-neutral-500'
          }`}
          onClick={() => handleTabClick('chats')}
        >
          <i className="fas fa-comment mr-1"></i> 
          <span className="hidden xs:inline">Chats</span>
        </button>
        
        <button 
          className={`flex-1 py-2 sm:py-3 px-1 sm:px-2 font-medium text-xs sm:text-sm ${
            activeTab === 'groups' 
              ? 'text-primary border-b-2 border-primary' 
              : 'text-neutral-500'
          }`}
          onClick={() => handleTabClick('groups')}
        >
          <i className="fas fa-users mr-1"></i> 
          <span className="hidden xs:inline">Groups</span>
        </button>
        
        <button 
          className={`flex-1 py-2 sm:py-3 px-1 sm:px-2 font-medium text-xs sm:text-sm ${
            activeTab === 'profile' 
              ? 'text-primary border-b-2 border-primary' 
              : 'text-neutral-500'
          }`}
          onClick={() => handleTabClick('profile')}
        >
          <i className="fas fa-user mr-1"></i> 
          <span className="hidden xs:inline">Profile</span>
        </button>
        
        <button 
          className={`flex-1 py-2 sm:py-3 px-1 sm:px-2 font-medium text-xs sm:text-sm ${
            activeTab === 'facial-recognition' 
              ? 'text-primary border-b-2 border-primary' 
              : 'text-neutral-500'
          }`}
          onClick={() => handleTabClick('facial-recognition')}
        >
          <i className="fas fa-camera mr-1"></i> 
          <span className="hidden xs:inline">Face ID</span>
        </button>
      </div>
    </div>
  );
}
