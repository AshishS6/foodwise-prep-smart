
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ItemSalesChart } from "./ItemSalesChart";
import { ItemSalesTable } from "./ItemSalesTable";
import { BarChart3, Table as TableIcon } from "lucide-react";

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
          <Tabs defaultValue="chart" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="chart" className="flex items-center gap-1">
                <BarChart3 className="h-4 w-4" />
                Chart View
              </TabsTrigger>
              <TabsTrigger value="table" className="flex items-center gap-1">
                <TableIcon className="h-4 w-4" />
                Table View
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="chart" className="space-y-4">
              <ItemSalesChart sales={sales} />
            </TabsContent>
            
            <TabsContent value="table">
              <ItemSalesTable sales={sales} />
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
}
