
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ItemSale {
  id: number;
  name: string;
  count: number;
  revenue: number;
}

interface ItemSalesAnalysisProps {
  sales: ItemSale[];
}

export function ItemSalesAnalysis({ sales }: ItemSalesAnalysisProps) {
  const chartConfig = {
    items: {
      count: { color: "#82ca9d", label: "Units Sold" },
      revenue: { color: "#8884d8", label: "Revenue" }
    }
  };

  return (
    <Card className="shadow-lg">
      <CardHeader className="border-b bg-muted/20">
        <CardTitle>Item Sales Analysis</CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        {sales.length === 0 ? (
          <p className="text-center py-8 text-muted-foreground">No sales data available</p>
        ) : (
          <Tabs defaultValue="chart" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="chart">Chart View</TabsTrigger>
              <TabsTrigger value="table">Table View</TabsTrigger>
            </TabsList>
            
            <TabsContent value="chart" className="space-y-4">
              <div className="h-[400px]">
                <ChartContainer config={chartConfig.items}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={sales.slice(0, 10)}
                      margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="name" 
                        angle={-45} 
                        textAnchor="end" 
                        height={70} 
                        tick={{ fontSize: 12 }}
                      />
                      <YAxis />
                      <Tooltip content={<ChartTooltipContent />} />
                      <Legend />
                      <Bar 
                        dataKey="count" 
                        fill="#82ca9d" 
                        name="Units Sold" 
                        radius={[4, 4, 0, 0]}
                        barSize={35}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </div>
            </TabsContent>
            
            <TabsContent value="table">
              <div className="border rounded-md overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="bg-muted/30 w-[50%]">Item Name</TableHead>
                      <TableHead className="bg-muted/30 text-right">Units Sold</TableHead>
                      <TableHead className="bg-muted/30 text-right">Revenue (₹)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sales.slice(0, 10).map((item) => (
                      <TableRow key={item.id} className="hover:bg-muted/10">
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell className="text-right">{item.count}</TableCell>
                        <TableCell className="text-right">₹{item.revenue.toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
}
