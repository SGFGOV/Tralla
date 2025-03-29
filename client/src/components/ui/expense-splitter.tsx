import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { apiRequest } from "@/lib/queryClient";
import { getInitials } from "@/lib/utils/user-utils";
import { Separator } from "@/components/ui/separator";
import { Expense, User } from "@shared/schema";

interface ExpenseSplitterProps {
  groupId: number;
  members: (User & { role: string })[];
}

export default function ExpenseSplitter({ groupId, members }: ExpenseSplitterProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const [expenseName, setExpenseName] = useState("");
  const [amount, setAmount] = useState("");
  const [selectedMembers, setSelectedMembers] = useState<Record<number, boolean>>({});
  
  // Initialize selected members with all members checked
  useState(() => {
    const initialSelected: Record<number, boolean> = {};
    members.forEach(member => {
      initialSelected[member.id] = true;
    });
    setSelectedMembers(initialSelected);
  });
  
  // Query expenses
  const { data: expenses = [], isLoading } = useQuery<Expense[]>({
    queryKey: [`/api/groups/${groupId}/expenses`],
    enabled: !!groupId,
  });
  
  // Create expense mutation
  const createExpenseMutation = useMutation({
    mutationFn: async (data: { 
      name: string; 
      amount: number; 
      payerId: number; 
      participants: number[] 
    }) => {
      // Create the expense
      const expenseResponse = await apiRequest('POST', '/api/expenses', {
        groupId,
        name: data.name,
        amount: data.amount,
        payerId: data.payerId,
        date: new Date(),
      });
      
      const expense = await expenseResponse.json();
      
      // Add participants
      const perPersonAmount = data.amount / data.participants.length;
      
      // Add all participants
      for (const participantId of data.participants) {
        await apiRequest('POST', `/api/expenses/${expense.id}/participants`, {
          expenseId: expense.id,
          userId: participantId,
          share: perPersonAmount,
        });
      }
      
      return expense;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/groups/${groupId}/expenses`] });
      
      // Reset form
      setExpenseName("");
      setAmount("");
      
      toast({
        title: "Expense Created",
        description: "The expense has been added and split among participants",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to create expense: ${error.message}`,
        variant: "destructive",
      });
    }
  });
  
  // Mark expense as paid mutation
  const markAsPaidMutation = useMutation({
    mutationFn: async (data: { expenseId: number; userId: number; paid: boolean }) => {
      return apiRequest('PATCH', `/api/expenses/${data.expenseId}/participants/${data.userId}/paid`, {
        paid: data.paid,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/groups/${groupId}/expenses`] });
      
      toast({
        title: "Payment Updated",
        description: "Your payment status has been updated",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update payment: ${error.message}`,
        variant: "destructive",
      });
    }
  });
  
  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!expenseName.trim() || !amount.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter both a name and amount for the expense",
        variant: "destructive",
      });
      return;
    }
    
    const amountValue = parseFloat(amount);
    if (isNaN(amountValue) || amountValue <= 0) {
      toast({
        title: "Validation Error",
        description: "Please enter a valid amount",
        variant: "destructive",
      });
      return;
    }
    
    // Get selected participants
    const participants = Object.entries(selectedMembers)
      .filter(([_, selected]) => selected)
      .map(([id]) => parseInt(id));
    
    if (participants.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please select at least one participant",
        variant: "destructive",
      });
      return;
    }
    
    // Create expense
    createExpenseMutation.mutate({
      name: expenseName,
      amount: amountValue,
      payerId: user!.id,
      participants,
    });
  };
  
  return (
    <div className="p-4">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-xl">Add New Expense</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="expense-name">Expense Name</Label>
              <Input
                id="expense-name"
                placeholder="Dinner, Movie tickets, etc."
                value={expenseName}
                onChange={(e) => setExpenseName(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Split With</Label>
              <div className="space-y-2 mt-2">
                {members.map((member) => (
                  <div key={member.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`member-${member.id}`}
                      checked={selectedMembers[member.id] ?? false}
                      onCheckedChange={(checked) => {
                        setSelectedMembers({
                          ...selectedMembers,
                          [member.id]: checked === true,
                        });
                      }}
                      disabled={member.id === user?.id} // Can't uncheck yourself
                    />
                    <Label htmlFor={`member-${member.id}`} className="flex items-center">
                      <Avatar className="h-6 w-6 mr-2">
                        <AvatarImage src={member.avatar} alt={member.displayName} />
                        <AvatarFallback>{getInitials(member.displayName)}</AvatarFallback>
                      </Avatar>
                      {member.displayName} {member.id === user?.id && "(You)"}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
            
            <Button 
              type="submit" 
              className="w-full"
              disabled={createExpenseMutation.isPending}
            >
              {createExpenseMutation.isPending ? "Creating..." : "Split Expense"}
            </Button>
          </form>
        </CardContent>
      </Card>
      
      <h3 className="text-lg font-semibold mb-4">Recent Expenses</h3>
      
      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : expenses.length === 0 ? (
        <div className="text-center py-8 border rounded-lg bg-neutral-50">
          <p className="text-neutral-500">No expenses yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {expenses.map((expense) => (
            <Card key={expense.id} className={expense.settled ? "opacity-60" : ""}>
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium">{expense.name}</h4>
                    <p className="text-sm text-neutral-500">
                      {new Date(expense.date).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="font-semibold">
                    ${expense.amount.toFixed(2)}
                  </div>
                </div>
                
                <Separator className="my-3" />
                
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <span className="text-sm mr-1">Paid by:</span>
                    {members.find(m => m.id === expense.payerId)?.displayName || "Unknown"}
                  </div>
                  
                  {!expense.settled && expense.payerId !== user?.id && (
                    <Button 
                      size="sm" 
                      onClick={() => markAsPaidMutation.mutate({
                        expenseId: expense.id,
                        userId: user!.id,
                        paid: true,
                      })}
                      disabled={markAsPaidMutation.isPending}
                    >
                      Mark as Paid
                    </Button>
                  )}
                  
                  {expense.settled && (
                    <span className="text-sm text-success font-medium">Settled</span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
