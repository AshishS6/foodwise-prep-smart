
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { 
  BarChart3, 
  ScrollText, 
  ShoppingCart, 
  Package, 
  TrendingUp,
  TrendingDown,
  Utensils,
  CheckCircle2,
  DollarSign,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { toZonedTime } from "date-fns-tz"; // Updated from utcToZonedTime
import { useAuth } from "@/contexts/AuthContext";
import { useCurrentTeamMember } from "@/hooks/useTeamMembers";
import { Header } from "@/components/layout/Header";
import { MobileHeader } from "@/components/layout/MobileHeader";
import { MobileContainer } from "@/components/layout/MobileContainer";
import { useDeviceDetection } from "@/hooks/useDeviceDetection";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const Index = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { data: teamMember } = useCurrentTeamMember();
  const { isMobile } = useDeviceDetection();
  const timeZone = "Asia/Kolkata";
  const [revenueExpanded, setRevenueExpanded] = useState(false);
  const [kitchenExpanded, setKitchenExpanded] = useState(false);

  // Fetch today's sales
  const { data: todaySales, isLoading: salesLoading, dataUpdatedAt: salesUpdatedAt } = useQuery({
    queryKey: ['todaySales'],
    queryFn: async () => {
      try {
        const today = toZonedTime(new Date(), timeZone);
        today.setHours(0, 0, 0, 0);
        
        const { data, error } = await supabase
          .from('orders')
          .select('*')
          .gte('timestamp', today.toISOString());
        
        if (error) throw error;
        
        return {
          orders: (data || []) as any[],
          totalRevenue: (data || []).reduce((sum: number, order: any) => sum + (order.total || 0), 0)
        };
      } catch (error: any) {
        toast({
          title: "Error fetching sales data",
          description: error.message,
          variant: "destructive"
        });
        return { orders: [], totalRevenue: 0 };
      }
    }
  });

  // Fetch yesterday's sales for comparison
  const { data: yesterdaySales } = useQuery({
    queryKey: ['yesterdaySales'],
    queryFn: async () => {
      try {
        const yesterday = toZonedTime(new Date(), timeZone);
        yesterday.setDate(yesterday.getDate() - 1);
        yesterday.setHours(0, 0, 0, 0);
        const today = toZonedTime(new Date(), timeZone);
        today.setHours(0, 0, 0, 0);
        
        const { data, error } = await supabase
          .from('orders')
          .select('*')
          .gte('timestamp', yesterday.toISOString())
          .lt('timestamp', today.toISOString());
        
        if (error) throw error;
        
        return {
          orders: (data || []) as any[],
          totalRevenue: (data || []).reduce((sum: number, order: any) => sum + (order.total || 0), 0)
        };
      } catch (error: any) {
        return { orders: [], totalRevenue: 0 };
      }
    }
  });

  // Fetch kitchen orders (pending/in_progress)
  const { data: kitchenOrders } = useQuery({
    queryKey: ['kitchenOrders'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('orders')
          .select('*')
          .in('order_status', ['pending', 'in_progress'] as any)
          .in('order_type', ['take_away', 'seating'] as any)
          .order('timestamp', { ascending: true });
        
        if (error) throw error;
        return (data || []) as any[];
      } catch (error: any) {
        return [];
      }
    }
  });

  // Fetch menu items for top sellers
  const { data: menuItems } = useQuery({
    queryKey: ['menuItems'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('menuitems')
          .select('*');
        if (error) throw error;
        return data || [];
      } catch (error: any) {
        return [];
      }
    }
  });

  // Calculate top selling items
  const topSellingItems = React.useMemo(() => {
    if (!todaySales?.orders || !menuItems) return [];
    
    const itemCounts: Record<number, { count: number; revenue: number; name: string }> = {};
    
    todaySales.orders.forEach((order: any) => {
      if (order.items && Array.isArray(order.items)) {
        order.items.forEach((item: any) => {
          if (item.menuItemId) {
            if (!itemCounts[item.menuItemId]) {
              const menuItem = (menuItems as any[]).find((m: any) => m.id === item.menuItemId);
              itemCounts[item.menuItemId] = {
                count: 0,
                revenue: 0,
                name: menuItem?.name || 'Unknown'
              };
            }
            itemCounts[item.menuItemId].count += item.quantity || 0;
            itemCounts[item.menuItemId].revenue += (item.price || 0) * (item.quantity || 0);
          }
        });
      }
    });
    
    return Object.entries(itemCounts)
      .map(([id, data]) => ({ id: parseInt(id), ...data }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [todaySales?.orders, menuItems]);

  // Calculate revenue change
  const revenueChange = React.useMemo(() => {
    if (!yesterdaySales?.totalRevenue || !todaySales?.totalRevenue) return null;
    const change = todaySales.totalRevenue - yesterdaySales.totalRevenue;
    const percentChange = yesterdaySales.totalRevenue > 0 
      ? ((change / yesterdaySales.totalRevenue) * 100).toFixed(1)
      : '0';
    return { change, percentChange, isPositive: change >= 0 };
  }, [todaySales?.totalRevenue, yesterdaySales?.totalRevenue]);

  // Calculate order status breakdown
  const orderStatusBreakdown = React.useMemo(() => {
    if (!todaySales?.orders) return { pending: 0, in_progress: 0, ready: 0, completed: 0 };
    
    return todaySales.orders.reduce((acc: any, order: any) => {
      const status = order.order_status || 'pending';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, { pending: 0, in_progress: 0, ready: 0, completed: 0 });
  }, [todaySales?.orders]);

  // Get recent orders
  const recentOrders = React.useMemo(() => {
    if (!todaySales?.orders) return [];
    return [...todaySales.orders]
      .sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 5);
  }, [todaySales?.orders]);

  // Calculate average order value
  const averageOrderValue = React.useMemo(() => {
    if (!todaySales?.orders || todaySales.orders.length === 0) return 0;
    return todaySales.totalRevenue / todaySales.orders.length;
  }, [todaySales]);


  const modules = [
    {
      title: "POS",
      icon: <ShoppingCart className="h-6 w-6 text-blue-500" />,
      path: "/pos",
      bgColor: "hover:bg-blue-50/60"
    },
    {
      title: "Inventory",
      icon: <Package className="h-6 w-6 text-orange-500" />,
      path: "/inventory",
      bgColor: "hover:bg-orange-50/60"
    },
    {
      title: "Recipes",
      icon: <ScrollText className="h-6 w-6 text-green-500" />,
      path: "/recipes",
      bgColor: "hover:bg-green-50/60"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {isMobile ? (
        <MobileHeader title="Dashboard" showBack={false} />
      ) : (
        <Header />
      )}

      <MobileContainer className="md:container md:mx-auto md:p-6">
        <div className="space-y-4 md:space-y-6">
          {!isMobile && (
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl font-semibold">Dashboard Overview</h1>
            </div>
          )}
          
          {/* Main Dashboard Cards - Only Revenue and Kitchen Queue */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
            {/* Today's Revenue Card - Expandable */}
            <Card 
              className={`rounded-xl shadow-lg transition-all duration-300 overflow-hidden border-2 ${
                revenueExpanded 
                  ? 'border-blue-400 bg-blue-50/30' 
                  : 'border-blue-200 bg-white hover:border-blue-300 hover:shadow-xl'
              }`}
            >
              <CardHeader 
                className={`pb-3 pt-4 px-4 flex flex-row items-center justify-between cursor-pointer transition-colors ${
                  revenueExpanded ? 'bg-blue-500' : 'bg-blue-100 hover:bg-blue-200'
                }`}
                onClick={() => setRevenueExpanded(!revenueExpanded)}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${revenueExpanded ? 'bg-white/20' : 'bg-blue-500'}`}>
                    <DollarSign className={`h-5 w-5 ${revenueExpanded ? 'text-white' : 'text-white'}`} />
                  </div>
                  <CardTitle className={`text-lg font-bold ${revenueExpanded ? 'text-white' : 'text-blue-900'}`}>
                    Today's Revenue
                  </CardTitle>
                </div>
                <button className="p-1 hover:bg-white/20 rounded-full transition-colors">
                  {revenueExpanded ? (
                    <ChevronUp className={`h-5 w-5 ${revenueExpanded ? 'text-white' : 'text-blue-700'}`} />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-blue-700" />
                  )}
                </button>
              </CardHeader>
              <CardContent className="p-4">
                {salesLoading ? (
                  <p className="text-sm text-muted-foreground">Loading...</p>
                ) : (
                  <>
                    <div className="mb-4">
                      <p className="text-4xl font-bold text-blue-600 mb-2">
                        ₹{todaySales?.totalRevenue?.toFixed(2) || "0.00"}
                      </p>
                      {revenueChange && (
                        <div className={`flex items-center gap-2 text-sm font-medium ${
                          revenueChange.isPositive ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {revenueChange.isPositive ? (
                            <TrendingUp className="h-4 w-4" />
                          ) : (
                            <TrendingDown className="h-4 w-4" />
                          )}
                          <span>
                            {revenueChange.isPositive ? '+' : ''}₹{Math.abs(revenueChange.change).toFixed(2)} 
                            ({revenueChange.percentChange}%) vs yesterday
                          </span>
                        </div>
                      )}
                      <p className="text-sm text-muted-foreground mt-2">
                        {todaySales?.orders?.length || 0} orders • Avg ₹{averageOrderValue.toFixed(2)}
                      </p>
                    </div>
                    
                    {/* Expanded Section - Top Selling Items */}
                    {revenueExpanded && (
                      <div className="mt-4 pt-4 border-t border-blue-200 animate-in slide-in-from-top-2 duration-300">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="text-sm font-semibold text-blue-900 flex items-center gap-2">
                            <BarChart3 className="h-4 w-4 text-blue-600" />
                            Top Selling Items Today
                          </h3>
                        </div>
                        {topSellingItems.length === 0 ? (
                          <p className="text-sm text-muted-foreground text-center py-4">No sales data yet</p>
                        ) : (
                          <div className="space-y-2">
                            {topSellingItems.slice(0, 5).map((item, index) => (
                              <div 
                                key={item.id} 
                                className="flex items-center justify-between p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                              >
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                                    index === 0 ? 'bg-yellow-400 text-yellow-900' :
                                    index === 1 ? 'bg-gray-300 text-gray-700' :
                                    index === 2 ? 'bg-orange-300 text-orange-900' :
                                    'bg-blue-200 text-blue-800'
                                  }`}>
                                    #{index + 1}
                                  </div>
                                  <span className="text-sm font-medium truncate">{item.name}</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm">
                                  <span className="text-muted-foreground">{item.count} sold</span>
                                  <span className="font-bold text-blue-600">₹{item.revenue.toFixed(2)}</span>
                                </div>
                              </div>
                            ))}
                            {topSellingItems.length > 5 && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate('/analytics');
                                }}
                                className="w-full mt-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                              >
                                View All ({topSellingItems.length} items) →
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>

            {/* Kitchen Queue Card - Expandable */}
            <Card 
              className={`rounded-xl shadow-lg transition-all duration-300 overflow-hidden border-2 ${
                kitchenExpanded 
                  ? 'border-green-400 bg-green-50/30' 
                  : 'border-green-200 bg-white hover:border-green-300 hover:shadow-xl'
              }`}
            >
              <CardHeader 
                className={`pb-3 pt-4 px-4 flex flex-row items-center justify-between cursor-pointer transition-colors ${
                  kitchenExpanded ? 'bg-green-500' : 'bg-green-100 hover:bg-green-200'
                }`}
                onClick={() => setKitchenExpanded(!kitchenExpanded)}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${kitchenExpanded ? 'bg-white/20' : 'bg-green-500'}`}>
                    <Utensils className="h-5 w-5 text-white" />
                  </div>
                  <CardTitle className={`text-lg font-bold ${kitchenExpanded ? 'text-white' : 'text-green-900'}`}>
                    Kitchen Queue
                  </CardTitle>
                </div>
                <button className="p-1 hover:bg-white/20 rounded-full transition-colors">
                  {kitchenExpanded ? (
                    <ChevronUp className="h-5 w-5 text-white" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-green-700" />
                  )}
                </button>
              </CardHeader>
              <CardContent className="p-4">
                <div className="mb-4">
                  <p className="text-4xl font-bold text-green-600 mb-2">
                    {kitchenOrders?.length || 0}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {orderStatusBreakdown.pending || 0} pending • {orderStatusBreakdown.in_progress || 0} cooking
                  </p>
                </div>
                
                {/* Expanded Section - Order Status Breakdown */}
                {kitchenExpanded && (
                  <div className="mt-4 pt-4 border-t border-green-200 animate-in slide-in-from-top-2 duration-300">
                    <h3 className="text-sm font-semibold text-green-900 mb-3 flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      Order Status Breakdown
                    </h3>
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="p-4 bg-yellow-50 border-2 border-yellow-200 rounded-lg text-center">
                        <p className="text-2xl font-bold text-yellow-600 mb-1">{orderStatusBreakdown.pending || 0}</p>
                        <p className="text-xs font-medium text-yellow-700">Pending</p>
                      </div>
                      <div className="p-4 bg-blue-50 border-2 border-blue-200 rounded-lg text-center">
                        <p className="text-2xl font-bold text-blue-600 mb-1">{orderStatusBreakdown.in_progress || 0}</p>
                        <p className="text-xs font-medium text-blue-700">Cooking</p>
                      </div>
                      <div className="p-4 bg-green-50 border-2 border-green-200 rounded-lg text-center">
                        <p className="text-2xl font-bold text-green-600 mb-1">{orderStatusBreakdown.ready || 0}</p>
                        <p className="text-xs font-medium text-green-700">Ready</p>
                      </div>
                      <div className="p-4 bg-gray-50 border-2 border-gray-200 rounded-lg text-center">
                        <p className="text-2xl font-bold text-gray-600 mb-1">{orderStatusBreakdown.completed || 0}</p>
                        <p className="text-xs font-medium text-gray-700">Completed</p>
                      </div>
                    </div>
                    {recentOrders.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-green-200">
                        <p className="text-xs font-semibold text-green-900 mb-2">Recent Orders</p>
                        <div className="space-y-2">
                          {recentOrders.slice(0, 5).map((order: any, idx: number) => (
                            <div 
                              key={idx} 
                              className="flex items-center justify-between p-2 bg-white rounded-lg border border-green-100 hover:bg-green-50 transition-colors"
                            >
                              <span className="text-xs text-muted-foreground">
                                {format(new Date(order.timestamp), 'HH:mm')}
                              </span>
                              <span className="text-sm font-semibold text-green-700">
                                ₹{order.total?.toFixed(2) || '0.00'}
                              </span>
                              <span className={`px-2 py-0.5 rounded text-xs font-medium border ${
                                order.order_status === 'completed' ? 'bg-slate-50 text-slate-600 border-slate-200' :
                                order.order_status === 'ready'     ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                order.order_status === 'in_progress' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                                'bg-amber-50 text-amber-700 border-amber-200'
                              }`}>
                                {order.order_status === 'in_progress' ? 'In Progress' :
                                 order.order_status === 'completed' ? 'Completed' :
                                 order.order_status === 'ready' ? 'Ready' : 'Pending'}
                              </span>
                            </div>
                          ))}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate('/kitchen-orders');
                          }}
                          className="w-full mt-3 text-green-600 hover:text-green-700 hover:bg-green-50"
                        >
                          View All Kitchen Orders →
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>


        {/* Quick Actions */}
        <div className="mt-4 md:mt-6">
          <h2 className="text-sm font-medium mb-3 text-muted-foreground uppercase tracking-wide">Quick Actions</h2>
          <div className="grid grid-cols-3 gap-3">
            {modules.map((module) => (
              <Button
                key={module.title}
                variant="outline"
                className={`h-auto py-4 px-2 flex flex-col items-center justify-center gap-2 text-center rounded-xl transition-colors duration-150 bg-white border hover:shadow-sm ${module.bgColor}`}
                onClick={() => navigate(module.path)}
              >
                {module.icon}
                <span className="font-semibold text-xs md:text-sm">{module.title}</span>
              </Button>
            ))}
          </div>
        </div>

        {!isMobile && (
          <div className="fixed bottom-6 right-6 z-10">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    className="rounded-full h-16 w-16 shadow-lg hover:shadow-xl transition-all duration-200" 
                    onClick={() => navigate('/pos')}
                    size="lg"
                  >
                    <ShoppingCart className="h-8 w-8" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="left">
                  <p>New Order</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        )}
        </div>
      </MobileContainer>
    </div>
  );
};

export default Index;
