
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Legend } from "recharts";
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";

interface ItemSale {
  id: number;
  name: string;
  count: number;
  revenue: number;
}

interface ItemSalesChartProps {
  sales: ItemSale[];
}

export function ItemSalesChart({ sales }: ItemSalesChartProps) {
  const chartConfig = {
    items: {
      count: { color: "#82ca9d", label: "Units Sold" },
    }
  };

  return (
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
  );
}
