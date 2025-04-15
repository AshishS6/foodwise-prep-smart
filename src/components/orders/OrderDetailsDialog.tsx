
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { format } from "date-fns";
import { Receipt } from "lucide-react";

interface OrderDetailsDialogProps {
  order: {
    id: number;
    timestamp: string;
    items: Array<{
      name: string;
      quantity: number;
      price: number;
      isHalf?: boolean;
    }>;
    total: number;
  } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const OrderDetailsDialog = ({
  order,
  open,
  onOpenChange,
}: OrderDetailsDialogProps) => {
  if (!order) return null;

  const formatTime = (timestamp: string) => {
    return format(new Date(timestamp), "dd MMM yyyy, hh:mm a");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Bill Copy - Order #{order.id}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="text-sm text-muted-foreground">
            {formatTime(order.timestamp)}
          </div>
          
          <div className="border rounded-lg p-4 space-y-3">
            <div className="space-y-2">
              {order.items.map((item, index) => (
                <div key={index} className="flex justify-between text-sm">
                  <div>
                    {item.quantity}x {item.name} {item.isHalf ? "(Half)" : ""}
                  </div>
                  <div>
                    ₹{(item.price * item.quantity).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="border-t pt-2 mt-2">
              <div className="flex justify-between font-medium">
                <span>Total Amount</span>
                <span>₹{order.total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
