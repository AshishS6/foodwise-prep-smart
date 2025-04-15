
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
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
  PlusCircle
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { useAuthStore } from "@/stores/authStore";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const Index = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, userRole } = useAuthStore();
  const timeZone = "Asia/Kolkata";

  // Fetch today's sales data
  const { data: todaySales, isLoading: salesLoading, dataUpdatedAt: salesUpdatedAt } = useQuery({
    queryKey: ['todaySales'],
    queryFn: async () => {
      const today = toZonedTime(new Date(), timeZone);
      today.setHours(0, 0, 0, 0);
      
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .gte('timestamp', today.toISOString());
      
      if (error) {
        toast({
          title: "Error fetching sales data",
          description: error.message,
          variant: "destructive"
        });
        return { orders: [], totalRevenue: 0 };
      }
      
      return {
        orders: data || [],
        totalRevenue: data?.reduce((sum, order) => sum + order.total, 0) || 0
      };
    }
  });

  // Fetch low stock ingredients
  const { data: lowStockIngredients, isLoading: ingredientsLoading, dataUpdatedAt: ingredientsUpdatedAt } = useQuery({
    queryKey: ['lowStockIngredients'],
    queryFn: async () => {
      const THRESHOLD = 10; 
      
      const { data, error } = await supabase
        .from('ingredients')
        .select('*')
        .lt('stock', THRESHOLD);
      
      if (error) {
        toast({
          title: "Error fetching inventory data",
          description: error.message,
          variant: "destructive"
        });
        return [];
      }
      
      return data || [];
    }
  });

  // Fetch tomorrow's prep plan
  const { data: prepPlan, isLoading: prepLoading, dataUpdatedAt: prepUpdatedAt } = useQuery({
    queryKey: ['tomorrowPrepPlan'],
    queryFn: async () => {
      const tomorrow = toZonedTime(new Date(), timeZone);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      
      const tomorrowDateStr = format(tomorrow, 'yyyy-MM-dd');
      
      const { data, error } = await supabase
        .from('prepplans')
        .select('*')
        .eq('date', tomorrowDateStr);
      
      if (error) {
        toast({
          title: "Error fetching prep plan",
          description: error.message,
          variant: "destructive"
        });
        return [];
      }
      
      return data || [];
    }
  });

  // Format time since update
  const getTimeAgo = (timestamp: number) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    
    if (seconds < 60) return `${seconds} seconds ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    return `${Math.floor(seconds / 86400)} days ago`;
  };

  // Navigation tiles for main modules with color coding
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
    }
  ];

  return (
    <div className="container mx-auto p-4 space-y-6">
      <header className="flex justify-between items-center py-6">
        <div>
          <h1 className="text-3xl font-bold">FoodWise Prep Smart</h1>
          <p className="text-muted-foreground">Smart kitchen management system</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm text-muted-foreground">
            👤 {user?.email || "User"} | {userRole || "Guest"}
          </div>
          <Button variant="outline" className="flex gap-2" onClick={() => navigate('/analytics')}>
            <BarChart3 className="h-5 w-5 text-primary" />
            Analytics
          </Button>
        </div>
      </header>

      {/* Dashboard Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card 
          className="cursor-pointer hover:bg-blue-50 transition-colors"
          onClick={() => navigate('/order-history')}
        >
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-medium text-blue-700">Today's Sales</CardTitle>
            <ArrowRight className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
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
          className="cursor-pointer hover:bg-orange-50 transition-colors"
          onClick={() => navigate('/inventory')}
        >
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-medium text-orange-700">Low Stock Alert</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
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
          className="cursor-pointer hover:bg-purple-50 transition-colors"
          onClick={() => navigate('/prep-plans')}
        >
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-medium text-purple-700">Tomorrow's Prep</CardTitle>
            <Calendar className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
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

      {/* Main Navigation */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {modules.map((module) => (
          <Button
            key={module.title}
            variant="outline"
            className={`h-auto p-6 flex flex-col items-center justify-center gap-3 text-center ${module.bgColor}`}
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

      {/* Quick Action Buttons - Only shown on home page */}
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
      </div>
    </div>
  );
};

export default Index;
