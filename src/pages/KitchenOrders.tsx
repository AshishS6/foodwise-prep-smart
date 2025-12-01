import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Clock, Utensils, CheckCircle2, ChefHat, Play, Package, X } from "lucide-react";
import { useDeviceDetection } from "@/hooks/useDeviceDetection";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { format } from "date-fns";
import { OrderDetailsDialog } from "@/components/orders/OrderDetailsDialog";
import { OrderStatus } from "@/types/supabase";
import { MobileHeader } from "@/components/layout/MobileHeader";
import { MobileContainer } from "@/components/layout/MobileContainer";
import { Header } from "@/components/layout/Header";

const KitchenOrders = () => {
  const navigate = useNavigate();
  const { isMobile } = useDeviceDetection();
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Note: Authentication and permission checks are handled by ProtectedRoute in App.tsx

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
      return (
        <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-300 px-2 py-0.5">
          <Package className="h-3 w-3 mr-1" />
          <span className="text-xs font-semibold">Parcel</span>
        </Badge>
      );
    } else if (orderType === 'seating') {
      return (
        <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300 px-2 py-0.5">
          <Utensils className="h-3 w-3 mr-1" />
          <span className="text-xs font-semibold">Seating</span>
        </Badge>
      );
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

  const getOrderPriority = (timestamp: string) => {
    const now = new Date();
    const orderTime = new Date(timestamp);
    const diffMins = Math.floor((now.getTime() - orderTime.getTime()) / 60000);
    
    // High priority: older than 10 minutes
    if (diffMins > 10) return { level: 'high', className: 'border-l-4 border-l-red-500 bg-red-50/30' };
    // Medium priority: older than 5 minutes
    if (diffMins > 5) return { level: 'medium', className: 'border-l-4 border-l-orange-500 bg-orange-50/20' };
    // Normal priority
    return { level: 'normal', className: '' };
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        {isMobile ? (
          <MobileHeader title="Kitchen Orders" breadcrumbs={[]} />
        ) : (
          <Header />
        )}
        <MobileContainer className="md:container md:mx-auto md:p-4">
          <div className="flex items-center justify-center min-h-[400px]">
            <p>Loading orders...</p>
          </div>
        </MobileContainer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {isMobile ? (
        <MobileHeader title="Kitchen Orders" breadcrumbs={[]} />
      ) : (
        <Header />
      )}

      <MobileContainer className="md:container md:mx-auto md:p-4">
        {!isMobile && (
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
        )}

      {/* Quick Stats Summary */}
      {orders && orders.length > 0 && (
        <div className={`grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4 mb-4`}>
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-3 md:p-4">
              <div className="text-xs md:text-sm text-blue-700 font-medium mb-1">Total Active</div>
              <div className="text-xl md:text-2xl font-bold text-blue-900">{orders.length}</div>
            </CardContent>
          </Card>
          <Card className="bg-yellow-50 border-yellow-200">
            <CardContent className="p-3 md:p-4">
              <div className="text-xs md:text-sm text-yellow-700 font-medium mb-1">Pending</div>
              <div className="text-xl md:text-2xl font-bold text-yellow-900">
                {orders.filter((o: any) => o.order_status === 'pending').length}
              </div>
            </CardContent>
          </Card>
          <Card className="bg-orange-50 border-orange-200">
            <CardContent className="p-3 md:p-4">
              <div className="text-xs md:text-sm text-orange-700 font-medium mb-1">In Progress</div>
              <div className="text-xl md:text-2xl font-bold text-orange-900">
                {orders.filter((o: any) => o.order_status === 'in_progress').length}
              </div>
            </CardContent>
          </Card>
          <Card className="bg-green-50 border-green-200">
            <CardContent className="p-3 md:p-4">
              <div className="text-xs md:text-sm text-green-700 font-medium mb-1">Ready</div>
              <div className="text-xl md:text-2xl font-bold text-green-900">
                {orders.filter((o: any) => o.order_status === 'ready').length}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Active Orders</span>
            {orders && orders.length > 0 && (
              <span className="text-sm font-normal text-muted-foreground">
                {orders.length} order{orders.length !== 1 ? 's' : ''}
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {orders && orders.length > 0 ? (
            <div className={isMobile ? "space-y-2" : "space-y-4"}>
              {orders.map((order) => {
                const priority = getOrderPriority(order.timestamp);
                return (
                <Card 
                  key={order.id}
                  className={`hover:bg-accent/50 transition-colors ${priority.className}`}
                >
                  <CardContent 
                    className={`${isMobile ? "p-3" : "p-4"} cursor-pointer active:bg-accent/70 transition-colors`}
                    onClick={() => {
                      setSelectedOrder(order);
                      setDialogOpen(true);
                    }}
                  >
                    <div className="flex items-start justify-between gap-2 md:gap-4">
                      <div className="flex-1 min-w-0">
                        {/* Order Number with Date/Time - Compact */}
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <span className={`font-bold ${isMobile ? 'text-lg' : 'text-xl'}`}>#{order.id}</span>
                          <div className={`flex items-center gap-1 ${isMobile ? 'text-xs' : 'text-sm'} text-muted-foreground`}>
                            <Clock className={isMobile ? "h-3 w-3" : "h-3.5 w-3.5"} />
                            <span>{formatTime(order.timestamp)} • {formatDate(order.timestamp)}</span>
                            <span className="ml-1 text-xs opacity-70">({getTimeAgo(order.timestamp)})</span>
                          </div>
                        </div>
                        
                        {/* Order Type and Status Badges */}
                        <div className="flex items-center gap-1.5 mb-2 md:mb-3 flex-wrap">
                          {getOrderTypeBadge(order.order_type)}
                          {getStatusBadge(order.order_status || 'pending')}
                        </div>
                        {/* Items List - More Compact */}
                        <div className="space-y-0.5 md:space-y-1">
                          {Array.isArray(order.items) ? (
                            <>
                              {order.items.slice(0, isMobile ? 3 : 4).map((item: any, index: number) => (
                                <div key={index} className={`${isMobile ? "text-xs" : "text-sm"} flex items-center gap-1`}>
                                  <span className="font-bold text-primary">{item.quantity}x</span>
                                  <span className="truncate">{item.name}</span>
                                  {item.portionType?.label && item.portionType.label !== 'Full' && (
                                    <span className="text-muted-foreground text-xs">({item.portionType.label})</span>
                                  )}
                                  {item.isHalf && (
                                    <span className="text-muted-foreground text-xs">(Half)</span>
                                  )}
                                </div>
                              ))}
                              {order.items.length > (isMobile ? 3 : 4) && (
                                <p className="text-xs text-muted-foreground font-medium">
                                  +{order.items.length - (isMobile ? 3 : 4)} more
                                </p>
                              )}
                              {/* Total Items Count */}
                              <div className="pt-1 mt-1 border-t border-dashed">
                                <span className="text-xs font-semibold text-muted-foreground">
                                  {order.items.reduce((sum: number, item: any) => sum + (item.quantity || 1), 0)} total items
                                </span>
                              </div>
                            </>
                          ) : (
                            <p className={`${isMobile ? "text-xs" : "text-sm"} text-muted-foreground`}>No items</p>
                          )}
                        </div>
                      </div>
                      {/* Action Buttons - More Prominent */}
                      <div className={`text-right ${isMobile ? 'ml-2' : 'ml-4'} shrink-0`}>
                        <div className={`flex flex-col ${isMobile ? 'gap-1.5' : 'gap-2'}`}>
                          {order.order_status === 'pending' && (
                            <Button
                              size={isMobile ? "sm" : "default"}
                              variant="default"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStatusUpdate(order.id, 'in_progress', e);
                              }}
                              disabled={updateOrderStatus.isPending}
                              className={`${isMobile ? "w-full text-xs h-9 font-semibold" : "w-full font-semibold"} bg-blue-600 hover:bg-blue-700 shadow-md`}
                            >
                              <Play className={isMobile ? "h-3.5 w-3.5 mr-1.5" : "h-4 w-4 mr-1.5"} />
                              {isMobile ? "Start" : "Start Cooking"}
                            </Button>
                          )}
                          {order.order_status === 'in_progress' && (
                            <>
                              <Button
                                size={isMobile ? "sm" : "default"}
                                variant="default"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleStatusUpdate(order.id, 'ready', e);
                                }}
                                disabled={updateOrderStatus.isPending}
                                className={`${isMobile ? "w-full text-xs h-9 font-semibold" : "w-full font-semibold"} bg-green-600 hover:bg-green-700 shadow-md`}
                              >
                                <CheckCircle2 className={isMobile ? "h-3.5 w-3.5 mr-1.5" : "h-4 w-4 mr-1.5"} />
                                {isMobile ? "Ready" : "Mark Ready"}
                              </Button>
                              <Button
                                size={isMobile ? "sm" : "sm"}
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleStatusUpdate(order.id, 'completed', e);
                                }}
                                disabled={updateOrderStatus.isPending}
                                className={`${isMobile ? "w-full text-xs h-8" : "w-full"} border-gray-300`}
                              >
                                <X className={isMobile ? "h-3 w-3 mr-1" : "h-3.5 w-3.5 mr-1"} />
                                Complete
                              </Button>
                            </>
                          )}
                          {order.order_status === 'ready' && (
                            <Button
                              size={isMobile ? "sm" : "default"}
                              variant="default"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStatusUpdate(order.id, 'completed', e);
                              }}
                              disabled={updateOrderStatus.isPending}
                              className={`${isMobile ? "w-full text-xs h-9 font-semibold" : "w-full font-semibold"} bg-purple-600 hover:bg-purple-700 shadow-md`}
                            >
                              <CheckCircle2 className={isMobile ? "h-3.5 w-3.5 mr-1.5" : "h-4 w-4 mr-1.5"} />
                              Complete Order
                            </Button>
                          )}
                          <Button
                            size={isMobile ? "sm" : "sm"}
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedOrder(order);
                              setDialogOpen(true);
                            }}
                            className={`${isMobile ? "w-full text-xs h-8" : "w-full"} text-muted-foreground hover:text-foreground`}
                          >
                            {isMobile ? "View All" : "View Details"}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                );
              })}
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
      </MobileContainer>
    </div>
  );
};

export default KitchenOrders;

