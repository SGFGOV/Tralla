import { PaymentButton } from '@/components/payments/payment-button';
import AppLayout from '@/components/layout/app-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

export default function PaymentDemo() {
  return (
    <AppLayout>
      <div className="container mx-auto py-10">
        <h1 className="text-3xl font-bold mb-6">Payment Integration Examples</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* One-time Payment Examples */}
          <Card>
            <CardHeader>
              <CardTitle>One-time Payments</CardTitle>
              <CardDescription>
                Examples of one-time payment implementations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-2">Fixed Amount</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Pre-defined amount that can't be changed by the user
                </p>
                <PaymentButton 
                  amount={19.99} 
                  variant="default"
                >
                  Pay $19.99
                </PaymentButton>
              </div>
              
              <Separator />
              
              <div>
                <h3 className="text-lg font-medium mb-2">Custom Amount</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Allows user to enter their own payment amount
                </p>
                <PaymentButton 
                  label="Enter Payment Amount" 
                  description="Enter the amount you would like to pay"
                  variant="outline"
                />
              </div>
              
              <Separator />
              
              <div>
                <h3 className="text-lg font-medium mb-2">Group Expense</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Example for expense splitting functionality
                </p>
                <PaymentButton 
                  amount={45.50} 
                  description="Pay your share of the dinner expense"
                  confirmLabel="Pay My Share"
                  variant="secondary"
                >
                  Pay My Share ($45.50)
                </PaymentButton>
              </div>
            </CardContent>
          </Card>
          
          {/* Subscription Examples */}
          <Card>
            <CardHeader>
              <CardTitle>Subscriptions</CardTitle>
              <CardDescription>
                Examples of subscription payment implementations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-2">Premium Features</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Subscribe to unlock premium features
                </p>
                <PaymentButton 
                  paymentType="subscription"
                  label="Subscribe Now" 
                  description="Choose a subscription plan to unlock premium features"
                  confirmLabel="View Plans"
                  variant="default"
                />
              </div>
              
              <Separator />
              
              <div>
                <h3 className="text-lg font-medium mb-2">Pro Membership</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Upgrade to a Pro membership for additional benefits
                </p>
                <PaymentButton 
                  paymentType="subscription"
                  description="Upgrade to a Pro membership to access all features"
                  confirmLabel="View Membership Options"
                  variant="outline"
                >
                  Upgrade to Pro
                </PaymentButton>
              </div>
              
              <Separator />
              
              <div>
                <h3 className="text-lg font-medium mb-2">Event Access Pass</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Monthly subscription for access to exclusive events
                </p>
                <PaymentButton 
                  paymentType="subscription"
                  description="Subscribe to get access to premium events every month"
                  confirmLabel="Get Access Pass"
                  variant="secondary"
                >
                  Get Event Access
                </PaymentButton>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}