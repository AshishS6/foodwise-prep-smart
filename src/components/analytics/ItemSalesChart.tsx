
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
  // Improved color palette for better visual distinction
  const COLORS = ['#9b87f5', '#82ca9d', '#ffc658', '#ff7300', '#0088fe', '#00C49F', '#8884d8', '#FFBB28'];
  
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

  // Define chart configuration with improved styling
  const chartConfig = {
    revenue: {
      label: 'Revenue',
      color: '#9b87f5'
    },
    count: {
      label: 'Units Sold',
      color: '#82ca9d'
    }
  };

  return (
    <div className="h-[400px]">
      <ChartContainer config={chartConfig}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
            <XAxis 
              dataKey="name" 
              angle={-45} 
              textAnchor="end" 
              height={70} 
              tick={{ fontSize: 12 }}
              tickLine={{ stroke: '#E5DEFF' }}
              axisLine={{ stroke: '#E5DEFF' }}
            />
            <YAxis 
              yAxisId="left" 
              orientation="left" 
              stroke="#9b87f5"
              tickFormatter={(value) => `₹${value}`} 
              label={{ value: 'Revenue (₹)', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#9b87f5', fontSize: 12 }, dx: -15 }}
            />
            <YAxis 
              yAxisId="right" 
              orientation="right" 
              stroke="#82ca9d" 
              label={{ value: 'Units Sold', angle: 90, position: 'insideRight', style: { textAnchor: 'middle', fill: '#82ca9d', fontSize: 12 }, dx: 15 }}
            />
            <Tooltip 
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-white p-3 border rounded-md shadow-md">
                      <p className="font-semibold">{data.fullName}</p>
                      <p className="text-[#9b87f5]">Revenue: ₹{data.revenue.toFixed(2)}</p>
                      <p className="text-[#82ca9d]">Units Sold: {data.count}</p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Legend 
              wrapperStyle={{ paddingTop: 10 }} 
              formatter={(value) => <span className="text-xs font-medium">{value}</span>}
            />
            <Bar 
              yAxisId="left"
              dataKey="revenue" 
              fill="#9b87f5" 
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
              opacity={0.9}
            />
          </BarChart>
        </ResponsiveContainer>
      </ChartContainer>
    </div>
  );
}
