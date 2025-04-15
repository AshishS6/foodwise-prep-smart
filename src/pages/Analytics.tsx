import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend } from "recharts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TooltipProvider, Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuthStore } from "@/stores/authStore";
import { format, subDays } from "date-fns";
import * as ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

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
    
    if (userRole !== 'Admin') {
      navigate('/');
      return;
    }
  }, [session, userRole, navigate]);

  const { data: orders, isLoading } = useQuery({
    queryKey: ['orders', timeRange],
    queryFn: async () => {
      const startDate = getStartDateForRange(timeRange);
      
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .gte('timestamp', startDate.toISOString())
        .order('timestamp', { ascending: false });
      
      if (error) {
        toast({
          title: "Error loading orders",
          description: error.message,
          variant: "destructive"
        });
        return [];
      }
      
      return data;
    }
  });

  const totalRevenue = orders?.reduce((sum, order) => sum + order.total, 0) || 0;
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
          const key = `${item.name}-${item.isHalf}`;
          if (!itemCounts[key]) {
            itemCounts[key] = {
              name: item.name,
              count: 0
            };
          }
          itemCounts[key].count += item.quantity;
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
      const orderDate = format(new Date(order.timestamp), 'yyyy-MM-dd');
      if (salesMap[orderDate] !== undefined) {
        salesMap[orderDate] += order.total;
      }
    });
    
    return Object.entries(salesMap)
      .map(([date, amount]) => ({
        date: format(new Date(date), 'MMM dd'),
        amount: amount
      }))
      .reverse();
  }

  const exportToExcel = async () => {
    if (!orders || orders.length === 0) {
      toast({
        title: "No data to export",
        variant: "destructive"
      });
      return;
    }

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
        ? order.items.map(item => `${item.quantity}x ${item.name}`).join(', ')
        : '';
      worksheet.addRow([
        order.id,
        format(new Date(order.timestamp), 'yyyy-MM-dd HH:mm'),
        itemsText,
        `₹${order.total.toFixed(2)}`
      ]);
    });
    
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, `payasakkada-sales-report-${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
    
    toast({
      title: "Report exported successfully",
    });
  };

  const exportToPDF = () => {
    toast({
      title: "PDF export",
      description: "PDF export functionality will be implemented soon.",
    });
  };

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
            <Download className="h-4 w-4 mr-1" />
            Export Excel
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={exportToPDF}
            disabled={isLoading || !orders || orders.length === 0}
          >
            <Download className="h-4 w-4 mr-1" />
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
        <p>Loading analytics data...</p>
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
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                        <RechartsTooltip formatter={(value) => [`₹${value}`, 'Sales']} />
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
          
          <div className="mt-6 flex justify-end">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" disabled>
                    Export Report
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Coming soon</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </>
      )}
    </div>
  );
};

export default Analytics;
