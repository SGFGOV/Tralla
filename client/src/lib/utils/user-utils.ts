/**
 * User-related utility functions
 */

// Get initials from a user's display name
export function getInitials(displayName: string): string {
  if (!displayName) return '?';
  
  const names = displayName.split(' ');
  
  if (names.length === 1) {
    return names[0].charAt(0).toUpperCase();
  }
  
  return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
}

// Format last active time
export function formatLastActive(lastActive: string | Date): string {
  const lastActiveDate = new Date(lastActive);
  const now = new Date();
  const diffMs = now.getTime() - lastActiveDate.getTime();
  
  // Less than a minute
  if (diffMs < 60000) {
    return 'Just now';
  }
  
  // Less than an hour
  if (diffMs < 3600000) {
    const minutes = Math.floor(diffMs / 60000);
    return `${minutes}m ago`;
  }
  
  // Less than a day
  if (diffMs < 86400000) {
    const hours = Math.floor(diffMs / 3600000);
    return `${hours}h ago`;
  }
  
  // Less than a week
  if (diffMs < 604800000) {
    const days = Math.floor(diffMs / 86400000);
    return `${days}d ago`;
  }
  
  // More than a week
  return lastActiveDate.toLocaleDateString();
}

// Format birthday to display format
export function formatBirthday(birthday: string | Date | null | undefined): string {
  if (!birthday) return '';
  
  const date = new Date(birthday);
  return date.toLocaleDateString(undefined, { month: 'long', day: 'numeric' });
}

// Calculate age from birthday
export function calculateAge(birthday: string | Date | null | undefined): number | null {
  if (!birthday) return null;
  
  const birthDate = new Date(birthday);
  const today = new Date();
  
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  // If birthday hasn't occurred yet this year
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
}

// Calculate days until birthday
export function getDaysUntilBirthday(birthday: string | Date | null | undefined): number | null {
  if (!birthday) return null;
  
  const today = new Date();
  const birthDate = new Date(birthday);
  
  // Set birth date to this year
  const birthThisYear = new Date(
    today.getFullYear(),
    birthDate.getMonth(),
    birthDate.getDate()
  );
  
  // If birthday has passed this year, set it to next year
  if (birthThisYear < today) {
    birthThisYear.setFullYear(birthThisYear.getFullYear() + 1);
  }
  
  // Calculate days difference
  const difference = birthThisYear.getTime() - today.getTime();
  return Math.ceil(difference / (1000 * 60 * 60 * 24));
}

// Filter users by interest
export function filterUsersByInterest(users: any[], interest: string): any[] {
  return users.filter(user => 
    user.interests && 
    user.interests.some((i: string) => 
      i.toLowerCase().includes(interest.toLowerCase())
    )
  );
}

// Get common interests between two users
export function getCommonInterests(user1Interests: string[], user2Interests: string[]): string[] {
  if (!user1Interests || !user2Interests) return [];
  
  return user1Interests.filter(interest => 
    user2Interests.includes(interest)
  );
}

// Check if users are friends
export function areFriends(friendships: any[], userId: number, otherUserId: number): boolean {
  return friendships.some(
    friendship => 
      friendship.status === 'accepted' && 
      ((friendship.userId === userId && friendship.friendId === otherUserId) ||
       (friendship.userId === otherUserId && friendship.friendId === userId))
  );
}
