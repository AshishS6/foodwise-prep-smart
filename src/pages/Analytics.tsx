
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, FileText, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuthStore } from "@/stores/authStore";
import { format, subDays } from "date-fns";
import * as ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { StatsCard } from "@/components/analytics/StatsCard";
import { PopularItemsChart } from "@/components/analytics/PopularItemsChart";
import { SalesTrendChart } from "@/components/analytics/SalesTrendChart";
import { ItemSalesAnalysis } from "@/components/analytics/ItemSalesAnalysis";
import { LowStockTable } from "@/components/analytics/LowStockTable";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A259FF', '#FF6B6B'];

export default function Analytics() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { session, userRole } = useAuthStore();
  const [timeRange, setTimeRange] = useState("week");
  
  useEffect(() => {
    if (!session) {
      navigate('/auth');
      return;
    }
    
    if (userRole !== 'Admin' && userRole !== 'Manager') {
      navigate('/');
      toast({
        title: "Access restricted",
        description: "You need admin privileges to access this page.",
        variant: "destructive"
      });
      return;
    }
    
    console.log("Analytics page - Session:", session?.user?.email);
    console.log("Analytics page - User role:", userRole);
  }, [session, userRole, navigate, toast]);

  const { data: orders, isLoading: ordersLoading, error: ordersError } = useQuery({
    queryKey: ['orders', timeRange],
    queryFn: async () => {
      const startDate = getStartDateForRange(timeRange);
      console.log("Fetching orders from:", startDate.toISOString());
      
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .gte('timestamp', startDate.toISOString())
        .order('timestamp', { ascending: false });
      
      if (error) {
        console.error("Error fetching orders:", error);
        toast({
          title: "Error loading orders",
          description: error.message,
          variant: "destructive"
        });
        return [];
      }
      
      console.log("Orders fetched:", data?.length || 0);
      return data || [];
    },
    refetchOnWindowFocus: false,
  });

  const { data: menuItems, isLoading: menuItemsLoading } = useQuery({
    queryKey: ['menuItems'],
    queryFn: async () => {
      console.log("Fetching menu items");
      const { data, error } = await supabase
        .from('menuitems')
        .select('*');
      
      if (error) {
        console.error("Error fetching menu items:", error);
        toast({
          title: "Error loading menu items",
          description: error.message,
          variant: "destructive"
        });
        return [];
      }
      
      console.log("Menu items fetched:", data?.length || 0);
      return data || [];
    },
    refetchOnWindowFocus: false,
  });

  const { data: lowStockItems, isLoading: lowStockLoading } = useQuery({
    queryKey: ['lowStockItems'],
    queryFn: async () => {
      console.log("Fetching low stock items");
      const { data, error } = await supabase
        .from('ingredients')
        .select('*')
        .lt('stock', 10)
        .order('stock');
      
      if (error) {
        console.error("Error fetching ingredients:", error);
        toast({
          title: "Error loading inventory",
          description: error.message,
          variant: "destructive"
        });
        return [];
      }
      
      console.log("Low stock items fetched:", data?.length || 0);
      return data || [];
    },
    refetchOnWindowFocus: false,
  });

  const totalRevenue = orders?.reduce((sum, order) => sum + (typeof order.total === 'number' ? order.total : 0), 0) || 0;
  const averageOrderValue = orders?.length ? totalRevenue / orders.length : 0;
  const totalOrders = orders?.length || 0;
  
  const popularItems = calculatePopularItems(orders);
  const salesByDay = calculateSalesByDay(orders, timeRange);
  const itemSales = calculateItemSales(orders);

  function getStartDateForRange(range: string): Date {
    const today = new Date();
    switch (range) {
      case "day":
        return new Date(today.setHours(0, 0, 0, 0));
      case "week":
        return subDays(today, 7);
      case "month":
        return subDays(today, 30);
      default:
        return subDays(today, 7);
    }
  }

  function calculatePopularItems(orderData: any[] | undefined) {
    if (!orderData?.length) return [];
    
    const itemCounts: Record<string, { name: string, count: number }> = {};
    
    orderData.forEach(order => {
      const items = order.items;
      if (Array.isArray(items)) {
        items.forEach(item => {
          if (typeof item === 'object' && item !== null && 'name' in item && 'quantity' in item) {
            const name = String(item.name);
            const quantity = Number(item.quantity);
            
            if (!itemCounts[name]) {
              itemCounts[name] = {
                name,
                count: 0
              };
            }
            itemCounts[name].count += quantity;
          }
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

  function calculateSalesByDay(orderData: any[] | undefined, range: string) {
    if (!orderData?.length) return [];
    
    const salesMap: Record<string, number> = {};
    
    const numDays = range === 'day' ? 1 : range === 'week' ? 7 : 30;
    for (let i = 0; i < numDays; i++) {
      const date = subDays(new Date(), i);
      const dateStr = format(date, 'yyyy-MM-dd');
      salesMap[dateStr] = 0;
    }
    
    orderData.forEach(order => {
      if (order.timestamp) {
        const orderDate = format(new Date(order.timestamp), 'yyyy-MM-dd');
        if (salesMap[orderDate] !== undefined) {
          salesMap[orderDate] += order.total || 0;
        }
      }
    });
    
    return Object.entries(salesMap)
      .map(([date, amount]) => ({
        date: format(new Date(date), 'MMM dd'),
        amount: amount
      }))
      .reverse();
  }

  function calculateItemSales(orderData: any[] | undefined) {
    if (!orderData?.length || !menuItems?.length) return [];

    const salesByItem: Record<number, { id: number, name: string, count: number, revenue: number }> = {};
    menuItems.forEach(item => {
      salesByItem[item.id] = {
        id: item.id,
        name: item.name,
        count: 0,
        revenue: 0
      };
    });
    
    orderData.forEach(order => {
      const items = order.items;
      if (Array.isArray(items)) {
        items.forEach(item => {
          if (typeof item === 'object' && item !== null && 'menuItemId' in item && 'price' in item && 'quantity' in item) {
            const id = Number(item.menuItemId);
            const price = Number(item.price);
            const quantity = Number(item.quantity);
            
            if (salesByItem[id]) {
              salesByItem[id].count += quantity;
              salesByItem[id].revenue += price * quantity;
            }
          }
        });
      }
    });
    
    return Object.values(salesByItem)
      .filter(item => item.count > 0)
      .sort((a, b) => b.count - a.count);
  }

  // Implement exportToExcel function
  const exportToExcel = async () => {
    if (!orders || orders.length === 0) {
      toast({
        title: "Export Failed",
        description: "No data to export",
        variant: "destructive"
      });
      return;
    }
    
    try {
      // Create a new workbook
      const workbook = new ExcelJS.Workbook();
      
      // Add Orders Sheet
      const ordersSheet = workbook.addWorksheet('Sales Data');
      ordersSheet.columns = [
        { header: 'Order ID', key: 'id', width: 15 },
        { header: 'Date', key: 'date', width: 20 },
        { header: 'Total', key: 'total', width: 15 },
        { header: 'Items', key: 'itemCount', width: 10 },
        { header: 'Customer', key: 'customer', width: 20 }
      ];
      
      orders.forEach(order => {
        ordersSheet.addRow({
          id: order.id,
          date: order.timestamp ? format(new Date(order.timestamp), 'yyyy-MM-dd hh:mm a') : 'Unknown',
          total: `₹${Number(order.total).toFixed(2)}`,
          itemCount: Array.isArray(order.items) ? order.items.length : 0,
          customer: order.customerName || 'Walk-in'
        });
      });
      
      // Add Summary Sheet
      const summarySheet = workbook.addWorksheet('Summary');
      summarySheet.columns = [
        { header: 'Metric', key: 'metric', width: 25 },
        { header: 'Value', key: 'value', width: 15 }
      ];
      
      summarySheet.addRow({ 
        metric: 'Time Period', 
        value: timeRange === 'day' ? 'Today' : 
               timeRange === 'week' ? 'Last 7 days' : 'Last 30 days' 
      });
      summarySheet.addRow({ metric: 'Total Orders', value: totalOrders });
      summarySheet.addRow({ metric: 'Total Revenue', value: `₹${totalRevenue.toFixed(2)}` });
      summarySheet.addRow({ metric: 'Average Order Value', value: `₹${averageOrderValue.toFixed(2)}` });
      
      // Add Popular Items Sheet
      if (popularItems.length > 0) {
        const itemsSheet = workbook.addWorksheet('Popular Items');
        itemsSheet.columns = [
          { header: 'Item Name', key: 'name', width: 25 },
          { header: 'Quantity Sold', key: 'value', width: 15 }
        ];
        
        popularItems.forEach(item => {
          itemsSheet.addRow(item);
        });
      }
      
      // Generate Excel file and save it
      const buffer = await workbook.xlsx.writeBuffer();
      const fileName = `sales-report-${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
      
      saveAs(new Blob([buffer]), fileName);
      
      toast({
        title: "Export Successful",
        description: `Sales data exported to ${fileName}`,
      });
    } catch (error) {
      console.error("Export to Excel failed:", error);
      toast({
        title: "Export Failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive"
      });
    }
  };

  // Implement exportToPDF function
  const exportToPDF = () => {
    toast({
      title: "PDF Export",
      description: "PDF export is not implemented yet. Please use Excel export.",
    });
  };

  const isLoading = ordersLoading || menuItemsLoading || lowStockLoading;

  if (ordersError) {
    console.error("Orders fetch error:", ordersError);
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
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
        
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={exportToExcel}
            disabled={isLoading || !orders || orders.length === 0}
          >
            <FileSpreadsheet className="h-4 w-4 mr-1" />
            Export Excel
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={exportToPDF}
            disabled={isLoading || !orders || orders.length === 0}
          >
            <FileText className="h-4 w-4 mr-1" />
            Export PDF
          </Button>
        </div>
      </div>
      
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
        <div className="flex justify-center p-8">
          <p>Loading analytics data...</p>
        </div>
      ) : orders && orders.length === 0 ? (
        <div className="text-center py-10">
          <h2 className="text-xl font-semibold mb-3">No Orders Found</h2>
          <p className="text-muted-foreground mb-6">
            There are no orders for the selected time period.
          </p>
          <Button onClick={() => navigate('/pos')}>Create New Order</Button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <StatsCard
              title="Total Revenue"
              value={`₹${totalRevenue.toFixed(2)}`}
              subtitle={timeRange === 'day' ? 'Today' : 
                       timeRange === 'week' ? 'Last 7 days' : 'Last 30 days'}
            />
            <StatsCard
              title="Average Order Value"
              value={`₹${averageOrderValue.toFixed(2)}`}
              subtitle={`${totalOrders} orders`}
            />
            <StatsCard
              title="Total Orders"
              value={String(totalOrders)}
              subtitle={timeRange === 'day' ? 'Today' : 
                       timeRange === 'week' ? 'Last 7 days' : 'Last 30 days'}
            />
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <PopularItemsChart items={popularItems} />
            <SalesTrendChart data={salesByDay} />
          </div>
          
          <div className="grid grid-cols-1 gap-6 mb-6">
            <ItemSalesAnalysis sales={itemSales} />
          </div>
          
          <div className="grid grid-cols-1 gap-6">
            <LowStockTable items={lowStockItems || []} />
          </div>
        </>
      )}
    </div>
  );
}
