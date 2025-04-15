
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend } from "recharts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TooltipProvider, Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuthStore } from "@/stores/authStore";
import { format, subDays } from "date-fns";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A259FF', '#FF6B6B'];

const Analytics = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { session, userRole } = useAuthStore();
  const [timeRange, setTimeRange] = useState("week");
  
  useEffect(() => {
    if (!session) {
      navigate('/auth');
      return;
    }
    
    if (userRole !== 'Admin') {
      navigate('/');
      return;
    }
  }, [session, userRole, navigate]);

  // Fetch orders for the selected time range
  const { data: orders, isLoading } = useQuery({
    queryKey: ['orders', timeRange],
    queryFn: async () => {
      const startDate = getStartDateForRange(timeRange);
      
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .gte('timestamp', startDate.toISOString())
        .order('timestamp', { ascending: false });
      
      if (error) {
        toast({
          title: "Error loading orders",
          description: error.message,
          variant: "destructive"
        });
        return [];
      }
      
      return data;
    }
  });

  // Calculate data for reports
  const totalRevenue = orders?.reduce((sum, order) => sum + order.total, 0) || 0;
  const averageOrderValue = orders?.length ? totalRevenue / orders.length : 0;
  const totalOrders = orders?.length || 0;
  
  // Popular items
  const popularItems = calculatePopularItems(orders);
  
  // Sales by day
  const salesByDay = calculateSalesByDay(orders, timeRange);

  // Helper function to get start date for selected time range
  function getStartDateForRange(range: string): Date {
    const today = new Date();
    switch (range) {
      case "day":
        // Just today
        return new Date(today.setHours(0, 0, 0, 0));
      case "week":
        // Last 7 days
        return subDays(today, 7);
      case "month":
        // Last 30 days
        return subDays(today, 30);
      default:
        return subDays(today, 7);
    }
  }

  // Calculate most popular items from orders
  function calculatePopularItems(orderData: any[] | undefined) {
    if (!orderData?.length) return [];
    
    const itemCounts: Record<string, { name: string, count: number }> = {};
    
    orderData.forEach(order => {
      const items = order.items;
      if (Array.isArray(items)) {
        items.forEach(item => {
          const key = `${item.name}-${item.isHalf}`;
          if (!itemCounts[key]) {
            itemCounts[key] = {
              name: item.name,
              count: 0
            };
          }
          itemCounts[key].count += item.quantity;
        });
      }
    });
    
    return Object.values(itemCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 6)
      .map(item => ({
        name: item.name,
        value: item.count
      }));
  }

  // Calculate sales by day
  function calculateSalesByDay(orderData: any[] | undefined, range: string) {
    if (!orderData?.length) return [];
    
    const salesMap: Record<string, number> = {};
    
    // Initialize days based on range
    const numDays = range === 'day' ? 1 : range === 'week' ? 7 : 30;
    for (let i = 0; i < numDays; i++) {
      const date = subDays(new Date(), i);
      const dateStr = format(date, 'yyyy-MM-dd');
      salesMap[dateStr] = 0;
    }
    
    // Aggregate sales by day
    orderData.forEach(order => {
      const orderDate = format(new Date(order.timestamp), 'yyyy-MM-dd');
      if (salesMap[orderDate] !== undefined) {
        salesMap[orderDate] += order.total;
      }
    });
    
    // Convert to array for chart
    return Object.entries(salesMap)
      .map(([date, amount]) => ({
        date: format(new Date(date), 'MMM dd'),
        amount: amount
      }))
      .reverse();
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex items-center gap-4 mb-6">
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => navigate('/')}
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
        <h1 className="text-2xl font-bold">Sales Analytics</h1>
      </div>
      
      {/* Time Range Selector */}
      <div className="mb-6">
        <Tabs defaultValue="week" value={timeRange} onValueChange={setTimeRange}>
          <TabsList>
            <TabsTrigger value="day">Today</TabsTrigger>
            <TabsTrigger value="week">Last 7 Days</TabsTrigger>
            <TabsTrigger value="month">Last 30 Days</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      
      {isLoading ? (
        <p>Loading analytics data...</p>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Revenue
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">₹{totalRevenue.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {timeRange === 'day' ? 'Today' : 
                   timeRange === 'week' ? 'Last 7 days' : 'Last 30 days'}
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Average Order Value
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">₹{averageOrderValue.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground mt-1">{totalOrders} orders</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Orders
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalOrders}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {timeRange === 'day' ? 'Today' : 
                   timeRange === 'week' ? 'Last 7 days' : 'Last 30 days'}
                </p>
              </CardContent>
            </Card>
          </div>
          
          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Popular Items */}
            <Card>
              <CardHeader>
                <CardTitle>Most Popular Items</CardTitle>
              </CardHeader>
              <CardContent>
                {popularItems.length === 0 ? (
                  <p className="text-center py-8 text-muted-foreground">No data available</p>
                ) : (
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={popularItems}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                        >
                          {popularItems.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Sales Trend */}
            <Card>
              <CardHeader>
                <CardTitle>Sales Trend</CardTitle>
              </CardHeader>
              <CardContent>
                {salesByDay.length === 0 ? (
                  <p className="text-center py-8 text-muted-foreground">No data available</p>
                ) : (
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={salesByDay}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <RechartsTooltip formatter={(value) => [`₹${value}`, 'Sales']} />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="amount"
                          name="Sales"
                          stroke="#8884d8"
                          activeDot={{ r: 8 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          
          {/* Export Options */}
          <div className="mt-6 flex justify-end">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" disabled>
                    Export Report
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Coming soon</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </>
      )}
    </div>
  );
};

export default Analytics;
