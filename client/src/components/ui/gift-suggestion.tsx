import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { User, GiftSuggestion as GiftSuggestionType } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest } from "@/lib/queryClient";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";

interface GiftSuggestionProps {
  userId: number;
}

export default function GiftSuggestion({ userId }: GiftSuggestionProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [showAddDialog, setShowAddDialog] = useState(false);
  
  // Form state
  const [giftName, setGiftName] = useState("");
  const [giftDescription, setGiftDescription] = useState("");
  const [giftPrice, setGiftPrice] = useState("");
  const [giftLink, setGiftLink] = useState("");
  const [giftCategory, setGiftCategory] = useState("");
  
  // Query user
  const { data: user } = useQuery<User>({
    queryKey: [`/api/users/${userId}`],
    enabled: !!userId,
  });
  
  // Query gift suggestions
  const { data: suggestions = [], isLoading } = useQuery<GiftSuggestionType[]>({
    queryKey: [`/api/users/${userId}/gift-suggestions`],
    enabled: !!userId,
  });
  
  // Create gift suggestion
  const createGiftMutation = useMutation({
    mutationFn: async (data: {
      name: string;
      description: string;
      price: number;
      link: string;
      category: string;
    }) => {
      return apiRequest('POST', '/api/gift-suggestions', {
        receiveId: userId,
        ...data,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}/gift-suggestions`] });
      setShowAddDialog(false);
      resetForm();
      
      toast({
        title: "Gift Suggestion Added",
        description: "Your gift idea has been saved",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to add gift suggestion: ${error.message}`,
        variant: "destructive",
      });
    }
  });
  
  // Reset form
  const resetForm = () => {
    setGiftName("");
    setGiftDescription("");
    setGiftPrice("");
    setGiftLink("");
    setGiftCategory("");
  };
  
  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!giftName.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter a gift name",
        variant: "destructive",
      });
      return;
    }
    
    const priceValue = parseFloat(giftPrice);
    const price = isNaN(priceValue) ? 0 : priceValue;
    
    createGiftMutation.mutate({
      name: giftName.trim(),
      description: giftDescription.trim(),
      price,
      link: giftLink.trim(),
      category: giftCategory.trim(),
    });
  };
  
  if (!user) {
    return null;
  }
  
  // Get random gift ideas based on interests
  const getGiftIdeas = () => {
    if (!user.interests || user.interests.length === 0) {
      return [
        "A personalized photo frame",
        "A gift card to their favorite store",
        "A cozy blanket or throw",
        "A subscription box"
      ];
    }
    
    const interestGifts: Record<string, string[]> = {
      photography: ["Camera lens", "Photo printer", "Photography book", "Camera strap"],
      hiking: ["Hiking boots", "Water bottle", "Backpack", "Trail maps"],
      coffee: ["Coffee subscription", "Specialty beans", "French press", "Travel mug"],
      travel: ["Travel journal", "Luggage tags", "Travel pillow", "City guide books"],
      reading: ["Bookstore gift card", "E-reader", "Book subscription", "Reading light"],
      cooking: ["Cookbook", "Spice set", "Kitchen gadgets", "Cooking class"],
      music: ["Concert tickets", "Vinyl records", "Headphones", "Streaming service subscription"],
      art: ["Art supplies", "Museum membership", "Art prints", "Sketchbook"],
      fitness: ["Fitness tracker", "Workout gear", "Water bottle", "Gym membership"],
      technology: ["Smart gadgets", "Tech accessories", "Subscription services", "Latest devices"]
    };
    
    const ideas: string[] = [];
    
    // Get gift ideas for each interest
    user.interests.forEach(interest => {
      const lowerInterest = interest.toLowerCase();
      Object.keys(interestGifts).forEach(key => {
        if (lowerInterest.includes(key)) {
          ideas.push(...interestGifts[key]);
        }
      });
    });
    
    // If no matches, return default ideas
    if (ideas.length === 0) {
      return [
        "A personalized gift",
        "Something related to their hobbies",
        "An experience gift",
        "A gift card"
      ];
    }
    
    // Return unique ideas
    return [...new Set(ideas)].slice(0, 4);
  };
  
  return (
    <div>
      {suggestions.length > 0 ? (
        <div className="space-y-3">
          {suggestions.map(suggestion => (
            <Card key={suggestion.id}>
              <CardContent className="p-3">
                <div className="flex justify-between">
                  <div>
                    <h4 className="font-medium">{suggestion.name}</h4>
                    {suggestion.description && (
                      <p className="text-sm text-neutral-600">{suggestion.description}</p>
                    )}
                  </div>
                  {suggestion.price > 0 && (
                    <div className="font-medium">${suggestion.price.toFixed(2)}</div>
                  )}
                </div>
                {suggestion.link && (
                  <a 
                    href={suggestion.link} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm text-primary mt-1 block"
                  >
                    View Item <i className="fas fa-external-link-alt text-xs"></i>
                  </a>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="bg-neutral-50 rounded-lg p-4">
          <h4 className="font-medium mb-2">Gift Ideas for {user.displayName}</h4>
          <ul className="space-y-1">
            {getGiftIdeas().map((idea, index) => (
              <li key={index} className="text-sm flex items-center">
                <i className="fas fa-gift text-primary mr-2 text-xs"></i>
                {idea}
              </li>
            ))}
          </ul>
        </div>
      )}
      
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogTrigger asChild>
          <Button className="w-full mt-3" variant="outline">
            <i className="fas fa-plus mr-2"></i>
            Add Gift Idea
          </Button>
        </DialogTrigger>
        
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Gift Idea for {user.displayName}</DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="gift-name">Gift Name</Label>
              <Input
                id="gift-name"
                value={giftName}
                onChange={(e) => setGiftName(e.target.value)}
                placeholder="What's the gift?"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="gift-description">Description (Optional)</Label>
              <Textarea
                id="gift-description"
                value={giftDescription}
                onChange={(e) => setGiftDescription(e.target.value)}
                placeholder="Any details about the gift?"
                rows={2}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="gift-price">Price (Optional)</Label>
                <Input
                  id="gift-price"
                  type="number"
                  step="0.01"
                  value={giftPrice}
                  onChange={(e) => setGiftPrice(e.target.value)}
                  placeholder="0.00"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="gift-category">Category (Optional)</Label>
                <Input
                  id="gift-category"
                  value={giftCategory}
                  onChange={(e) => setGiftCategory(e.target.value)}
                  placeholder="E.g., Technology, Books"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="gift-link">Link (Optional)</Label>
              <Input
                id="gift-link"
                type="url"
                value={giftLink}
                onChange={(e) => setGiftLink(e.target.value)}
                placeholder="https://..."
              />
            </div>
            
            <DialogFooter>
              <Button type="submit" disabled={createGiftMutation.isPending || !giftName.trim()}>
                {createGiftMutation.isPending ? "Saving..." : "Save Gift Idea"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
