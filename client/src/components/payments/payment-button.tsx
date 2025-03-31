import { useState } from 'react';
import { useLocation } from 'wouter';
import { Button, ButtonProps } from '@/components/ui/button';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader,
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';

interface PaymentButtonProps extends ButtonProps {
  label?: string;
  amount?: number;
  paymentType?: 'oneTime' | 'subscription';
  confirmLabel?: string;
  description?: string;
  children?: React.ReactNode;
}

export function PaymentButton({
  label = 'Pay Now',
  amount,
  paymentType = 'oneTime',
  confirmLabel = 'Proceed to Payment',
  description = 'Confirm the amount you want to pay.',
  children,
  ...props
}: PaymentButtonProps) {
  const [open, setOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState(amount || 0);
  const [_, navigate] = useLocation();

  const handleProceed = () => {
    setOpen(false);
    
    const destination = paymentType === 'oneTime' 
      ? `/checkout?amount=${paymentAmount}` 
      : '/subscribe';
    
    navigate(destination);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button {...props}>
          {children || label}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Confirm Payment</DialogTitle>
          <DialogDescription>
            {description}
          </DialogDescription>
        </DialogHeader>
        
        {paymentType === 'oneTime' && amount !== undefined && (
          <div className="py-4">
            <p className="text-center text-xl font-medium">
              {new Intl.NumberFormat('en-US', { 
                style: 'currency', 
                currency: 'USD' 
              }).format(amount)}
            </p>
          </div>
        )}
        
        {paymentType === 'oneTime' && amount === undefined && (
          <div className="py-4">
            <div className="mb-2">
              <label htmlFor="amount" className="block text-sm font-medium mb-1">
                Amount
              </label>
              <input
                id="amount"
                type="number"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(parseFloat(e.target.value))}
                min={0.01}
                step={0.01}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
            <p className="text-sm text-muted-foreground">
              {new Intl.NumberFormat('en-US', { 
                style: 'currency', 
                currency: 'USD' 
              }).format(paymentAmount)}
            </p>
          </div>
        )}
        
        {paymentType === 'subscription' && (
          <div className="py-4">
            <p className="text-center text-muted-foreground">
              You'll select your subscription plan on the next screen.
            </p>
          </div>
        )}
        
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleProceed}>
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}