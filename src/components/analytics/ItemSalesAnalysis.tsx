
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChartContainer } from "@/components/ui/chart";

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
    <Card>
      <CardHeader>
        <CardTitle>Item Sales Analysis</CardTitle>
      </CardHeader>
      <CardContent>
        {sales.length === 0 ? (
          <p className="text-center py-8 text-muted-foreground">No sales data available</p>
        ) : (
          <>
            <div className="h-80 mb-6">
              <ChartContainer config={chartConfig.items}>
                <BarChart
                  data={sales.slice(0, 10)}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Bar dataKey="count" name="count" fill="#82ca9d" />
                </BarChart>
              </ChartContainer>
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
                  {sales.slice(0, 10).map((item) => (
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
  );
}
