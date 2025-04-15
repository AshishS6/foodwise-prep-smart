
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
  return (
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
  );
}
