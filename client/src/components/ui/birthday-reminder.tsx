import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils/user-utils";
import { Button } from "@/components/ui/button";
import { User } from "@shared/schema";

interface BirthdayReminderProps {
  contacts: User[];
}

export default function BirthdayReminder({ contacts }: BirthdayReminderProps) {
  // Get contacts with birthdays
  const contactsWithBirthdays = contacts.filter(contact => contact.birthday);
  
  // Calculate days until birthday
  const getDaysUntilBirthday = (birthday: string | Date | null | undefined) => {
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
  };
  
  // Sort contacts by upcoming birthdays
  const sortedContacts = [...contactsWithBirthdays].sort((a, b) => {
    const daysA = getDaysUntilBirthday(a.birthday) || 365;
    const daysB = getDaysUntilBirthday(b.birthday) || 365;
    return daysA - daysB;
  });
  
  // Format birthday
  const formatBirthday = (birthday: string | Date | null | undefined) => {
    if (!birthday) return "";
    
    const date = new Date(birthday);
    return date.toLocaleDateString(undefined, { month: 'long', day: 'numeric' });
  };
  
  if (sortedContacts.length === 0) {
    return (
      <div className="text-sm text-neutral-500 italic text-center">
        No upcoming birthdays to show
      </div>
    );
  }
  
  return (
    <div className="space-y-3">
      {sortedContacts.slice(0, 3).map(contact => {
        const daysUntil = getDaysUntilBirthday(contact.birthday);
        
        return (
          <Card key={contact.id}>
            <CardContent className="p-3 flex items-center">
              <Avatar className="h-10 w-10">
                <AvatarImage src={contact.avatar} alt={contact.displayName} />
                <AvatarFallback>{getInitials(contact.displayName)}</AvatarFallback>
              </Avatar>
              
              <div className="ml-3 flex-1">
                <h4 className="font-medium">{contact.displayName}</h4>
                <div className="flex justify-between">
                  <p className="text-sm text-neutral-500">
                    {formatBirthday(contact.birthday)}
                  </p>
                  <p className="text-sm font-medium text-primary">
                    {daysUntil === 0 ? 'Today!' : `${daysUntil} days`}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
      
      {sortedContacts.length > 0 && (
        <Button variant="outline" className="w-full" size="sm">
          See All Birthdays
        </Button>
      )}
    </div>
  );
}
