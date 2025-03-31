import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDistance } from "date-fns";
import { Calendar, MapPin, Plus, Users } from "lucide-react";
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { z } from "zod";
import { insertTripSchema } from "../../../shared/schema";

export default function Trips() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const { toast } = useToast();

  const { data: trips, isLoading, error } = useQuery({
    queryKey: ['/api/trips'],
    retry: false,
  });

  const createTripSchema = insertTripSchema.extend({
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
  }).refine((data) => data.endDate >= data.startDate, {
    message: "End date must be on or after start date",
    path: ["endDate"],
  });

  const form = useForm({
    resolver: zodResolver(createTripSchema),
    defaultValues: {
      name: "",
      description: "",
      location: "",
      startDate: new Date(),
      endDate: new Date(),
    }
  });

  async function onSubmit(values: z.infer<typeof createTripSchema>) {
    try {
      await apiRequest("POST", "/api/trips", values);
      queryClient.invalidateQueries({ queryKey: ['/api/trips'] });
      setIsCreateDialogOpen(false);
      form.reset();
      toast({
        title: "Trip created",
        description: "Your trip has been created successfully.",
      });
    } catch (error) {
      console.error("Failed to create trip:", error);
      toast({
        title: "Failed to create trip",
        description: "There was an error creating your trip. Please try again.",
        variant: "destructive",
      });
    }
  }

  if (isLoading) {
    return <div className="flex justify-center items-center min-h-screen">
      <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
    </div>;
  }

  if (error) {
    return <div className="text-center p-8">
      <h2 className="text-2xl font-bold">Error loading trips</h2>
      <p className="text-muted-foreground">There was an error loading your trips.</p>
      <Button variant="outline" className="mt-4" onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/trips'] })}>Try Again</Button>
    </div>;
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold">Your Trips</h1>
          <p className="text-muted-foreground">Plan, organize, and share your travel adventures</p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Trip
        </Button>
      </div>

      {trips && trips.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {trips.map((trip) => (
            <Link key={trip.id} href={`/trips/${trip.id}`}>
              <a className="block h-full">
                <Card className="h-full hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle>{trip.name}</CardTitle>
                    <CardDescription>
                      {new Date(trip.startDate).toLocaleDateString()} - {new Date(trip.endDate).toLocaleDateString()}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-start">
                        <MapPin className="h-4 w-4 mr-2 mt-1 text-muted-foreground" />
                        <span>{trip.location || "No location set"}</span>
                      </div>
                      <div className="flex items-start">
                        <Calendar className="h-4 w-4 mr-2 mt-1 text-muted-foreground" />
                        <span>
                          {formatDistance(new Date(trip.startDate), new Date(), { addSuffix: true })}
                        </span>
                      </div>
                      <div className="flex items-start">
                        <Users className="h-4 w-4 mr-2 mt-1 text-muted-foreground" />
                        <span>{trip.participants?.length || 0} participants</span>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <div className="text-sm text-muted-foreground">
                      Status: <span className="capitalize">{trip.status}</span>
                    </div>
                  </CardFooter>
                </Card>
              </a>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center p-12 border rounded-lg bg-muted/30">
          <h2 className="text-2xl font-bold">No trips yet</h2>
          <p className="text-muted-foreground mt-2">Create your first trip to get started!</p>
          <Button onClick={() => setIsCreateDialogOpen(true)} className="mt-4">
            <Plus className="mr-2 h-4 w-4" />
            Create Trip
          </Button>
        </div>
      )}

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Create New Trip</DialogTitle>
            <DialogDescription>
              Enter the details for your new trip. You can add more information later.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Trip Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Summer Vacation 2025" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea placeholder="A brief description of your trip" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location</FormLabel>
                    <FormControl>
                      <Input placeholder="Paris, France" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} value={field.value instanceof Date ? field.value.toISOString().substring(0, 10) : field.value} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="endDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>End Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} value={field.value instanceof Date ? field.value.toISOString().substring(0, 10) : field.value} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Create Trip</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}