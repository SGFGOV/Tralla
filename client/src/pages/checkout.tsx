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

const CheckoutForm = ({ amount, onSuccess }: { amount: number; onSuccess: () => void }) => {
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
        title: "Payment Failed",
        description: error.message,
        variant: "destructive",
      });
      setIsLoading(false);
    } else {
      toast({
        title: "Payment Successful",
        description: "Thank you for your purchase!",
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
        {isLoading ? "Processing..." : `Pay ${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)}`}
      </Button>
    </form>
  );
};

export default function Checkout() {
  const [clientSecret, setClientSecret] = useState("");
  const [amount, setAmount] = useState(0);
  const { toast } = useToast();
  const [location, navigate] = useLocation();
  
  // Get the amount from the URL query param
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const amountParam = searchParams.get('amount');
    
    if (amountParam && !isNaN(parseFloat(amountParam))) {
      const parsedAmount = parseFloat(amountParam);
      setAmount(parsedAmount);
      
      // Create PaymentIntent on the server
      apiRequest("POST", "/api/payment/create-intent", { amount: parsedAmount })
        .then((res) => res.json())
        .then((data) => {
          setClientSecret(data.clientSecret)
        })
        .catch((error) => {
          toast({
            title: "Error",
            description: "Failed to initialize payment. Please try again.",
            variant: "destructive",
          });
          console.error("Payment initialization error:", error);
        });
    } else {
      toast({
        title: "Invalid Amount",
        description: "Please specify a valid amount for your payment.",
        variant: "destructive",
      });
      navigate('/');
    }
  }, [navigate, toast]);

  const handleSuccess = () => {
    // Redirect to success page or back to the app
    setTimeout(() => {
      navigate('/');
    }, 1500);
  };

  if (!clientSecret) {
    return (
      <AppLayout>
        <div className="h-full flex items-center justify-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" aria-label="Loading"/>
        </div>
      </AppLayout>
    );
  }
  
  return (
    <AppLayout>
      <div className="container max-w-md mx-auto py-10">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Complete Your Payment</CardTitle>
            <CardDescription>
              Secure payment processed by Stripe
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-medium mb-6">
              Total: {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)}
            </div>
            <Elements stripe={stripePromise} options={{ clientSecret }}>
              <CheckoutForm amount={amount} onSuccess={handleSuccess} />
            </Elements>
          </CardContent>
          <CardFooter className="text-xs text-muted-foreground">
            Your payment information is securely processed by Stripe. We don't store your card details.
          </CardFooter>
        </Card>
      </div>
    </AppLayout>
  );
}