
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Legend, Tooltip, Cell } from "recharts";
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
  const COLORS = ['#82ca9d', '#8884d8', '#ffc658', '#ff7300', '#0088fe', '#00C49F'];
  
  // Sort and format data for the chart
  const chartData = [...sales]
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10)
    .map(item => ({
      name: item.name.length > 15 ? item.name.substring(0, 15) + '...' : item.name,
      revenue: item.revenue,
      count: item.count,
      fullName: item.name // Keep full name for tooltip
    }));

  return (
    <div className="h-[400px]">
      <ChartContainer>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis 
              dataKey="name" 
              angle={-45} 
              textAnchor="end" 
              height={70} 
              tick={{ fontSize: 12 }}
            />
            <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
            <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
            <Tooltip 
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-white p-3 border rounded-md shadow-md">
                      <p className="font-semibold">{data.fullName}</p>
                      <p className="text-[#8884d8]">Revenue: ₹{data.revenue.toFixed(2)}</p>
                      <p className="text-[#82ca9d]">Units Sold: {data.count}</p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Legend />
            <Bar 
              yAxisId="left"
              dataKey="revenue" 
              fill="#8884d8" 
              name="Revenue (₹)" 
              radius={[4, 4, 0, 0]}
              barSize={20}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Bar>
            <Bar 
              yAxisId="right"
              dataKey="count" 
              fill="#82ca9d" 
              name="Units Sold" 
              radius={[4, 4, 0, 0]}
              barSize={20}
            />
          </BarChart>
        </ResponsiveContainer>
      </ChartContainer>
    </div>
  );
}
