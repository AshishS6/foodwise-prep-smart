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
import { OrderDetailsDialog } from "@/components/orders/OrderDetailsDialog";

const OrderHistory = () => {
  const navigate = useNavigate();
  const { session, userRole } = useAuthStore();
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [dateFilter, setDateFilter] = useState<string>("today");
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const formattedDate = selectedDate ? format(selectedDate, "yyyy-MM-dd") : "";

  const { data: orders, isLoading } = useQuery({
    queryKey: ['orders', dateFilter, formattedDate, userRole],
    queryFn: async () => {
      let query = supabase.from('orders').select('*');
      
      // Role-based filtering: Kitchen Staff only see take_away and seating orders
      if (userRole === 'Kitchen Staff') {
        query = query.in('order_type', ['take_away', 'seating']);
      }
      // Admin, Manager, and Cashier see all orders
      
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

  const totalRevenue = orders?.reduce((sum, order) => sum + order.total, 0) || 0;
  
  const formatTime = (timestamp: string) => {
    return format(new Date(timestamp), "dd MMM yyyy, hh:mm a");
  };

  useEffect(() => {
    if (!session) {
      navigate('/auth');
      return;
    }
  }, [session, navigate]);

  return (
    <div className="container mx-auto p-4 md:p-6">
      {/* Simplified Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate('/')}
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
          <h1 className="text-2xl font-bold">Order History</h1>
        </div>
      </div>

      {/* Simplified Filter - Inline */}
      <div className="mb-6 flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <Select 
          value={dateFilter} 
          onValueChange={setDateFilter}
          className="w-full sm:w-auto"
        >
          <SelectTrigger className="w-full sm:w-[200px]">
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

        {dateFilter === "custom" && (
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className="w-full sm:w-auto"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {selectedDate ? format(selectedDate, "MMM dd, yyyy") : "Pick a date"}
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
        )}
      </div>

      {/* Color-Coded Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <Card className="border-2 border-blue-200 bg-blue-50/30">
          <CardContent className="p-6">
            <p className="text-sm font-medium text-blue-700 mb-1">Total Orders</p>
            <p className="text-3xl font-bold text-blue-600">{orders?.length || 0}</p>
          </CardContent>
        </Card>
        <Card className="border-2 border-green-200 bg-green-50/30">
          <CardContent className="p-6">
            <p className="text-sm font-medium text-green-700 mb-1">Total Revenue</p>
            <p className="text-3xl font-bold text-green-600">₹{totalRevenue.toFixed(2)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Orders Table - Simplified */}
      <Card className="border-2">
        <CardHeader className="bg-muted/30">
          <CardTitle className="text-lg font-semibold">Orders</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center">
              <p className="text-muted-foreground">Loading orders...</p>
            </div>
          ) : orders && orders.length > 0 ? (
            <div className="relative overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="font-semibold">Order ID</TableHead>
                    <TableHead className="font-semibold">Date & Time</TableHead>
                    <TableHead className="font-semibold">Items</TableHead>
                    <TableHead className="text-right font-semibold">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow 
                      key={order.id}
                      className="cursor-pointer hover:bg-blue-50/50 transition-colors"
                      onClick={() => {
                        setSelectedOrder(order);
                        setDialogOpen(true);
                      }}
                    >
                      <TableCell className="font-medium">#{order.id}</TableCell>
                      <TableCell className="text-sm">
                        {order.timestamp ? formatTime(order.timestamp) : "N/A"}
                      </TableCell>
                      <TableCell>
                        {Array.isArray(order.items) ? (
                          <div className="max-h-20 overflow-y-auto text-sm">
                            {order.items.slice(0, 2).map((item: any, index: number) => (
                              <div key={index} className="text-muted-foreground">
                                {item.quantity}x {item.name} {item.isHalf ? "(Half)" : ""}
                              </div>
                            ))}
                            {order.items.length > 2 && (
                              <p className="text-xs text-muted-foreground mt-1">
                                +{order.items.length - 2} more
                              </p>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">N/A</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-bold text-green-600">
                        ₹{order.total.toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="p-8 text-center">
              <p className="text-muted-foreground">No orders found for the selected period.</p>
            </div>
          )}
        </CardContent>
      </Card>

      <OrderDetailsDialog 
        order={selectedOrder}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </div>
  );
};

export default OrderHistory;
