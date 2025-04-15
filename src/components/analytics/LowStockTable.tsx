
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface InventoryItem {
  id: number;
  name: string;
  unit: string;
  stock: number;
}

interface LowStockTableProps {
  items: InventoryItem[];
}

export function LowStockTable({ items }: LowStockTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Low Stock Inventory</CardTitle>
      </CardHeader>
      <CardContent>
        {!items || items.length === 0 ? (
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
                {items.map((item) => (
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
  );
}
