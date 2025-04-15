
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface ItemSale {
  id: number;
  name: string;
  count: number;
  revenue: number;
}

interface ItemSalesTableProps {
  sales: ItemSale[];
}

export function ItemSalesTable({ sales }: ItemSalesTableProps) {
  // Sort sales by revenue in descending order
  const sortedSales = [...sales].sort((a, b) => b.revenue - a.revenue);

  return (
    <div className="border rounded-md overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="bg-muted/30 w-[40%]">Item Name</TableHead>
            <TableHead className="bg-muted/30 text-right">Units Sold</TableHead>
            <TableHead className="bg-muted/30 text-right">Revenue (₹)</TableHead>
            <TableHead className="bg-muted/30 text-right">% of Total</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedSales.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="text-center py-4 text-muted-foreground">
                No sales data available
              </TableCell>
            </TableRow>
          ) : (
            <>
              {sortedSales.slice(0, 10).map((item) => {
                const totalRevenue = sortedSales.reduce((sum, item) => sum + item.revenue, 0);
                const percentage = totalRevenue > 0 ? ((item.revenue / totalRevenue) * 100).toFixed(1) : '0';
                
                return (
                  <TableRow key={item.id} className="hover:bg-muted/10">
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell className="text-right">{item.count}</TableCell>
                    <TableCell className="text-right">₹{item.revenue.toFixed(2)}</TableCell>
                    <TableCell className="text-right">{percentage}%</TableCell>
                  </TableRow>
                );
              })}
            </>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
