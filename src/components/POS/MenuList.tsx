import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Search, Plus, Upload, Pencil, Download, MinusCircle, PlusCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import EditItemDialog from "./EditItemDialog";
import PortionTypeSelector from "./PortionTypeSelector";
import { PortionType } from "@/types";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogTrigger 
} from "@/components/ui/dialog";

interface MenuListProps {
  onAddToCart: (item: any, portionType: PortionType, note?: string) => void;
  onUpdateQuantity?: (itemId: number, portionLabel: string, change: number) => void;
  searchTerm?: string;
  setSearchTerm?: (term: string) => void;
  cart?: any[];
  currentBillGroup?: number;
}

const MenuList = ({ 
  onAddToCart, 
  onUpdateQuantity,
  searchTerm = "", 
  setSearchTerm,
  cart = [],
  currentBillGroup = 1
}: MenuListProps) => {
  const [categories] = useState([
    "All Items", 
    "Main Course", 
    "Starters", 
    "Desserts", 
    "Beverages"
  ]);
  const [activeCategory, setActiveCategory] = useState("All Items");
  const [localSearch, setLocalSearch] = useState(searchTerm);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedPortions, setSelectedPortions] = useState<Record<number, PortionType>>({});
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  const queryClient = useQueryClient();

  const { data: menuItems, isLoading, error } = useQuery({
    queryKey: ['menuItems'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('menuitems')
        .select('*')
        .order('name');
      
      if (error) throw error;
      
      return (data || []).map(item => {
        let portions: PortionType[] = [];
        
        if (item.portions && typeof item.portions === 'string') {
          try {
            portions = JSON.parse(item.portions);
          } catch {
            portions = [];
          }
        } else if (Array.isArray(item.portions)) {
          portions = item.portions as PortionType[];
        }
        
        if (portions.length === 0) {
          portions = [{
            label: 'Full',
            price: item.price,
            unit: 'plate',
            multiplier: 1
          }];
        }
        
        return {
          ...item,
          portions
        };
      });
    }
  });

  const importMenuItems = useMutation({
    mutationFn: async (items: any[]) => {
      const formattedItems = items.map(item => {
        const unit = item.unit || 'plate';
        const price = parseFloat(item.price) || 0;
        const supportshalf = item.supportshalf === true || item.supportshalf?.toString().toUpperCase() === 'TRUE';
        const halfprice = parseFloat(item.halfprice) || 0;
        
        const portions = [{
          label: 'Full',
          price: price,
          unit: unit,
          multiplier: 1
        }];
        
        if (supportshalf) {
          portions.push({
            label: 'Half',
            price: halfprice,
            unit: unit,
            multiplier: 0.5
          });
        }

        return {
          name: item.name,
          price: price,
          category: item.category || 'Main Course',
          supportshalf: supportshalf,
          halfprice: halfprice,
          portions: portions
        };
      });

      const { data, error } = await supabase
        .from('menuitems')
        .insert(formattedItems);
      
      if (error) throw error;
      
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['menuItems'] });
      toast({
        title: "Items Imported Successfully",
        description: `${variables.length} menu items have been added to your menu`,
        variant: "default"
      });
      setImportedItems([]);
      setImportDialogOpen(false);
    },
    onError: (error) => {
      console.error("Import error:", error);
      toast({
        title: "Error Importing Items",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive"
      });
    }
  });

  const [importedItems, setImportedItems] = useState<any[]>([]);

  useEffect(() => {
    const searchInput = document.querySelector('input[type="text"]') as HTMLInputElement;
    if (searchInput) {
      searchInput.focus();
    }
  }, []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setLocalSearch(value);
    
    if (setSearchTerm) {
      setSearchTerm(value);
    }
  };

  const filteredItems = (menuItems || []).filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(localSearch.toLowerCase());
    const matchesCategory = activeCategory === "All Items" || item.category === activeCategory;
    return matchesSearch && matchesCategory;
  }).sort((a, b) => {
    // Sort items: those with multiple portions first, then single portion items
    const aHasMultiplePortions = a.portions && a.portions.length > 1;
    const bHasMultiplePortions = b.portions && b.portions.length > 1;
    
    if (aHasMultiplePortions && !bHasMultiplePortions) return -1;
    if (!aHasMultiplePortions && bHasMultiplePortions) return 1;
    return 0; // Keep original order within each group
  });

  const handleAddNewItem = () => {
    setEditingItem({
      name: "",
      price: 0,
      supportshalf: false,
      halfprice: 0,
      category: "Main Course"
    });
    setIsDialogOpen(true);
  };

  const handleEditItem = (item: any) => {
    setEditingItem(item);
    setIsDialogOpen(true);
  };

  const handleToggleEditMode = () => {
    setIsEditMode(!isEditMode);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingItem(null);
  };

  const handlePortionSelect = (item: any, portionType: PortionType) => {
    setSelectedPortions({
      ...selectedPortions,
      [item.id]: portionType
    });
  };

  const getCartQuantity = (item: any, portionType: PortionType) => {
    const cartItem = cart.find(cartItem => 
      cartItem.menuItemId === item.id && 
      cartItem.portionType.label === portionType.label &&
      cartItem.billGroup === currentBillGroup
    );
    return cartItem?.quantity || 0;
  };

  const handleAddToCart = (item: any) => {
    const portionType = selectedPortions[item.id] || item.portions[0];
    
    // Show toast notification
    toast({
      title: "Item added to cart",
      description: `${item.name} (${portionType.label}) added successfully`,
    });
    onAddToCart(item, portionType);
  };

  const generateCsvTemplate = () => {
    const header = "Name,Price,Category,SupportHalf,HalfPrice,Unit\n";
    const sampleRows = [
      "Chicken Biriyani,130,Main Course,TRUE,70,plate",
      "Masala Dosa,90,Main Course,TRUE,50,plate",
      "Coffee,15,Beverages,FALSE,,cup"
    ].join("\n");
    
    const csvContent = header + sampleRows;
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = 'menu_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Template Downloaded",
      description: "Fill the template with your menu items and upload it back",
      variant: "default"
    });
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const text = e.target?.result as string;
        const rows = text.split('\n').map(row => row.split(','));
        const headers = rows[0].map(header => header.toLowerCase().trim());
        
        const items = rows.slice(1)
          .filter(row => row.length > 1 && row[0].trim() !== '')
          .map(row => {
            const item: any = {};
            headers.forEach((header, index) => {
              if (index < row.length) {
                const value = row[index]?.trim();
                
                if (header === 'supporthalf' || header === 'supportshalf') {
                  item['supportshalf'] = value.toUpperCase() === 'TRUE';
                } else if (header === 'price' || header === 'halfprice') {
                  item[header] = value ? parseFloat(value) : 0;
                } else {
                  item[header] = value;
                }
              }
            });
            return item;
          });

        const existingItems = menuItems || [];
        const duplicates = items.filter(newItem => 
          existingItems.some(existingItem => 
            existingItem.name.toLowerCase() === newItem.name.toLowerCase()
          )
        );

        if (duplicates.length > 0) {
          toast({
            title: "Error: Duplicate Items",
            description: `The following items already exist: ${duplicates.map(d => d.name).join(', ')}`,
            variant: "destructive"
          });
          return;
        }

        setImportedItems(items);
        importMenuItems.mutate(items);
      } catch (err) {
        console.error("CSV processing error:", err);
        toast({
          title: "Error Processing CSV",
          description: err instanceof Error ? err.message : "Failed to process the CSV file",
          variant: "destructive"
        });
      }
    };
    reader.readAsText(file);
  };

  const [actionDialogOpen, setActionDialogOpen] = useState(false);

  if (error) {
    return <p className="text-destructive">Error loading menu items: {error.message}</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search menu items... (start typing)"
            value={localSearch}
            onChange={handleSearchChange}
            className="pl-9 pr-3 w-full"
            autoFocus
          />
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={isEditMode ? "default" : "outline"}
            onClick={handleToggleEditMode}
            size="sm"
          >
            <Pencil className="h-4 w-4 mr-2" />
            {isEditMode ? "Done Editing" : "Edit Items"}
          </Button>
          <Dialog open={actionDialogOpen} onOpenChange={setActionDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add / Import
              </Button>
            </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add or Import Menu Items</DialogTitle>
              <DialogDescription>
                Choose an option to add items to your menu
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-3 mt-4">
              <Button
                onClick={() => {
                  handleAddNewItem();
                  setActionDialogOpen(false);
                }}
                className="w-full justify-start h-auto py-4"
              >
                <Plus className="h-5 w-5 mr-3" />
                <div className="text-left">
                  <div className="font-semibold">Add New Item</div>
                  <div className="text-sm text-muted-foreground font-normal">
                    Manually create a new menu item
                  </div>
                </div>
              </Button>
              
              <Button
                variant="outline"
                onClick={() => {
                  setImportDialogOpen(true);
                  setActionDialogOpen(false);
                }}
                className="w-full justify-start h-auto py-4"
              >
                <Upload className="h-5 w-5 mr-3" />
                <div className="text-left">
                  <div className="font-semibold">Import Items</div>
                  <div className="text-sm text-muted-foreground font-normal">
                    Upload multiple items from CSV file
                  </div>
                </div>
              </Button>
            </div>
          </DialogContent>
        </Dialog>
        
        <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Import Menu Items</DialogTitle>
              <DialogDescription>
                Follow these steps to import your menu items:
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-4 mt-2">
              <ol className="list-decimal list-inside space-y-2">
                <li>Download the CSV template</li>
                <li>Fill in your menu items in the template</li>
                <li>Save the file as CSV</li>
                <li>Upload the filled template</li>
              </ol>
              
              <Button
                variant="outline"
                onClick={generateCsvTemplate}
                className="w-full"
              >
                <Download className="h-4 w-4 mr-2" />
                Download Template
              </Button>
              
              <div className="relative">
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="csv-upload"
                />
                <Button
                  variant="default"
                  className="w-full"
                  onClick={() => document.getElementById('csv-upload')?.click()}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload CSV File
                </Button>
              </div>
            </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex overflow-x-auto gap-2 pb-2">
        {categories.map((category) => (
          <Button
            key={category}
            variant={activeCategory === category ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveCategory(category)}
            className="whitespace-nowrap"
          >
            {category}
          </Button>
        ))}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {[...Array(10)].map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <CardContent className="p-0">
                <div className="p-3">
                  <Skeleton className="h-4 w-3/4 mb-1.5" />
                  <Skeleton className="h-3 w-1/3 mb-2" />
                  <Skeleton className="h-6 w-full mb-2" />
                  <Skeleton className="h-7 w-full" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {filteredItems.length === 0 ? (
            <p className="col-span-full text-center py-8 text-muted-foreground">
              No menu items found. Try adjusting your search or category.
            </p>
          ) : (
            filteredItems.map((item) => (
              <Card 
                key={item.id} 
                className={`overflow-hidden transition-all ${
                  isEditMode 
                    ? "hover:border-primary cursor-pointer border-2 border-dashed" 
                    : "hover:border-primary/50"
                }`}
                onClick={isEditMode ? () => handleEditItem(item) : undefined}
              >
                <CardContent className="p-3">
                  <div className="flex justify-between items-start gap-2 mb-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-sm truncate">{item.name}</h3>
                        {isEditMode && (
                          <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                            Tap to edit
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold text-primary">
                          ₹{(selectedPortions[item.id]?.price || item.portions[0].price).toFixed(2)}
                        </p>
                        <span className="text-xs bg-gray-100 px-1.5 py-0.5 rounded text-gray-600">
                          {item.category}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {item.portions.length > 1 && (
                    <div className="mb-2">
                      <PortionTypeSelector
                        portions={item.portions}
                        selectedPortion={selectedPortions[item.id] || item.portions[0]}
                        onSelectPortion={(portion) => handlePortionSelect(item, portion)}
                      />
                    </div>
                  )}
                  
                  <div className="mt-2">
                    {(() => {
                      const portionType = selectedPortions[item.id] || item.portions[0];
                      const quantity = getCartQuantity(item, portionType);
                      
                      if (quantity > 0) {
                        return (
                          <div className="flex items-center gap-1.5">
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => {
                                if (onUpdateQuantity) {
                                  onUpdateQuantity(item.id, portionType.label, -1);
                                }
                              }}
                            >
                              <MinusCircle className="h-3.5 w-3.5" />
                            </Button>
                            <div className="flex-1 text-center">
                              <span className="text-xs font-semibold">{quantity} added</span>
                            </div>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => {
                                if (onUpdateQuantity) {
                                  const currentQty = getCartQuantity(item, portionType);
                                  if (currentQty > 0) {
                                    onUpdateQuantity(item.id, portionType.label, 1);
                                  } else {
                                    handleAddToCart(item);
                                  }
                                } else {
                                  handleAddToCart(item);
                                }
                              }}
                            >
                              <PlusCircle className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        );
                      }
                      
                      return (
                        <Button
                          onClick={() => handleAddToCart(item)}
                          className="w-full h-8 text-sm"
                          size="sm"
                        >
                          Add to Cart
                        </Button>
                      );
                    })()}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      <EditItemDialog
        isOpen={isDialogOpen}
        onClose={handleCloseDialog}
        item={editingItem}
      />
    </div>
  );
};

export default MenuList;
