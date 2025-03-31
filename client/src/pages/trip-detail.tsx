import { useQuery } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { queryClient } from "@/lib/queryClient";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Calendar, Clock, MapPin, Users, Check, DollarSign, 
  Bookmark, Briefcase, UserPlus, Pencil, Trash2, 
  ArrowLeft, Share2, Ticket 
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function TripDetail() {
  const [, params] = useRoute("/trips/:id");
  const tripId = params?.id;

  const { data: trip, isLoading, error } = useQuery({
    queryKey: ['/api/trips', tripId],
    retry: false,
    enabled: !!tripId,
  });

  const { data: participants } = useQuery({
    queryKey: ['/api/trips', tripId, 'participants'],
    retry: false,
    enabled: !!tripId,
  });

  if (isLoading) {
    return <div className="flex justify-center items-center min-h-screen">
      <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
    </div>;
  }

  if (error || !trip) {
    return <div className="text-center p-8">
      <h2 className="text-2xl font-bold">Error loading trip details</h2>
      <p className="text-muted-foreground">There was an error loading this trip.</p>
      <Button variant="outline" className="mt-4" onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/trips', tripId] })}>Try Again</Button>
    </div>;
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <Button variant="ghost" size="sm" className="mb-4" onClick={() => window.history.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Trips
        </Button>
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-4xl font-bold">{trip.name}</h1>
              <Badge variant={
                trip.status === 'planning' ? 'outline' : 
                trip.status === 'active' ? 'default' : 
                trip.status === 'completed' ? 'success' : 'secondary'
              } className="capitalize">{trip.status}</Badge>
            </div>
            <p className="text-muted-foreground mt-1">{trip.description}</p>
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Share2 className="mr-2 h-4 w-4" />
              Share
            </Button>
            <Button variant="outline" size="sm">
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </Button>
            <Button variant="destructive" size="sm">
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-muted-foreground" />
            <div>
              <div className="text-sm font-medium">Start Date</div>
              <div>{new Date(trip.startDate).toLocaleDateString()}</div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-muted-foreground" />
            <div>
              <div className="text-sm font-medium">End Date</div>
              <div>{new Date(trip.endDate).toLocaleDateString()}</div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-muted-foreground" />
            <div>
              <div className="text-sm font-medium">Location</div>
              <div>{trip.location || "No location set"}</div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-muted-foreground" />
            <div>
              <div className="text-sm font-medium">Participants</div>
              <div>{participants?.length || 0} people</div>
            </div>
          </div>
        </div>
      </div>
      
      <Separator className="my-6" />
      
      <Tabs defaultValue="itinerary">
        <TabsList className="mb-6">
          <TabsTrigger value="itinerary">
            <Clock className="mr-2 h-4 w-4" />
            Itinerary
          </TabsTrigger>
          <TabsTrigger value="expenses">
            <DollarSign className="mr-2 h-4 w-4" />
            Expenses
          </TabsTrigger>
          <TabsTrigger value="tasks">
            <Check className="mr-2 h-4 w-4" />
            Tasks
          </TabsTrigger>
          <TabsTrigger value="packing">
            <Briefcase className="mr-2 h-4 w-4" />
            Packing List
          </TabsTrigger>
          <TabsTrigger value="tickets">
            <Ticket className="mr-2 h-4 w-4" />
            Tickets
          </TabsTrigger>
          <TabsTrigger value="participants">
            <Users className="mr-2 h-4 w-4" />
            Participants
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="itinerary" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Itinerary</h2>
            <Button>
              <Bookmark className="mr-2 h-4 w-4" />
              Add Event
            </Button>
          </div>
          
          <div className="p-12 border rounded-lg bg-muted/30 text-center">
            <h3 className="text-xl font-medium">No itinerary items yet</h3>
            <p className="text-muted-foreground mt-2">Start planning your trip by adding events to your itinerary.</p>
            <Button className="mt-4">
              <Bookmark className="mr-2 h-4 w-4" />
              Add First Event
            </Button>
          </div>
        </TabsContent>
        
        <TabsContent value="expenses" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Expenses</h2>
            <Button>
              <DollarSign className="mr-2 h-4 w-4" />
              Add Expense
            </Button>
          </div>
          
          <div className="p-12 border rounded-lg bg-muted/30 text-center">
            <h3 className="text-xl font-medium">No expenses yet</h3>
            <p className="text-muted-foreground mt-2">Keep track of your spending by adding expenses here.</p>
            <Button className="mt-4">
              <DollarSign className="mr-2 h-4 w-4" />
              Add First Expense
            </Button>
          </div>
        </TabsContent>
        
        <TabsContent value="tasks" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Tasks</h2>
            <Button>
              <Check className="mr-2 h-4 w-4" />
              Add Task
            </Button>
          </div>
          
          <div className="p-12 border rounded-lg bg-muted/30 text-center">
            <h3 className="text-xl font-medium">No tasks yet</h3>
            <p className="text-muted-foreground mt-2">Assign and manage tasks for trip preparation.</p>
            <Button className="mt-4">
              <Check className="mr-2 h-4 w-4" />
              Add First Task
            </Button>
          </div>
        </TabsContent>
        
        <TabsContent value="packing" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Packing List</h2>
            <Button>
              <Briefcase className="mr-2 h-4 w-4" />
              Add Item
            </Button>
          </div>
          
          <div className="p-12 border rounded-lg bg-muted/30 text-center">
            <h3 className="text-xl font-medium">No packing items yet</h3>
            <p className="text-muted-foreground mt-2">Make sure you don't forget anything by adding items to your packing list.</p>
            <Button className="mt-4">
              <Briefcase className="mr-2 h-4 w-4" />
              Add First Item
            </Button>
          </div>
        </TabsContent>
        
        <TabsContent value="tickets" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Tickets</h2>
            <Button>
              <Ticket className="mr-2 h-4 w-4" />
              Add Ticket
            </Button>
          </div>
          
          <div className="p-12 border rounded-lg bg-muted/30 text-center">
            <h3 className="text-xl font-medium">No tickets yet</h3>
            <p className="text-muted-foreground mt-2">Add tickets for flights, attractions, or events here.</p>
            <Button className="mt-4">
              <Ticket className="mr-2 h-4 w-4" />
              Add First Ticket
            </Button>
          </div>
        </TabsContent>
        
        <TabsContent value="participants" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Participants</h2>
            <Button>
              <UserPlus className="mr-2 h-4 w-4" />
              Invite People
            </Button>
          </div>
          
          {participants && participants.length > 0 ? (
            <div className="space-y-4">
              {participants.map((participant) => (
                <div key={participant.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={participant.user.avatar || undefined} />
                      <AvatarFallback>{participant.user.displayName.substring(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{participant.user.displayName}</div>
                      <div className="text-sm text-muted-foreground capitalize">{participant.role}</div>
                    </div>
                  </div>
                  <Badge variant={participant.status === 'confirmed' ? 'default' : 'outline'} className="capitalize">
                    {participant.status}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 border rounded-lg bg-muted/30 text-center">
              <h3 className="text-xl font-medium">No participants yet</h3>
              <p className="text-muted-foreground mt-2">Invite your friends to join this trip.</p>
              <Button className="mt-4">
                <UserPlus className="mr-2 h-4 w-4" />
                Invite People
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}