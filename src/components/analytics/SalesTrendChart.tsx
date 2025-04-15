
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts";
import { ChartContainer } from "@/components/ui/chart";

interface SalesData {
  date: string;
  amount: number;
}

interface SalesTrendChartProps {
  data: SalesData[];
}

export function SalesTrendChart({ data }: SalesTrendChartProps) {
  const chartConfig = {
    sales: {
      amount: { color: "#8884d8", label: "Sales" }
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sales Trend</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="text-center py-8 text-muted-foreground">No data available</p>
        ) : (
          <div className="h-80">
            <ChartContainer config={chartConfig.sales}>
              <LineChart
                data={data}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Line
                  type="monotone"
                  dataKey="amount"
                  name="amount"
                  stroke="#8884d8"
                  activeDot={{ r: 8 }}
                />
              </LineChart>
            </ChartContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
