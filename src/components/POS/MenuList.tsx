
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PlusCircle, Upload, Download } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import ItemSelector from "./ItemSelector";

interface MenuListProps {
  onAddToCart: (item: any, isHalf: boolean) => void;
}

const MenuList = ({ onAddToCart }: MenuListProps) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  // New menu item state with support for half pricing
  const [newMenuItem, setNewMenuItem] = useState({
    name: "",
    price: 0,
    halfprice: 0, // Changed to match DB column name
    supportshalf: false // Changed to match DB column name
  });
  
  // File upload state
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [parsedItems, setParsedItems] = useState<{name: string, price: number, halfprice?: number, supportshalf: boolean}[]>([]);
  
  // Fetch menu items
  const { data: menuItems, isLoading } = useQuery({
    queryKey: ['menuItems'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('menuitems')
        .select('*')
        .order('name');
      
      if (error) {
        toast({
          title: "Error loading menu items",
          description: error.message,
          variant: "destructive"
        });
        return [];
      }
      
      return data;
    }
  });
  
  // Add menu item mutation
  const addMenuItem = useMutation({
    mutationFn: async (item: { name: string, price: number, halfprice?: number, supportshalf: boolean }) => {
      const { data, error } = await supabase
        .from('menuitems')
        .insert({
          name: item.name,
          price: item.price,
          halfprice: item.supportshalf ? (item.halfprice || item.price / 2) : null,
          supportshalf: item.supportshalf
        });
      
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menuItems'] });
      setNewMenuItem({ name: "", price: 0, halfprice: 0, supportshalf: false });
      toast({ 
        title: "Menu item added successfully"
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to add menu item",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  // Generate and download sample template
  const downloadSampleTemplate = () => {
    const csvHeader = "Name,Price,HalfPrice,SupportsHalf\n";
    const sampleData = "Butter Chicken,250,125,true\nPaneer Tikka,200,100,true\nVeg Biryani,180,,false\nNaan,30,,false\n";
    const csvContent = csvHeader + sampleData;
    
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "menu_items_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  // Handle CSV file upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setCsvFile(e.target.files[0]);
    }
  };
  
  // Parse CSV data
  const parseCSV = () => {
    if (!csvFile) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      if (!e.target?.result) return;
      
      const text = e.target.result.toString();
      const rows = text.split("\n");
      const items: {name: string, price: number, halfprice?: number, supportshalf: boolean}[] = [];
      
      // Skip header if it exists
      const startRow = rows[0].toLowerCase().includes("name") && rows[0].toLowerCase().includes("price") ? 1 : 0;
      
      for (let i = startRow; i < rows.length; i++) {
        if (!rows[i].trim()) continue;
        
        const columns = rows[i].split(",");
        if (columns.length >= 2) {
          const name = columns[0].trim();
          const price = parseFloat(columns[1].trim());
          const halfprice = columns.length > 2 && columns[2].trim() ? parseFloat(columns[2].trim()) : undefined;
          const supportshalf = columns.length > 3 ? 
            columns[3].trim().toLowerCase() === 'true' : false;
          
          if (name && !isNaN(price)) {
            items.push({ name, price, halfprice, supportshalf });
          }
        }
      }
      
      setParsedItems(items);
    };
    
    reader.readAsText(csvFile);
  };
  
  // Import parsed items
  const importItems = async () => {
    if (parsedItems.length === 0) {
      toast({
        title: "No items to import",
        description: "Please upload and parse a CSV file first",
        variant: "destructive"
      });
      return;
    }
    
    try {
      for (const item of parsedItems) {
        await addMenuItem.mutateAsync(item);
      }
      
      setParsedItems([]);
      setCsvFile(null);
      toast({ 
        title: "Menu items imported successfully"
      });
    } catch (error: any) {
      toast({
        title: "Failed to import menu items",
        description: error.message,
        variant: "destructive"
      });
    }
  };
  
  return (
    <>
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Menu Items</h2>
        
        {/* Add Menu Item Dialog */}
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="h-4 w-4 mr-2" />
              Add Menu Item
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Menu Item</DialogTitle>
              <DialogDescription>
                Add a new item to your restaurant menu.
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="item-name">Item Name</Label>
                <Input 
                  id="item-name" 
                  value={newMenuItem.name}
                  onChange={(e) => setNewMenuItem({ ...newMenuItem, name: e.target.value })}
                  placeholder="Butter Chicken"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="item-price">Full Price (₹)</Label>
                <Input 
                  id="item-price" 
                  type="number" 
                  value={newMenuItem.price || ''}
                  onChange={(e) => setNewMenuItem({ ...newMenuItem, price: parseFloat(e.target.value) || 0 })}
                  placeholder="250"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch 
                  id="supports-half" 
                  checked={newMenuItem.supportshalf}
                  onCheckedChange={(checked) => setNewMenuItem({ ...newMenuItem, supportshalf: checked })}
                />
                <Label htmlFor="supports-half">Half Portion Available (H)</Label>
              </div>
              
              {newMenuItem.supportshalf && (
                <div className="grid gap-2">
                  <Label htmlFor="half-price">Half Price (₹)</Label>
                  <Input 
                    id="half-price" 
                    type="number" 
                    value={newMenuItem.halfprice || ''}
                    onChange={(e) => setNewMenuItem({ ...newMenuItem, halfprice: parseFloat(e.target.value) || 0 })}
                    placeholder={`${(newMenuItem.price / 2).toFixed(2)}`}
                  />
                  <p className="text-xs text-muted-foreground">Leave empty to use half of the full price</p>
                </div>
              )}
            </div>
            
            <DialogFooter>
              <Button 
                onClick={() => {
                  if (!newMenuItem.name || newMenuItem.price <= 0) {
                    toast({
                      title: "Invalid menu item",
                      description: "Please provide a name and a valid price",
                      variant: "destructive"
                    });
                    return;
                  }
                  addMenuItem.mutate(newMenuItem);
                }}
                disabled={addMenuItem.isPending}
              >
                Save Item
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        {/* Import Menu Items Dialog */}
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline">
              <Upload className="h-4 w-4 mr-2" />
              Import Menu
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Import Menu Items</DialogTitle>
              <DialogDescription>
                Upload a CSV file with menu items. Format: Name, Price, HalfPrice, SupportsHalf
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="csv-file">CSV File</Label>
                <Input 
                  id="csv-file" 
                  type="file" 
                  accept=".csv" 
                  onChange={handleFileChange}
                />
                <p className="text-xs text-muted-foreground">
                  Example format: "Butter Chicken, 250, 125, true"
                </p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={downloadSampleTemplate}
                  className="flex items-center mt-1"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download Sample Template
                </Button>
              </div>
              
              {csvFile && (
                <Button onClick={parseCSV} variant="secondary">
                  Parse CSV
                </Button>
              )}
              
              {parsedItems.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium mb-2">Preview ({parsedItems.length} items):</h3>
                  <div className="max-h-32 overflow-y-auto border rounded-md">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="px-2 py-1 text-left">Name</th>
                          <th className="px-2 py-1 text-right">Price (₹)</th>
                          <th className="px-2 py-1 text-right">Half Price (₹)</th>
                          <th className="px-2 py-1 text-center">Half Available</th>
                        </tr>
                      </thead>
                      <tbody>
                        {parsedItems.map((item, index) => (
                          <tr key={index} className="border-b last:border-0">
                            <td className="px-2 py-1">{item.name}</td>
                            <td className="px-2 py-1 text-right">₹{item.price}</td>
                            <td className="px-2 py-1 text-right">{item.halfprice ? `₹${item.halfprice}` : '-'}</td>
                            <td className="px-2 py-1 text-center">{item.supportshalf ? '✓' : '✗'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
            
            <DialogFooter>
              <Button 
                onClick={importItems}
                disabled={parsedItems.length === 0 || addMenuItem.isPending}
              >
                Import All
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      
      {isLoading ? (
        <p>Loading menu items...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {menuItems?.map((item) => (
            <ItemSelector 
              key={item.id} 
              item={item} 
              onAddToCart={onAddToCart} 
            />
          ))}
        </div>
      )}
    </>
  );
};

export default MenuList;
