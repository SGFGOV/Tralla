import { useStripe, Elements, PaymentElement, useElements } from '@stripe/react-stripe-js';
import { useEffect, useState } from 'react';
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { stripePromise } from "@/lib/stripe";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLocation } from 'wouter';
import AppLayout from "@/components/layout/app-layout";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";

interface PlanOption {
  id: string;
  name: string;
  price: number;
  description: string;
  interval: string;
}

// Mock subscription plans - in a real implementation, these would come from the server
// or be defined elsewhere
const SUBSCRIPTION_PLANS: PlanOption[] = [
  {
    id: "plan_basic",
    name: "Basic",
    price: 9.99,
    description: "Basic plan with limited features",
    interval: "month"
  },
  {
    id: "plan_premium",
    name: "Premium",
    price: 19.99,
    description: "Premium plan with all features",
    interval: "month"
  },
  {
    id: "plan_annual",
    name: "Annual",
    price: 99.99,
    description: "Annual plan with all features",
    interval: "year"
  }
];

const SubscriptionForm = ({ onSuccess }: { onSuccess: () => void }) => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsLoading(true);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: window.location.origin,
      },
      redirect: 'if_required',
    });

    if (error) {
      toast({
        title: "Subscription Failed",
        description: error.message,
        variant: "destructive",
      });
      setIsLoading(false);
    } else {
      toast({
        title: "Subscription Successful",
        description: "You are now subscribed!",
      });
      onSuccess();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="space-y-4">
        <PaymentElement />
      </div>
      <Button 
        type="submit" 
        className="w-full" 
        disabled={!stripe || isLoading}
      >
        {isLoading ? "Processing..." : "Subscribe Now"}
      </Button>
    </form>
  );
};

export default function Subscribe() {
  const [clientSecret, setClientSecret] = useState("");
  const [selectedPlan, setSelectedPlan] = useState<PlanOption | null>(null);
  const { toast } = useToast();
  const [location, navigate] = useLocation();
  
  const handlePlanChange = (planId: string) => {
    const plan = SUBSCRIPTION_PLANS.find(p => p.id === planId) || null;
    setSelectedPlan(plan);
    
    if (plan) {
      // In a real implementation, we would call the backend to create a subscription
      // For now we'll just simulate the process with a payment intent
      apiRequest("POST", "/api/payment/create-intent", { 
        amount: plan.price,
        currency: "usd",
        // In a real implementation, we would pass the plan ID and other subscription details
      })
        .then((res) => res.json())
        .then((data) => {
          setClientSecret(data.clientSecret)
        })
        .catch((error) => {
          toast({
            title: "Error",
            description: "Failed to initialize subscription. Please try again.",
            variant: "destructive",
          });
          console.error("Subscription initialization error:", error);
        });
    }
  };

  const handleSuccess = () => {
    // Redirect to success page or back to the app
    setTimeout(() => {
      navigate('/');
    }, 1500);
  };

  return (
    <AppLayout>
      <div className="container max-w-md mx-auto py-10">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Choose Your Subscription</CardTitle>
            <CardDescription>
              Select a plan that works for you
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            <div className="space-y-4">
              <Select onValueChange={handlePlanChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a plan" />
                </SelectTrigger>
                <SelectContent>
                  {SUBSCRIPTION_PLANS.map((plan) => (
                    <SelectItem key={plan.id} value={plan.id}>
                      {plan.name} - ${plan.price}/{plan.interval}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {selectedPlan && (
                <div className="p-4 border rounded-md">
                  <h3 className="font-semibold">{selectedPlan.name} Plan</h3>
                  <p className="text-muted-foreground text-sm">{selectedPlan.description}</p>
                  <p className="font-medium mt-2">
                    ${selectedPlan.price}/{selectedPlan.interval}
                  </p>
                </div>
              )}
            </div>
            
            {clientSecret && (
              <Elements stripe={stripePromise} options={{ clientSecret }}>
                <SubscriptionForm onSuccess={handleSuccess} />
              </Elements>
            )}
          </CardContent>
          <CardFooter className="text-xs text-muted-foreground">
            You can cancel your subscription at any time from your account settings.
          </CardFooter>
        </Card>
      </div>
    </AppLayout>
  );
}