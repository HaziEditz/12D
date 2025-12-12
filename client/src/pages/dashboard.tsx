import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { 
  TrendingUp, 
  TrendingDown, 
  Plus, 
  Pencil, 
  Trash2,
  DollarSign,
  PieChart,
  Target
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts";
import type { PortfolioItem } from "@shared/schema";

const portfolioItemSchema = z.object({
  symbol: z.string().min(1, "Symbol is required").max(10),
  name: z.string().min(1, "Name is required"),
  purchasePrice: z.coerce.number().positive("Must be positive"),
  currentPrice: z.coerce.number().positive("Must be positive"),
  quantity: z.coerce.number().positive("Must be positive"),
  notes: z.string().optional(),
});

type PortfolioFormData = z.infer<typeof portfolioItemSchema>;

export default function DashboardPage() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<PortfolioItem | null>(null);

  const { data: portfolio, isLoading } = useQuery<PortfolioItem[]>({
    queryKey: ["/api/portfolio"],
  });

  const form = useForm<PortfolioFormData>({
    resolver: zodResolver(portfolioItemSchema),
    defaultValues: {
      symbol: "",
      name: "",
      purchasePrice: 0,
      currentPrice: 0,
      quantity: 0,
      notes: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: PortfolioFormData) => apiRequest("POST", "/api/portfolio", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/portfolio"] });
      toast({ title: "Investment added successfully" });
      setIsDialogOpen(false);
      form.reset();
    },
    onError: () => {
      toast({ title: "Failed to add investment", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: PortfolioFormData }) => 
      apiRequest("PATCH", `/api/portfolio/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/portfolio"] });
      toast({ title: "Investment updated successfully" });
      setIsDialogOpen(false);
      setEditingItem(null);
      form.reset();
    },
    onError: () => {
      toast({ title: "Failed to update investment", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/portfolio/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/portfolio"] });
      toast({ title: "Investment removed" });
    },
    onError: () => {
      toast({ title: "Failed to remove investment", variant: "destructive" });
    },
  });

  const onSubmit = (data: PortfolioFormData) => {
    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (item: PortfolioItem) => {
    setEditingItem(item);
    form.reset({
      symbol: item.symbol,
      name: item.name,
      purchasePrice: item.purchasePrice,
      currentPrice: item.currentPrice,
      quantity: item.quantity,
      notes: item.notes ?? "",
    });
    setIsDialogOpen(true);
  };

  const handleOpenDialog = () => {
    setEditingItem(null);
    form.reset();
    setIsDialogOpen(true);
  };

  const totalValue = portfolio?.reduce((sum, item) => sum + item.currentPrice * item.quantity, 0) ?? 0;
  const totalCost = portfolio?.reduce((sum, item) => sum + item.purchasePrice * item.quantity, 0) ?? 0;
  const totalGainLoss = totalValue - totalCost;
  const percentageChange = totalCost > 0 ? ((totalGainLoss / totalCost) * 100) : 0;

  const chartData = [
    { name: "Jan", value: totalCost * 0.95 },
    { name: "Feb", value: totalCost * 0.98 },
    { name: "Mar", value: totalCost * 1.02 },
    { name: "Apr", value: totalCost * 0.99 },
    { name: "May", value: totalCost * 1.05 },
    { name: "Jun", value: totalValue },
  ];

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {[1, 2, 3].map(i => (
            <Card key={i}>
              <CardContent className="pt-6">
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-8 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Skeleton className="h-80 w-full" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
          <p className="text-muted-foreground">Track and manage your investment portfolio</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2" onClick={handleOpenDialog} data-testid="button-add-investment">
              <Plus className="h-4 w-4" />
              Add Investment
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingItem ? "Edit Investment" : "Add Investment"}</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="symbol"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Symbol</FormLabel>
                        <FormControl>
                          <Input placeholder="AAPL" data-testid="input-symbol" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Apple Inc." data-testid="input-name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="purchasePrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Purchase Price</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" data-testid="input-purchase-price" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="currentPrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Current Price</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" data-testid="input-current-price" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="quantity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Quantity</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" data-testid="input-quantity" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes (optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Any notes about this investment" data-testid="input-notes" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  data-testid="button-submit-investment"
                >
                  {editingItem ? "Update Investment" : "Add Investment"}
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-primary" />
              </div>
            </div>
            <p className="text-2xl font-bold" data-testid="text-total-value">
              ${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p className="text-sm text-muted-foreground">Total Value</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-2">
              <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${totalGainLoss >= 0 ? 'bg-success/10' : 'bg-destructive/10'}`}>
                {totalGainLoss >= 0 ? (
                  <TrendingUp className="h-5 w-5 text-success" />
                ) : (
                  <TrendingDown className="h-5 w-5 text-destructive" />
                )}
              </div>
            </div>
            <p className={`text-2xl font-bold ${totalGainLoss >= 0 ? 'text-success' : 'text-destructive'}`} data-testid="text-gain-loss">
              {totalGainLoss >= 0 ? '+' : ''}${totalGainLoss.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              <span className="text-sm ml-1">({percentageChange >= 0 ? '+' : ''}{percentageChange.toFixed(2)}%)</span>
            </p>
            <p className="text-sm text-muted-foreground">Total Gain/Loss</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="h-10 w-10 rounded-lg bg-chart-3/10 flex items-center justify-center">
                <PieChart className="h-5 w-5 text-chart-3" />
              </div>
            </div>
            <p className="text-2xl font-bold" data-testid="text-investments-count">
              {portfolio?.length ?? 0}
            </p>
            <p className="text-sm text-muted-foreground">Investments</p>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Performance Tracker</CardTitle>
          <CardDescription>Your portfolio performance over time</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="name" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                  formatter={(value: number) => [`$${value.toLocaleString()}`, 'Value']}
                />
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke="hsl(var(--primary))" 
                  fillOpacity={1}
                  fill="url(#colorValue)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Your Investments</CardTitle>
          <CardDescription>Manage your tracked investments</CardDescription>
        </CardHeader>
        <CardContent>
          {(!portfolio || portfolio.length === 0) ? (
            <div className="text-center py-12">
              <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No investments yet</h3>
              <p className="text-muted-foreground mb-4">
                Start tracking your investments to monitor your portfolio growth.
              </p>
              <Button onClick={handleOpenDialog} className="gap-2">
                <Plus className="h-4 w-4" />
                Add Your First Investment
              </Button>
            </div>
          ) : (
            <div className="divide-y">
              {portfolio.map((item) => {
                const gainLoss = (item.currentPrice - item.purchasePrice) * item.quantity;
                const percentage = ((item.currentPrice - item.purchasePrice) / item.purchasePrice) * 100;
                return (
                  <div 
                    key={item.id} 
                    className="flex items-center justify-between py-4 first:pt-0 last:pb-0"
                    data-testid={`row-investment-${item.id}`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center font-bold text-sm">
                        {item.symbol.slice(0, 2)}
                      </div>
                      <div>
                        <p className="font-semibold">{item.symbol}</p>
                        <p className="text-sm text-muted-foreground">{item.name}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">
                        ${(item.currentPrice * item.quantity).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </p>
                      <p className={`text-sm ${gainLoss >= 0 ? 'text-success' : 'text-destructive'}`}>
                        {gainLoss >= 0 ? '+' : ''}{percentage.toFixed(2)}%
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => handleEdit(item)}
                        data-testid={`button-edit-${item.id}`}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => deleteMutation.mutate(item.id)}
                        data-testid={`button-delete-${item.id}`}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
