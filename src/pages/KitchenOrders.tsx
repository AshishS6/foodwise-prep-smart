import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Clock, Utensils, CheckCircle2, ChefHat, Play } from "lucide-react";
import { useDeviceDetection } from "@/hooks/useDeviceDetection";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { useAuthStore } from "@/stores/authStore";
import { format } from "date-fns";
import { OrderDetailsDialog } from "@/components/orders/OrderDetailsDialog";
import { OrderStatus } from "@/types/supabase";

const KitchenOrders = () => {
  const navigate = useNavigate();
  const { session, userRole } = useAuthStore();
  const { isMobile } = useDeviceDetection();
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    if (!session) {
      navigate('/auth');
      return;
    }

    // Only kitchen staff should access this page
    if (userRole !== 'Kitchen Staff' && userRole !== 'Admin' && userRole !== 'Manager') {
      navigate('/');
      toast({
        title: "Access restricted",
        description: "This page is only accessible to kitchen staff.",
        variant: "destructive"
      });
      return;
    }
  }, [session, userRole, navigate]);

  const queryClient = useQueryClient();

  // Fetch orders - only take_away and seating, only pending/in_progress, ordered by timestamp (FIFO - oldest first)
  const { data: orders, isLoading, refetch } = useQuery({
    queryKey: ['kitchenOrders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .in('order_type', ['take_away', 'seating'])
        .in('order_status', ['pending', 'in_progress']) // Only show active orders
        .order('timestamp', { ascending: true }); // FIFO - oldest first

      if (error) {
        toast({
          title: "Error loading orders",
          description: error.message,
          variant: "destructive"
        });
        return [];
      }

      return data || [];
    },
    refetchInterval: 5000, // Refetch every 5 seconds for real-time updates
  });

  // Mutation to update order status
  const updateOrderStatus = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: number; status: OrderStatus }) => {
      const { error } = await supabase
        .from('orders')
        .update({ order_status: status })
        .eq('id', orderId);

      if (error) throw error;
      return { orderId, status };
    },
    onSuccess: (data) => {
      // Invalidate and refetch kitchen orders
      queryClient.invalidateQueries({ queryKey: ['kitchenOrders'] });
      
      const statusMessages: Record<OrderStatus, string> = {
        'in_progress': 'Order started',
        'ready': 'Order marked as ready',
        'completed': 'Order completed',
        'pending': 'Order reset to pending'
      };
      
      toast({
        title: "Order updated",
        description: statusMessages[data.status] || 'Order status updated',
        variant: "default"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error updating order",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const formatTime = (timestamp: string) => {
    return format(new Date(timestamp), "hh:mm a");
  };

  const formatDate = (timestamp: string) => {
    return format(new Date(timestamp), "dd MMM yyyy");
  };

  const getOrderTypeBadge = (orderType: string) => {
    if (orderType === 'take_away') {
      return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Take Away</Badge>;
    } else if (orderType === 'seating') {
      return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Seating</Badge>;
    }
    return <Badge variant="outline">Unknown</Badge>;
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; className: string }> = {
      'pending': { label: 'Pending', className: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
      'in_progress': { label: 'In Progress', className: 'bg-orange-50 text-orange-700 border-orange-200' },
      'ready': { label: 'Ready', className: 'bg-green-50 text-green-700 border-green-200' },
      'completed': { label: 'Completed', className: 'bg-gray-50 text-gray-700 border-gray-200' }
    };
    
    const config = statusConfig[status] || statusConfig['pending'];
    return <Badge variant="outline" className={config.className}>{config.label}</Badge>;
  };

  const handleStatusUpdate = (orderId: number, newStatus: OrderStatus, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click
    updateOrderStatus.mutate({ orderId, status: newStatus });
  };

  const getTimeAgo = (timestamp: string) => {
    const now = new Date();
    const orderTime = new Date(timestamp);
    const diffMs = now.getTime() - orderTime.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} min ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-4">
        <div className="flex items-center justify-center min-h-[400px]">
          <p>Loading orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Button 
            variant="ghost" 
            size="sm" 
            className="mr-2"
            onClick={() => navigate('/')}
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
          <div className="flex items-center gap-2">
            <Utensils className="h-6 w-6" />
            <h1 className="text-2xl font-bold">Kitchen Orders</h1>
          </div>
        </div>
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => refetch()}
        >
          Refresh
        </Button>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Active Orders</CardTitle>
        </CardHeader>
        <CardContent>
          {orders && orders.length > 0 ? (
            <div className={isMobile ? "space-y-2" : "space-y-4"}>
              {orders.map((order) => (
                <Card 
                  key={order.id}
                  className="hover:bg-accent/50 transition-colors"
                >
                  <CardContent className={isMobile ? "p-3" : "p-4"}>
                    <div className="flex items-start justify-between gap-2 md:gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 md:gap-2 mb-1.5 md:mb-2 flex-wrap">
                          <span className={`font-bold ${isMobile ? 'text-base' : 'text-lg'}`}>Order #{order.id}</span>
                          <div className="flex items-center gap-1.5">
                            {getOrderTypeBadge(order.order_type)}
                            {getStatusBadge(order.order_status || 'pending')}
                          </div>
                        </div>
                        <div className={`flex items-center gap-2 md:gap-4 ${isMobile ? 'text-xs' : 'text-sm'} text-muted-foreground mb-2 md:mb-3`}>
                          <div className="flex items-center gap-1">
                            <Clock className={isMobile ? "h-3 w-3" : "h-4 w-4"} />
                            <span>{formatTime(order.timestamp)} • {formatDate(order.timestamp)}</span>
                          </div>
                          <span className="text-xs">{getTimeAgo(order.timestamp)}</span>
                        </div>
                        <div className="space-y-0.5 md:space-y-1">
                          {Array.isArray(order.items) ? (
                            order.items.slice(0, isMobile ? 2 : 3).map((item: any, index: number) => (
                              <div key={index} className={isMobile ? "text-xs" : "text-sm"}>
                                <span className="font-medium">{item.quantity}x</span> {item.name}
                                {item.isHalf && <span className="text-muted-foreground"> (Half)</span>}
                              </div>
                            ))
                          ) : (
                            <p className={`${isMobile ? "text-xs" : "text-sm"} text-muted-foreground`}>No items</p>
                          )}
                          {Array.isArray(order.items) && order.items.length > (isMobile ? 2 : 3) && (
                            <p className="text-xs text-muted-foreground">
                              +{order.items.length - (isMobile ? 2 : 3)} more item{order.items.length - (isMobile ? 2 : 3) > 1 ? 's' : ''}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className={`text-right ${isMobile ? 'ml-2' : 'ml-4'} shrink-0`}>
                        <p className={`font-bold ${isMobile ? 'text-base mb-2' : 'text-lg mb-3'}`}>₹{order.total.toFixed(2)}</p>
                        <div className={`flex flex-col ${isMobile ? 'gap-1.5' : 'gap-2'}`}>
                          {order.order_status === 'pending' && (
                            <Button
                              size={isMobile ? "sm" : "sm"}
                              variant="default"
                              onClick={(e) => handleStatusUpdate(order.id, 'in_progress', e)}
                              disabled={updateOrderStatus.isPending}
                              className={isMobile ? "w-full text-xs h-8" : "w-full"}
                            >
                              <Play className={isMobile ? "h-3 w-3 mr-1" : "h-4 w-4 mr-1"} />
                              {isMobile ? "Start" : "Start Cooking"}
                            </Button>
                          )}
                          {order.order_status === 'in_progress' && (
                            <Button
                              size={isMobile ? "sm" : "sm"}
                              variant="default"
                              onClick={(e) => handleStatusUpdate(order.id, 'ready', e)}
                              disabled={updateOrderStatus.isPending}
                              className={isMobile ? "w-full text-xs h-8 bg-green-600 hover:bg-green-700" : "w-full bg-green-600 hover:bg-green-700"}
                            >
                              <CheckCircle2 className={isMobile ? "h-3 w-3 mr-1" : "h-4 w-4 mr-1"} />
                              {isMobile ? "Ready" : "Mark as Ready"}
                            </Button>
                          )}
                          <Button
                            size={isMobile ? "sm" : "sm"}
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedOrder(order);
                              setDialogOpen(true);
                            }}
                            className={isMobile ? "w-full text-xs h-8" : "w-full"}
                          >
                            {isMobile ? "Details" : "View Details"}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Utensils className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground font-medium">No active orders</p>
              <p className="text-sm text-muted-foreground mt-1">
                Orders will appear here when they are placed
              </p>
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

export default KitchenOrders;

