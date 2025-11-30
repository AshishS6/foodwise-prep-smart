
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ItemSalesTable } from "./ItemSalesTable";

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
  return (
    <Card className="shadow-lg">
      <CardHeader className="border-b bg-muted/20">
        <CardTitle>Item Sales Analysis</CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        {sales.length === 0 ? (
          <p className="text-center py-8 text-muted-foreground">No sales data available</p>
        ) : (
          <ItemSalesTable sales={sales} />
        )}
      </CardContent>
    </Card>
  );
}
