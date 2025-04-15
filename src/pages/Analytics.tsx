
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Download, FileText, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, BarChart, Bar } from "recharts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TooltipProvider, Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuthStore } from "@/stores/authStore";
import { format, subDays } from "date-fns";
import * as ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A259FF', '#FF6B6B'];

const Analytics = () => {
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
    
    // Add console log to debug
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

    // Initialize counters for all menu items
    const salesByItem: Record<number, { id: number, name: string, count: number, revenue: number }> = {};
    menuItems.forEach(item => {
      salesByItem[item.id] = {
        id: item.id,
        name: item.name,
        count: 0,
        revenue: 0
      };
    });
    
    // Count occurrences of each item
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
    
    // Convert to array and sort by count
    return Object.values(salesByItem)
      .filter(item => item.count > 0)
      .sort((a, b) => b.count - a.count);
  }

  const itemSales = calculateItemSales(orders);

  const exportToExcel = async () => {
    if (!orders || orders.length === 0) {
      toast({
        title: "No data to export",
        variant: "destructive"
      });
      return;
    }

    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Sales Report');
      
      worksheet.mergeCells('A1:D1');
      const titleCell = worksheet.getCell('A1');
      titleCell.value = `Payasakkada Sales Report - ${format(new Date(), 'yyyy-MM-dd')}`;
      titleCell.font = { size: 14, bold: true };
      titleCell.alignment = { horizontal: 'center' };
      
      worksheet.addRow(['']);
      worksheet.addRow(['Summary']);
      worksheet.addRow(['Total Revenue', `₹${totalRevenue.toFixed(2)}`]);
      worksheet.addRow(['Total Orders', totalOrders]);
      worksheet.addRow(['Average Order Value', `₹${averageOrderValue.toFixed(2)}`]);
      worksheet.addRow(['']);
      
      worksheet.addRow(['Popular Items']);
      worksheet.addRow(['Item', 'Count']);
      popularItems.forEach(item => {
        worksheet.addRow([item.name, item.value]);
      });
      worksheet.addRow(['']);
      
      worksheet.addRow(['Daily Sales']);
      worksheet.addRow(['Date', 'Amount']);
      salesByDay.forEach(day => {
        worksheet.addRow([day.date, day.amount]);
      });
      worksheet.addRow(['']);
      
      worksheet.addRow(['Orders']);
      worksheet.addRow(['Order ID', 'Date', 'Items', 'Total']);
      orders.forEach(order => {
        const itemsText = Array.isArray(order.items) 
          ? order.items.map((item: any) => {
              if (typeof item === 'object' && item !== null && 'name' in item && 'quantity' in item) {
                return `${item.quantity}x ${item.name}`;
              }
              return '';
            }).filter(Boolean).join(', ')
          : '';
        worksheet.addRow([
          order.id,
          order.timestamp ? format(new Date(order.timestamp), 'yyyy-MM-dd HH:mm') : 'N/A',
          itemsText,
          `₹${(order.total || 0).toFixed(2)}`
        ]);
      });
      
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(blob, `payasakkada-sales-report-${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
      
      toast({
        title: "Report exported successfully",
      });
    } catch (error) {
      console.error("Excel export error:", error);
      toast({
        title: "Error exporting report",
        description: "An error occurred while generating the Excel file.",
        variant: "destructive"
      });
    }
  };

  const exportToPDF = () => {
    toast({
      title: "PDF export",
      description: "PDF export functionality will be implemented soon.",
    });
  };

  const isLoading = ordersLoading || menuItemsLoading || lowStockLoading;

  // If there's an error fetching orders, display it
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
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Revenue
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">₹{totalRevenue.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {timeRange === 'day' ? 'Today' : 
                   timeRange === 'week' ? 'Last 7 days' : 'Last 30 days'}
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Average Order Value
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">₹{averageOrderValue.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground mt-1">{totalOrders} orders</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Orders
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalOrders}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {timeRange === 'day' ? 'Today' : 
                   timeRange === 'week' ? 'Last 7 days' : 'Last 30 days'}
                </p>
              </CardContent>
            </Card>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <Card>
              <CardHeader>
                <CardTitle>Most Popular Items</CardTitle>
              </CardHeader>
              <CardContent>
                {popularItems.length === 0 ? (
                  <p className="text-center py-8 text-muted-foreground">No data available</p>
                ) : (
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={popularItems}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                        >
                          {popularItems.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Sales Trend</CardTitle>
              </CardHeader>
              <CardContent>
                {salesByDay.length === 0 ? (
                  <p className="text-center py-8 text-muted-foreground">No data available</p>
                ) : (
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={salesByDay}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <RechartsTooltip formatter={(value: any) => [`₹${value}`, 'Sales']} />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="amount"
                          name="Sales"
                          stroke="#8884d8"
                          activeDot={{ r: 8 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          
          <div className="grid grid-cols-1 gap-6 mb-6">
            <Card>
              <CardHeader>
                <CardTitle>Item Sales Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                {itemSales.length === 0 ? (
                  <p className="text-center py-8 text-muted-foreground">No sales data available</p>
                ) : (
                  <>
                    <div className="h-80 mb-6">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={itemSales.slice(0, 10)}
                          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <RechartsTooltip formatter={(value: any, name: any) => [value, name === "count" ? "Units Sold" : "Revenue (₹)"]} />
                          <Legend />
                          <Bar dataKey="count" name="Units Sold" fill="#82ca9d" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    
                    <div className="border rounded-md">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Item Name</TableHead>
                            <TableHead className="text-right">Units Sold</TableHead>
                            <TableHead className="text-right">Revenue (₹)</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {itemSales.slice(0, 10).map((item) => (
                            <TableRow key={item.id}>
                              <TableCell className="font-medium">{item.name}</TableCell>
                              <TableCell className="text-right">{item.count}</TableCell>
                              <TableCell className="text-right">₹{item.revenue.toFixed(2)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
          
          <div className="grid grid-cols-1 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Low Stock Inventory</CardTitle>
              </CardHeader>
              <CardContent>
                {!lowStockItems || lowStockItems.length === 0 ? (
                  <p className="text-center py-8 text-muted-foreground">No low stock items found</p>
                ) : (
                  <div className="border rounded-md">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Ingredient</TableHead>
                          <TableHead>Unit</TableHead>
                          <TableHead className="text-right">Current Stock</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {lowStockItems.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell className="font-medium">{item.name}</TableCell>
                            <TableCell>{item.unit}</TableCell>
                            <TableCell className="text-right">
                              <span className={item.stock < 5 ? "text-red-500 font-semibold" : "text-amber-500"}>
                                {item.stock} {item.unit}
                              </span>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
};

export default Analytics;
