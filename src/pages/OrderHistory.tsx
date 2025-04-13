
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";
import { CalendarIcon, ArrowLeft, FilterIcon, DownloadIcon } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { useAuthStore } from "@/stores/authStore";

const OrderHistory = () => {
  const navigate = useNavigate();
  const { session } = useAuthStore();
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [dateFilter, setDateFilter] = useState<string>("today");
  
  // Format the date for querying
  const formattedDate = selectedDate ? format(selectedDate, "yyyy-MM-dd") : "";

  // Query for orders based on the selected date/filter
  const { data: orders, isLoading } = useQuery({
    queryKey: ['orders', dateFilter, formattedDate],
    queryFn: async () => {
      let query = supabase.from('orders').select('*');
      
      if (dateFilter === "today") {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        query = query.gte('timestamp', today.toISOString());
      } else if (dateFilter === "yesterday") {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        yesterday.setHours(0, 0, 0, 0);
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        query = query
          .gte('timestamp', yesterday.toISOString())
          .lt('timestamp', today.toISOString());
      } else if (dateFilter === "thisWeek") {
        const startOfWeek = new Date();
        startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
        startOfWeek.setHours(0, 0, 0, 0);
        
        query = query.gte('timestamp', startOfWeek.toISOString());
      } else if (dateFilter === "thisMonth") {
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);
        
        query = query.gte('timestamp', startOfMonth.toISOString());
      } else if (dateFilter === "custom" && selectedDate) {
        const startDate = new Date(selectedDate);
        startDate.setHours(0, 0, 0, 0);
        
        const endDate = new Date(selectedDate);
        endDate.setDate(endDate.getDate() + 1);
        endDate.setHours(0, 0, 0, 0);
        
        query = query
          .gte('timestamp', startDate.toISOString())
          .lt('timestamp', endDate.toISOString());
      }
      
      const { data, error } = await query.order('timestamp', { ascending: false });
      
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

  // Calculate total revenue from orders
  const totalRevenue = orders?.reduce((sum, order) => sum + order.total, 0) || 0;
  
  // Format timestamp for display
  const formatTime = (timestamp: string) => {
    return format(new Date(timestamp), "dd MMM yyyy, hh:mm a");
  };

  // Check if user is authenticated
  useEffect(() => {
    if (!session) {
      navigate('/auth');
    }
  }, [session, navigate]);

  return (
    <div className="container mx-auto p-4">
      <div className="flex items-center mb-6">
        <Button 
          variant="ghost" 
          size="sm" 
          className="mr-2"
          onClick={() => navigate('/')}
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
        <h1 className="text-2xl font-bold">Order History</h1>
      </div>

      {/* Filter Controls */}
      <Card className="mb-6">
        <CardContent className="py-4">
          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="space-y-1 flex-1">
              <label className="text-sm font-medium">Filter Period</label>
              <Select 
                value={dateFilter} 
                onValueChange={setDateFilter}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="yesterday">Yesterday</SelectItem>
                  <SelectItem value="thisWeek">This Week</SelectItem>
                  <SelectItem value="thisMonth">This Month</SelectItem>
                  <SelectItem value="custom">Custom Date</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {dateFilter === "custom" && (
              <div className="space-y-1 flex-1">
                <label className="text-sm font-medium">Select Date</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={selectedDate || undefined}
                      onSelect={(date) => setSelectedDate(date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Summary Card */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Order Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Total Orders</p>
              <p className="text-3xl font-bold">{orders?.length || 0}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Revenue</p>
              <p className="text-3xl font-bold">₹{totalRevenue.toFixed(2)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle>Orders</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p>Loading orders...</p>
          ) : orders && orders.length > 0 ? (
            <div className="relative overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">{order.id}</TableCell>
                      <TableCell>{order.timestamp ? formatTime(order.timestamp) : "N/A"}</TableCell>
                      <TableCell>
                        {Array.isArray(order.items) ? (
                          <div className="max-h-24 overflow-y-auto">
                            {order.items.map((item: any, index: number) => (
                              <div key={index} className="text-sm">
                                {item.quantity}x {item.name} {item.isHalf ? "(Half)" : ""}
                              </div>
                            ))}
                          </div>
                        ) : (
                          "N/A"
                        )}
                      </TableCell>
                      <TableCell className="text-right">₹{order.total.toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="text-center py-4 text-muted-foreground">No orders found for the selected period.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default OrderHistory;
