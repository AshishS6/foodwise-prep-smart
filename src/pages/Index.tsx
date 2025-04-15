
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { 
  BarChart3, 
  ChefHat, 
  ScrollText, 
  ShoppingCart, 
  Package, 
  ArrowRight, 
  AlertTriangle, 
  Calendar, 
  Clock,
  PlusCircle,
  UserPlus
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { toZonedTime } from "date-fns-tz"; // Updated from utcToZonedTime
import { useAuthStore } from "@/stores/authStore";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";

const Index = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, userRole, userName, session } = useAuthStore();
  const timeZone = "Asia/Kolkata";

  const { data: todaySales, isLoading: salesLoading, dataUpdatedAt: salesUpdatedAt } = useQuery({
    queryKey: ['todaySales'],
    queryFn: async () => {
      try {
        const today = toZonedTime(new Date(), timeZone); // Updated from utcToZonedTime
        today.setHours(0, 0, 0, 0);
        
        const { data, error } = await supabase
          .from('orders')
          .select('*')
          .gte('timestamp', today.toISOString());
        
        if (error) throw error;
        
        return {
          orders: data || [],
          totalRevenue: data?.reduce((sum, order) => sum + (order.total || 0), 0) || 0
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
          .eq('date', tomorrowDateStr);
        
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
      <header className="flex justify-between items-center py-8 px-6 bg-white/50 backdrop-blur-sm border-b">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
            Payasakkada Prep Smart
          </h1>
          <p className="text-muted-foreground mt-1">Smart restaurant management system</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm text-muted-foreground">
            👤 {userName || "User"} | {userRole || "Guest"}
          </div>
          {userRole === 'Admin' ? (
            <Button 
              variant="outline" 
              className="flex gap-2 hover:bg-primary/5" 
              onClick={() => navigate('/team-management')}
            >
              <UserPlus className="h-5 w-5 text-primary" />
              Team Management
            </Button>
          ) : null}
        </div>
      </header>

      <div className="container mx-auto p-6 space-y-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-semibold">Dashboard Overview</h1>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card 
            className="rounded-2xl shadow-md hover:shadow-xl transition-all duration-200 cursor-pointer bg-white/70 backdrop-blur-sm border-muted/20 hover:border-primary/20 overflow-hidden"
            onClick={() => navigate('/order-history')}
          >
            <CardHeader className="pb-2 flex flex-row items-center justify-between bg-blue-50/50">
              <CardTitle className="text-lg font-medium text-blue-700">Today's Sales</CardTitle>
              <ArrowRight className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent className="pt-4">
              {salesLoading ? (
                <p>Loading...</p>
              ) : (
                <>
                  <p className="text-3xl font-bold">₹{todaySales?.totalRevenue?.toFixed(2) || "0.00"}</p>
                  <p className="text-sm text-muted-foreground">{todaySales?.orders?.length || 0} orders today</p>
                  <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>Last updated {salesUpdatedAt ? getTimeAgo(salesUpdatedAt) : "never"}</span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card 
            className="rounded-2xl shadow-md hover:shadow-xl transition-all duration-200 cursor-pointer bg-white/70 backdrop-blur-sm border-muted/20 hover:border-primary/20 overflow-hidden"
            onClick={() => navigate('/inventory')}
          >
            <CardHeader className="pb-2 flex flex-row items-center justify-between bg-orange-50/50">
              <CardTitle className="text-lg font-medium text-orange-700">Low Stock Alert</CardTitle>
              <AlertTriangle className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent className="pt-4">
              {ingredientsLoading ? (
                <p>Loading...</p>
              ) : (
                <div>
                  <p className="text-3xl font-bold text-orange-500">{Array.isArray(lowStockIngredients) ? lowStockIngredients.length : 0}</p>
                  <p className="text-sm text-muted-foreground">ingredients need restocking</p>
                  <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>Last updated {ingredientsUpdatedAt ? getTimeAgo(ingredientsUpdatedAt) : "never"}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card 
            className="rounded-2xl shadow-md hover:shadow-xl transition-all duration-200 cursor-pointer bg-white/70 backdrop-blur-sm border-muted/20 hover:border-primary/20 overflow-hidden"
            onClick={() => navigate('/prep-plans')}
          >
            <CardHeader className="pb-2 flex flex-row items-center justify-between bg-purple-50/50">
              <CardTitle className="text-lg font-medium text-purple-700">Tomorrow's Prep</CardTitle>
              <Calendar className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent className="pt-4">
              {prepLoading ? (
                <p>Loading...</p>
              ) : prepPlan && prepPlan.length === 0 ? (
                <div className="space-y-2">
                  <p>No prep plan for tomorrow yet</p>
                  <Button size="sm" onClick={() => navigate('/prep-plans')} className="flex items-center">
                    <PlusCircle className="h-4 w-4 mr-1" />
                    Plan Now
                  </Button>
                </div>
              ) : (
                <div>
                  <p className="text-3xl font-bold text-purple-700">{Array.isArray(prepPlan) ? prepPlan.length : 0}</p>
                  <p className="text-sm text-muted-foreground">items in tomorrow's prep plan</p>
                  <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>Last updated {prepUpdatedAt ? getTimeAgo(prepUpdatedAt) : "never"}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
          {modules.filter(m => m.title !== "Analytics & Reports").map((module) => (
            <Button
              key={module.title}
              variant="outline"
              className={`h-auto p-6 flex flex-col items-center justify-center gap-3 text-center rounded-2xl transition-all duration-200 hover:shadow-lg bg-white/70 backdrop-blur-sm border-muted/20 hover:border-primary/20 ${module.bgColor}`}
              onClick={() => navigate(module.path)}
            >
              {module.icon}
              <div>
                <h3 className="font-semibold text-lg">{module.title}</h3>
                <p className="text-sm text-muted-foreground">{module.description}</p>
              </div>
            </Button>
          ))}
        </div>

        <Card 
          className="rounded-2xl shadow-lg overflow-hidden mt-8 hover:shadow-xl transition-all duration-200 bg-white/70 backdrop-blur-sm border-muted/20 hover:border-primary/20 cursor-pointer"
          onClick={() => navigate('/analytics')}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2 bg-indigo-50/50">
            <div>
              <CardTitle className="text-xl font-semibold text-indigo-700">Analytics & Reports</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Comprehensive insights into your restaurant's performance
              </p>
            </div>
            <BarChart3 className="h-8 w-8 text-indigo-500" />
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4 p-6">
            <div className="flex flex-col items-center p-4 bg-indigo-50 rounded-lg">
              <h4 className="font-medium text-indigo-700">Sales Analytics</h4>
              <p className="text-sm text-muted-foreground text-center mt-1">Track revenue and order trends</p>
            </div>
            <div className="flex flex-col items-center p-4 bg-indigo-50 rounded-lg">
              <h4 className="font-medium text-indigo-700">Inventory Reports</h4>
              <p className="text-sm text-muted-foreground text-center mt-1">Monitor stock levels and usage</p>
            </div>
            <div className="flex flex-col items-center p-4 bg-indigo-50 rounded-lg">
              <h4 className="font-medium text-indigo-700">Performance Metrics</h4>
              <p className="text-sm text-muted-foreground text-center mt-1">Analyze kitchen efficiency</p>
            </div>
          </CardContent>
        </Card>

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
      </div>
    </div>
  );
};

export default Index;
