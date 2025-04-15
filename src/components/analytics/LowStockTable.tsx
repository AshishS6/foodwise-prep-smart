
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { AlertTriangle, Package } from "lucide-react";

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
  // Function to determine stock level color
  const getStockLevelColor = (stock: number) => {
    if (stock <= 2) return "bg-red-500";
    if (stock <= 5) return "bg-amber-500";
    return "bg-yellow-400";
  };

  // Function to determine status text
  const getStockStatusText = (stock: number) => {
    if (stock <= 2) return "Critical";
    if (stock <= 5) return "Low";
    return "Warning";
  };

  return (
    <Card>
      <CardHeader className="border-b bg-muted/20">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-amber-500 mr-2" />
            Low Stock Inventory
          </CardTitle>
          <span className="bg-amber-100 text-amber-800 text-xs px-2 py-1 rounded-full">
            {items.length} items need attention
          </span>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        {!items || items.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground flex flex-col items-center gap-2">
            <Package className="h-8 w-8 text-muted" />
            <p>All inventory items have sufficient stock</p>
          </div>
        ) : (
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ingredient</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Current Stock</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id} className="group hover:bg-muted/10">
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>{item.unit}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-24">
                          <Progress value={item.stock * 10} className={`h-2 ${getStockLevelColor(item.stock)}`} />
                        </div>
                        <span className="text-xs font-medium">
                          {getStockStatusText(item.stock)}
                        </span>
                      </div>
                    </TableCell>
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
