
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { 
  BarChart3, 
  ChefHat, 
  ScrollText, 
  ShoppingCart, 
  Package, 
  AlertTriangle, 
  Calendar, 
  PlusCircle,
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
  const [lowStockExpanded, setLowStockExpanded] = useState(false);
  const [prepPlanExpanded, setPrepPlanExpanded] = useState(false);

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

  const { data: lowStockIngredients, isLoading: ingredientsLoading, dataUpdatedAt: ingredientsUpdatedAt } = useQuery({
    queryKey: ['lowStockIngredients'],
    queryFn: async () => {
      try {
        const THRESHOLD = 10;
        
        const { data, error } = await supabase
          .from('ingredients')
          .select('*')
          .lt('stock', THRESHOLD);
        
        if (error) throw error;
        
        return data || [];
      } catch (error: any) {
        toast({
          title: "Error fetching inventory data",
          description: error.message,
          variant: "destructive"
        });
        return [];
      }
    }
  });

  const { data: prepPlan, isLoading: prepLoading, dataUpdatedAt: prepUpdatedAt } = useQuery({
    queryKey: ['tomorrowPrepPlan'],
    queryFn: async () => {
      try {
        const tomorrow = toZonedTime(new Date(), timeZone); // Updated from utcToZonedTime
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);
        
        const tomorrowDateStr = format(tomorrow, 'yyyy-MM-dd');
        
        const { data, error } = await supabase
          .from('prepplans')
          .select('*')
          .eq('date', tomorrowDateStr as any);
        
        if (error) throw error;
        
        return data || [];
      } catch (error: any) {
        toast({
          title: "Error fetching prep plan",
          description: error.message,
          variant: "destructive"
        });
        return [];
      }
    }
  });

  const getTimeAgo = (timestamp: number) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    
    if (seconds < 60) return `${seconds} seconds ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    return `${Math.floor(seconds / 86400)} days ago`;
  };

  const modules = [
    {
      title: "POS / Sales Entry",
      icon: <ShoppingCart className="h-8 w-8 text-blue-500" />,
      description: "Create new orders and process sales",
      path: "/pos",
      bgColor: "hover:bg-blue-50"
    },
    {
      title: "Inventory Management",
      icon: <Package className="h-8 w-8 text-orange-500" />,
      description: "Manage ingredients and stock levels",
      path: "/inventory",
      bgColor: "hover:bg-orange-50"
    },
    {
      title: "Recipe Management",
      icon: <ScrollText className="h-8 w-8 text-green-500" />,
      description: "Define dishes and required ingredients",
      path: "/recipes",
      bgColor: "hover:bg-green-50"
    },
    {
      title: "Prep Planning",
      icon: <ChefHat className="h-8 w-8 text-purple-500" />,
      description: "View and update daily preparation plans",
      path: "/prep-plans",
      bgColor: "hover:bg-purple-50"
    },
    {
      title: "Analytics & Reports",
      icon: <BarChart3 className="h-8 w-8 text-indigo-500" />,
      description: "View sales data and inventory analytics",
      path: "/analytics",
      bgColor: "hover:bg-indigo-50"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {isMobile ? (
        <MobileHeader title="Dashboard" />
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
          
          {/* Key Metrics Row */}
          <div className={`grid grid-cols-1 sm:grid-cols-2 ${lowStockExpanded || prepPlanExpanded ? 'lg:grid-cols-4' : 'lg:grid-cols-2'} gap-2 md:gap-3 lg:gap-4 transition-all duration-300`}>
          <Card 
            className="rounded-lg md:rounded-xl shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer bg-white/70 backdrop-blur-sm border-muted/20 hover:border-primary/20 overflow-hidden"
            onClick={() => navigate('/order-history')}
          >
            <CardHeader className="pb-2 pt-2 md:pt-3 px-2 md:px-3 lg:px-4 flex flex-row items-center justify-between bg-blue-50/50">
              <CardTitle className="text-xs md:text-sm lg:text-base font-medium text-blue-700">Today's Revenue</CardTitle>
              <DollarSign className="h-3 w-3 md:h-4 md:w-4 text-blue-500" />
            </CardHeader>
            <CardContent className="pt-2 md:pt-3 px-2 md:px-3 lg:px-4 pb-2 md:pb-3 lg:pb-4">
              {salesLoading ? (
                <p className="text-sm">Loading...</p>
              ) : (
                <>
                  <p className="text-xl md:text-2xl lg:text-3xl font-bold">₹{todaySales?.totalRevenue?.toFixed(2) || "0.00"}</p>
                  {revenueChange && (
                    <div className={`flex items-center gap-1 mt-1 text-xs ${revenueChange.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                      {revenueChange.isPositive ? (
                        <TrendingUp className="h-3 w-3" />
                      ) : (
                        <TrendingDown className="h-3 w-3" />
                      )}
                      <span>{revenueChange.isPositive ? '+' : ''}₹{Math.abs(revenueChange.change).toFixed(2)} ({revenueChange.percentChange}%)</span>
                      <span className="text-muted-foreground">vs yesterday</span>
                    </div>
                  )}
                  <p className="text-xs md:text-sm text-muted-foreground mt-1">{todaySales?.orders?.length || 0} orders • Avg ₹{averageOrderValue.toFixed(2)}</p>
                </>
              )}
            </CardContent>
          </Card>

          <Card 
            className="rounded-lg md:rounded-xl shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer bg-white/70 backdrop-blur-sm border-muted/20 hover:border-primary/20 overflow-hidden"
            onClick={() => navigate('/kitchen-orders')}
          >
            <CardHeader className="pb-2 pt-2 md:pt-3 px-2 md:px-3 lg:px-4 flex flex-row items-center justify-between bg-green-50/50">
              <CardTitle className="text-xs md:text-sm lg:text-base font-medium text-green-700">Kitchen Queue</CardTitle>
              <Utensils className="h-3 w-3 md:h-4 md:w-4 text-green-500" />
            </CardHeader>
            <CardContent className="pt-2 md:pt-3 px-2 md:px-3 lg:px-4 pb-2 md:pb-3 lg:pb-4">
              <p className="text-xl md:text-2xl lg:text-3xl font-bold text-green-600">{kitchenOrders?.length || 0}</p>
              <p className="text-xs md:text-sm text-muted-foreground mt-1">
                {orderStatusBreakdown.pending || 0} pending • {orderStatusBreakdown.in_progress || 0} cooking
              </p>
            </CardContent>
          </Card>

          {(!isMobile || lowStockExpanded) && (
            <Card 
              className="rounded-lg md:rounded-xl shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer bg-white/70 backdrop-blur-sm border-muted/20 hover:border-primary/20 overflow-hidden"
              onClick={() => navigate('/inventory')}
            >
              <CardHeader className="pb-2 pt-2 md:pt-3 px-2 md:px-3 lg:px-4 flex flex-row items-center justify-between bg-orange-50/50">
                <CardTitle className="text-xs md:text-sm lg:text-base font-medium text-orange-700">Low Stock</CardTitle>
                <div className="flex items-center gap-1">
                  {isMobile && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setLowStockExpanded(false);
                      }}
                      className="p-1"
                    >
                      <ChevronUp className="h-3 w-3 text-orange-500" />
                    </button>
                  )}
                  <AlertTriangle className="h-3 w-3 md:h-4 md:w-4 text-orange-500" />
                </div>
              </CardHeader>
              <CardContent className="pt-2 md:pt-3 px-2 md:px-3 lg:px-4 pb-2 md:pb-3 lg:pb-4">
                {ingredientsLoading ? (
                  <p className="text-xs md:text-sm">Loading...</p>
                ) : (
                  <div>
                    <p className="text-xl md:text-2xl lg:text-3xl font-bold text-orange-500">{Array.isArray(lowStockIngredients) ? lowStockIngredients.length : 0}</p>
                    <p className="text-xs md:text-sm text-muted-foreground mt-1">items need restocking</p>
                    {lowStockIngredients && lowStockIngredients.length > 0 && (
                      <p className="text-xs text-orange-600 mt-1 truncate">
                        {lowStockIngredients.slice(0, 2).map((ing: any) => ing.name).join(', ')}
                        {lowStockIngredients.length > 2 && '...'}
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
          {isMobile && !lowStockExpanded && (
            <Card 
              className="rounded-lg shadow-sm cursor-pointer bg-white/70 backdrop-blur-sm border-muted/20 hover:border-primary/20 overflow-hidden"
              onClick={(e) => {
                e.stopPropagation();
                setLowStockExpanded(true);
              }}
            >
              <CardHeader className="pb-2 pt-2 px-2 flex flex-row items-center justify-between bg-orange-50/50">
                <CardTitle className="text-xs font-medium text-orange-700">Low Stock</CardTitle>
                <ChevronDown className="h-3 w-3 text-orange-500" />
              </CardHeader>
              <CardContent className="pt-2 px-2 pb-2">
                <p className="text-lg font-bold text-orange-500">{Array.isArray(lowStockIngredients) ? lowStockIngredients.length : 0}</p>
              </CardContent>
            </Card>
          )}

          {(!isMobile || prepPlanExpanded) && (
            <Card 
              className="rounded-lg md:rounded-xl shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer bg-white/70 backdrop-blur-sm border-muted/20 hover:border-primary/20 overflow-hidden"
              onClick={() => navigate('/prep-plans')}
            >
              <CardHeader className="pb-2 pt-2 md:pt-3 px-2 md:px-3 lg:px-4 flex flex-row items-center justify-between bg-purple-50/50">
                <CardTitle className="text-xs md:text-sm lg:text-base font-medium text-purple-700">Prep Plan</CardTitle>
                <div className="flex items-center gap-1">
                  {isMobile && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setPrepPlanExpanded(false);
                      }}
                      className="p-1"
                    >
                      <ChevronUp className="h-3 w-3 text-purple-500" />
                    </button>
                  )}
                  <Calendar className="h-3 w-3 md:h-4 md:w-4 text-purple-500" />
                </div>
              </CardHeader>
              <CardContent className="pt-2 md:pt-3 px-2 md:px-3 lg:px-4 pb-2 md:pb-3 lg:pb-4">
                {prepLoading ? (
                  <p className="text-xs md:text-sm">Loading...</p>
                ) : prepPlan && prepPlan.length === 0 ? (
                  <div className="space-y-2">
                    <p className="text-xs md:text-sm">No prep plan for tomorrow</p>
                    <Button size="sm" onClick={(e) => { e.stopPropagation(); navigate('/prep-plans'); }} className="flex items-center text-xs h-6 md:h-7">
                      <PlusCircle className="h-3 w-3 mr-1" />
                      Plan Now
                    </Button>
                  </div>
                ) : (
                  <div>
                    <p className="text-xl md:text-2xl lg:text-3xl font-bold text-purple-700">{Array.isArray(prepPlan) ? prepPlan.length : 0}</p>
                    <p className="text-xs md:text-sm text-muted-foreground mt-1">items for tomorrow</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
          {isMobile && !prepPlanExpanded && (
            <Card 
              className="rounded-lg shadow-sm cursor-pointer bg-white/70 backdrop-blur-sm border-muted/20 hover:border-primary/20 overflow-hidden"
              onClick={(e) => {
                e.stopPropagation();
                setPrepPlanExpanded(true);
              }}
            >
              <CardHeader className="pb-2 pt-2 px-2 flex flex-row items-center justify-between bg-purple-50/50">
                <CardTitle className="text-xs font-medium text-purple-700">Prep Plan</CardTitle>
                <ChevronDown className="h-3 w-3 text-purple-500" />
              </CardHeader>
              <CardContent className="pt-2 px-2 pb-2">
                <p className="text-lg font-bold text-purple-700">{Array.isArray(prepPlan) ? prepPlan.length : 0}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Data-Driven Insights Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 md:gap-3 lg:gap-4 mt-3 md:mt-4 lg:mt-6">
          {/* Top Selling Items */}
          <Card className="rounded-lg md:rounded-xl shadow-sm bg-white/70 backdrop-blur-sm border-muted/20">
            <CardHeader className="pb-2 pt-2 md:pt-3 px-2 md:px-3 lg:px-4 bg-indigo-50/50">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs md:text-sm lg:text-base font-medium text-indigo-700">Top Selling Items Today</CardTitle>
                <BarChart3 className="h-3 w-3 md:h-4 md:w-4 text-indigo-500" />
              </div>
            </CardHeader>
            <CardContent className="pt-2 md:pt-3 px-2 md:px-3 lg:px-4 pb-2 md:pb-3 lg:pb-4">
              {topSellingItems.length === 0 ? (
                <p className="text-xs md:text-sm text-muted-foreground text-center py-3 md:py-4">No sales data yet</p>
              ) : (
                <div className="space-y-1 md:space-y-2">
                  {topSellingItems.slice(0, 3).map((item, index) => (
                    <div key={item.id} className="flex items-center justify-between p-1.5 md:p-2 bg-muted/30 rounded-md">
                      <div className="flex items-center gap-1.5 md:gap-2 flex-1 min-w-0">
                        <span className="text-xs font-bold text-muted-foreground w-3 md:w-4">#{index + 1}</span>
                        <span className="text-xs md:text-sm font-medium truncate">{item.name}</span>
                      </div>
                      <div className="flex items-center gap-2 md:gap-3 text-xs">
                        <span className="text-muted-foreground">{item.count} sold</span>
                        <span className="font-semibold text-indigo-600">₹{item.revenue.toFixed(2)}</span>
                      </div>
                    </div>
                  ))}
                  {topSellingItems.length > 3 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate('/analytics')}
                      className="w-full mt-2 text-xs h-7"
                    >
                      View All ({topSellingItems.length} items)
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Order Status & Recent Orders */}
          <Card className="rounded-lg md:rounded-xl shadow-sm bg-white/70 backdrop-blur-sm border-muted/20">
            <CardHeader className="pb-2 pt-2 md:pt-3 px-2 md:px-3 lg:px-4 bg-blue-50/50">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs md:text-sm lg:text-base font-medium text-blue-700">Order Status</CardTitle>
                <CheckCircle2 className="h-3 w-3 md:h-4 md:w-4 text-blue-500" />
              </div>
            </CardHeader>
            <CardContent className="pt-2 md:pt-3 px-2 md:px-3 lg:px-4 pb-2 md:pb-3 lg:pb-4">
              <div className="grid grid-cols-2 gap-1.5 md:gap-2 mb-2 md:mb-3">
                <div className="p-2 bg-yellow-50 rounded-md text-center">
                  <p className="text-lg font-bold text-yellow-600">{orderStatusBreakdown.pending || 0}</p>
                  <p className="text-xs text-muted-foreground">Pending</p>
                </div>
                <div className="p-2 bg-blue-50 rounded-md text-center">
                  <p className="text-lg font-bold text-blue-600">{orderStatusBreakdown.in_progress || 0}</p>
                  <p className="text-xs text-muted-foreground">Cooking</p>
                </div>
                <div className="p-2 bg-green-50 rounded-md text-center">
                  <p className="text-lg font-bold text-green-600">{orderStatusBreakdown.ready || 0}</p>
                  <p className="text-xs text-muted-foreground">Ready</p>
                </div>
                <div className="p-2 bg-gray-50 rounded-md text-center">
                  <p className="text-lg font-bold text-gray-600">{orderStatusBreakdown.completed || 0}</p>
                  <p className="text-xs text-muted-foreground">Completed</p>
                </div>
              </div>
              {recentOrders.length > 0 && (
                <div className="mt-3 pt-3 border-t">
                  <p className="text-xs font-medium text-muted-foreground mb-2">Recent Orders</p>
                  <div className="space-y-1">
                    {recentOrders.slice(0, 3).map((order: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">
                          {format(new Date(order.timestamp), 'HH:mm')}
                        </span>
                        <span className="font-medium">₹{order.total?.toFixed(2) || '0.00'}</span>
                        <span className={`px-2 py-0.5 rounded text-xs ${
                          order.order_status === 'completed' ? 'bg-green-100 text-green-700' :
                          order.order_status === 'ready' ? 'bg-blue-100 text-blue-700' :
                          order.order_status === 'in_progress' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {order.order_status || 'pending'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mt-4 md:mt-6">
          {modules.filter(m => m.title !== "Analytics & Reports").map((module) => (
            <Button
              key={module.title}
              variant="outline"
              className={`h-auto p-3 md:p-4 flex flex-col items-center justify-center gap-2 text-center rounded-lg md:rounded-xl transition-all duration-200 hover:shadow-md bg-white/70 backdrop-blur-sm border-muted/20 hover:border-primary/20 ${module.bgColor}`}
              onClick={() => navigate(module.path)}
            >
              <div className="h-6 w-6 md:h-8 md:w-8">{module.icon}</div>
              <div>
                <h3 className="font-semibold text-xs md:text-sm">{module.title}</h3>
                <p className="text-xs text-muted-foreground hidden md:block mt-1">{module.description}</p>
              </div>
            </Button>
          ))}
        </div>

        {!isMobile && (
          <div className="fixed bottom-6 right-6 z-10 flex flex-col gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button className="rounded-full h-12 w-12 shadow-lg" onClick={() => navigate('/pos')}>
                  <ShoppingCart className="h-6 w-6" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left">
                <p>New Order</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button className="rounded-full h-12 w-12 shadow-lg bg-orange-500 hover:bg-orange-600" onClick={() => navigate('/inventory')}>
                  <Package className="h-6 w-6" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left">
                <p>New Purchase</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button className="rounded-full h-12 w-12 shadow-lg bg-green-500 hover:bg-green-600" onClick={() => navigate('/recipes')}>
                  <ScrollText className="h-6 w-6" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left">
                <p>Add Recipe</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button className="rounded-full h-12 w-12 shadow-lg bg-indigo-500 hover:bg-indigo-600" onClick={() => navigate('/analytics')}>
                  <BarChart3 className="h-6 w-6" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left">
                <p>View Analytics</p>
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
