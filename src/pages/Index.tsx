
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { BarChart3, ChefHat, ScrollText, ShoppingCart, Package, ArrowRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

const Index = () => {
  const navigate = useNavigate();

  // Fetch today's sales data
  const { data: todaySales, isLoading: salesLoading } = useQuery({
    queryKey: ['todaySales'],
    queryFn: async () => {
      // Get today's date at 00:00:00
      const today = new Date();
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
  const { data: lowStockIngredients, isLoading: ingredientsLoading } = useQuery({
    queryKey: ['lowStockIngredients'],
    queryFn: async () => {
      // Threshold could be configured per ingredient in a real system
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
  const { data: prepPlan, isLoading: prepLoading } = useQuery({
    queryKey: ['tomorrowPrepPlan'],
    queryFn: async () => {
      // Get tomorrow's date
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      
      const tomorrowDateStr = tomorrow.toISOString().split('T')[0];
      
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

  // Navigation tiles for main modules
  const modules = [
    {
      title: "POS / Sales Entry",
      icon: <ShoppingCart className="h-8 w-8 text-primary" />,
      description: "Create new orders and process sales",
      path: "/pos"
    },
    {
      title: "Inventory Management",
      icon: <Package className="h-8 w-8 text-primary" />,
      description: "Manage ingredients and stock levels",
      path: "/inventory"
    },
    {
      title: "Recipe Management",
      icon: <ScrollText className="h-8 w-8 text-primary" />,
      description: "Define dishes and required ingredients",
      path: "/recipes"
    },
    {
      title: "Prep Planning",
      icon: <ChefHat className="h-8 w-8 text-primary" />,
      description: "View and update daily preparation plans",
      path: "/prep-plans"
    }
  ];

  return (
    <div className="container mx-auto p-4 space-y-6">
      <header className="flex justify-between items-center py-6">
        <div>
          <h1 className="text-3xl font-bold">FoodWise Prep Smart</h1>
          <p className="text-muted-foreground">Smart kitchen management system</p>
        </div>
        <BarChart3 className="h-10 w-10 text-primary" />
      </header>

      {/* Dashboard Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card 
          className="cursor-pointer hover:bg-muted/50 transition-colors"
          onClick={() => navigate('/order-history')}
        >
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-medium">Today's Sales</CardTitle>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {salesLoading ? (
              <p>Loading...</p>
            ) : (
              <>
                <p className="text-3xl font-bold">₹{todaySales?.totalRevenue.toFixed(2)}</p>
                <p className="text-sm text-muted-foreground">{todaySales?.orders.length || 0} orders today</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium">Low Stock Alert</CardTitle>
          </CardHeader>
          <CardContent>
            {ingredientsLoading ? (
              <p>Loading...</p>
            ) : lowStockIngredients?.length === 0 ? (
              <p>All ingredients are well stocked</p>
            ) : (
              <div>
                <p className="text-3xl font-bold text-amber-500">{lowStockIngredients?.length}</p>
                <p className="text-sm text-muted-foreground">ingredients need restocking</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium">Tomorrow's Prep</CardTitle>
          </CardHeader>
          <CardContent>
            {prepLoading ? (
              <p>Loading...</p>
            ) : prepPlan?.length === 0 ? (
              <p>No prep plan for tomorrow yet</p>
            ) : (
              <div>
                <p className="text-3xl font-bold">{prepPlan?.length}</p>
                <p className="text-sm text-muted-foreground">items in tomorrow's prep plan</p>
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
            className="h-auto p-6 flex flex-col items-center justify-center gap-3 text-center hover:bg-muted"
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
    </div>
  );
};

export default Index;
