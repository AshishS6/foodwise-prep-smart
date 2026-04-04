import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, FileSpreadsheet, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuthStore } from "@/stores/authStore";
import { format, subDays } from "date-fns";
import * as ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { ItemSalesAnalysis } from "@/components/analytics/ItemSalesAnalysis";
import { LowStockTable } from "@/components/analytics/LowStockTable";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TrendingUp, Calendar } from "lucide-react";
import { useDeviceDetection } from "@/hooks/useDeviceDetection";
import { MobileHeader } from "@/components/layout/MobileHeader";
import { MobileContainer } from "@/components/layout/MobileContainer";
import { Header } from "@/components/layout/Header";

export default function Analytics() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { session, userRole } = useAuthStore();
  const { isMobile } = useDeviceDetection();
  const [timeRange, setTimeRange] = useState("week");
  const [itemSalesExpanded, setItemSalesExpanded] = useState(true);
  const [lowStockExpanded, setLowStockExpanded] = useState(false);
  const [popularItemsExpanded, setPopularItemsExpanded] = useState(true);
  const [salesTrendExpanded, setSalesTrendExpanded] = useState(true);
  
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
    
  }, [session, userRole, navigate, toast]);

  const { data: orders, isLoading: ordersLoading, error: ordersError } = useQuery({
    queryKey: ['orders', timeRange],
    queryFn: async () => {
      const startDate = getStartDateForRange(timeRange);
      
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
      const workbook = new ExcelJS.Workbook();
      
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
          customer: 'Walk-in'
        });
      });
      
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


  const isLoading = ordersLoading || menuItemsLoading || lowStockLoading;

  if (ordersError) {
    console.error("Orders fetch error:", ordersError);
  }

  return (
    <div className="min-h-screen bg-background">
      {isMobile ? (
        <MobileHeader 
          title="Sales Analytics" 
          actions={
            <Button 
              variant="ghost" 
              size="icon"
              onClick={exportToExcel}
              disabled={isLoading || !orders || orders.length === 0}
              className="bg-blue-50 hover:bg-blue-100"
            >
              <FileSpreadsheet className="h-5 w-5" />
            </Button>
          }
        />
      ) : (
        <Header />
      )}

      <MobileContainer className="md:container md:mx-auto md:p-4 md:p-6">
        {!isMobile && (
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
            
            <Button 
              variant="outline" 
              size="sm" 
              onClick={exportToExcel}
              disabled={isLoading || !orders || orders.length === 0}
              className="bg-blue-50 hover:bg-blue-100 border-blue-200"
            >
              <FileSpreadsheet className="h-4 w-4 mr-1" />
              Export
            </Button>
          </div>
        )}
      
      {/* Time Range Tabs - More Visual */}
      <div className="mb-6">
        <Tabs defaultValue="week" value={timeRange} onValueChange={setTimeRange}>
          <TabsList className="bg-muted">
            <TabsTrigger value="day" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">
              Today
            </TabsTrigger>
            <TabsTrigger value="week" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">
              Last 7 Days
            </TabsTrigger>
            <TabsTrigger value="month" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">
              Last 30 Days
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center p-8">
          <p className="text-muted-foreground">Loading analytics data...</p>
        </div>
      ) : orders && orders.length === 0 ? (
        <div className="text-center py-10">
          <h2 className="text-xl font-semibold mb-3">No Orders Found</h2>
          <p className="text-muted-foreground mb-6">
            There are no orders for the selected time period.
          </p>
          <Button onClick={() => navigate('/pos')} className="bg-blue-500 hover:bg-blue-600">
            Create New Order
          </Button>
        </div>
      ) : (
        <>
          {/* Key Metrics - Color Coded */}
          <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-3'} gap-4 mb-6`}>
            <Card className="border-2 border-blue-200 bg-blue-50/30">
              <CardContent className="p-6">
                <p className="text-sm font-medium text-blue-700 mb-1">Total Revenue</p>
                <p className="text-3xl font-bold text-blue-600">₹{totalRevenue.toFixed(2)}</p>
                <p className="text-xs text-muted-foreground mt-2">
                  {timeRange === 'day' ? 'Today' : 
                   timeRange === 'week' ? 'Last 7 days' : 'Last 30 days'}
                </p>
              </CardContent>
            </Card>
            <Card className="border-2 border-green-200 bg-green-50/30">
              <CardContent className="p-6">
                <p className="text-sm font-medium text-green-700 mb-1">Average Order</p>
                <p className="text-3xl font-bold text-green-600">₹{averageOrderValue.toFixed(2)}</p>
                <p className="text-xs text-muted-foreground mt-2">{totalOrders} orders</p>
              </CardContent>
            </Card>
            <Card className="border-2 border-purple-200 bg-purple-50/30">
              <CardContent className="p-6">
                <p className="text-sm font-medium text-purple-700 mb-1">Total Orders</p>
                <p className="text-3xl font-bold text-purple-600">{totalOrders}</p>
                <p className="text-xs text-muted-foreground mt-2">
                  {timeRange === 'day' ? 'Today' : 
                   timeRange === 'week' ? 'Last 7 days' : 'Last 30 days'}
                </p>
              </CardContent>
            </Card>
          </div>
          
          {/* Popular Items - Table View */}
          {popularItems.length > 0 && (
            <Card className="mb-6 border-2">
              <CardHeader 
                className="cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => setPopularItemsExpanded(!popularItemsExpanded)}
              >
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-blue-600" />
                    Most Popular Items
                  </CardTitle>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    {popularItemsExpanded ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </CardHeader>
              {popularItemsExpanded && (
                <CardContent>
                  <div className="border rounded-md overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/30">
                          <TableHead className={`${isMobile ? 'w-12' : 'w-16'}`}>Rank</TableHead>
                          <TableHead>Item Name</TableHead>
                          <TableHead className={`text-right ${isMobile ? 'text-xs' : ''}`}>Qty Sold</TableHead>
                          <TableHead className={`text-right ${isMobile ? 'text-xs' : ''}`}>%</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {popularItems.map((item, index) => {
                          const totalSold = popularItems.reduce((sum, i) => sum + i.value, 0);
                          const percentage = totalSold > 0 ? ((item.value / totalSold) * 100).toFixed(1) : '0';
                          return (
                            <TableRow key={index} className="hover:bg-blue-50/50">
                              <TableCell className={`font-bold text-blue-600 ${isMobile ? 'text-xs' : ''}`}>
                                #{index + 1}
                              </TableCell>
                              <TableCell className={`font-medium ${isMobile ? 'text-sm' : ''}`}>{item.name}</TableCell>
                              <TableCell className={`text-right font-semibold ${isMobile ? 'text-xs' : ''}`}>{item.value}</TableCell>
                              <TableCell className={`text-right ${isMobile ? 'text-xs' : ''}`}>
                                <span className="text-muted-foreground">{percentage}%</span>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              )}
            </Card>
          )}

          {/* Sales Trend - Table View */}
          {salesByDay.length > 0 && (
            <Card className="mb-6 border-2">
              <CardHeader 
                className="cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => setSalesTrendExpanded(!salesTrendExpanded)}
              >
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-green-600" />
                    Sales by Day
                  </CardTitle>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    {salesTrendExpanded ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </CardHeader>
              {salesTrendExpanded && (
                <CardContent>
                  <div className="border rounded-md overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/30">
                          <TableHead>Date</TableHead>
                          <TableHead className={`text-right ${isMobile ? 'text-xs' : ''}`}>Sales</TableHead>
                          <TableHead className={`text-right ${isMobile ? 'text-xs' : ''}`}>Change</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {salesByDay.map((day, index) => {
                          const prevDay = salesByDay[index + 1];
                          const change = prevDay 
                            ? day.amount - prevDay.amount 
                            : 0;
                          const changePercent = prevDay && prevDay.amount > 0
                            ? ((change / prevDay.amount) * 100).toFixed(1)
                            : '0';
                          return (
                            <TableRow key={index} className="hover:bg-green-50/50">
                              <TableCell className={`font-medium ${isMobile ? 'text-sm' : ''}`}>{day.date}</TableCell>
                              <TableCell className={`text-right font-semibold text-green-700 ${isMobile ? 'text-xs' : ''}`}>
                                ₹{day.amount.toFixed(2)}
                              </TableCell>
                              <TableCell className={`text-right ${isMobile ? 'text-xs' : ''}`}>
                                {change !== 0 && (
                                  <span className={`${isMobile ? 'text-xs' : 'text-sm'} ${change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {change > 0 ? '+' : ''}{changePercent}%
                                  </span>
                                )}
                                {change === 0 && (
                                  <span className={`${isMobile ? 'text-xs' : 'text-sm'} text-muted-foreground`}>-</span>
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              )}
            </Card>
          )}
          
          {/* Item Sales Analysis - Collapsible */}
          <Card className="mb-6 border-2">
            <CardHeader 
              className="cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => setItemSalesExpanded(!itemSalesExpanded)}
            >
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold">Item Sales Analysis</CardTitle>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  {itemSalesExpanded ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </CardHeader>
            {itemSalesExpanded && (
              <CardContent>
                <ItemSalesAnalysis sales={itemSales} />
              </CardContent>
            )}
          </Card>
          
          {/* Low Stock - Collapsible */}
          {lowStockItems && lowStockItems.length > 0 && (
            <Card className="border-2 border-orange-200">
              <CardHeader 
                className="cursor-pointer hover:bg-orange-50/50 transition-colors bg-orange-50/30"
                onClick={() => setLowStockExpanded(!lowStockExpanded)}
              >
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-semibold text-orange-700">
                    Low Stock Items ({lowStockItems.length})
                  </CardTitle>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    {lowStockExpanded ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </CardHeader>
              {lowStockExpanded && (
                <CardContent>
                  <LowStockTable items={lowStockItems} />
                </CardContent>
              )}
            </Card>
          )}
        </>
      )}
      </MobileContainer>
    </div>
  );
}
