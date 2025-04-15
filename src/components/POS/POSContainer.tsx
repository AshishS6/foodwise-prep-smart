
import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, BarChart3, AlertCircle, Split, FileText, Upload, Download } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuthStore } from "@/stores/authStore";
import { useCart } from "@/hooks/useCart";
import { useBillGroups } from "@/hooks/useBillGroups";
import { useOrderSubmission } from "@/hooks/useOrderSubmission";
import MenuList from "./MenuList";
import OrderList from "./OrderList";
import { CartItem, PortionType } from "@/types";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TooltipProvider, Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { utcToZonedTime } from "date-fns-tz";

type MenuCategory = "Main Course" | "Starters" | "Desserts" | "Beverages";

const POSContainer = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [importName, setImportName] = useState("");
  const [importPrice, setImportPrice] = useState("");
  const [importCategory, setImportCategory] = useState<MenuCategory>("Main Course");
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [portions, setPortions] = useState<PortionType[]>([
    { label: 'Full', price: 0, unit: 'plate', multiplier: 1 }
  ]);
  const [showPortionOptions, setShowPortionOptions] = useState(false);
  const [halfPortionPrice, setHalfPortionPrice] = useState("");
  
  const {
    cart,
    setCart,
    addToCart,
    updateQuantity,
    removeFromCart,
    updateNote,
    setItemQuantity
  } = useCart();

  const {
    currentBillGroup,
    setCurrentBillGroup,
    billGroups,
    setBillGroups,
    addBillGroup,
    deleteBillGroup
  } = useBillGroups();

  const {
    missingRecipes,
    setMissingRecipes,
    showMissingRecipeAlert,
    setShowMissingRecipeAlert,
    isValidatingOrder,
    setIsValidatingOrder,
    submitOrder,
    validateOrderRecipes
  } = useOrderSubmission();

  const { data: recipes } = useQuery({
    queryKey: ['allRecipes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('recipes')
        .select('*');
      
      if (error) {
        console.error('Error fetching recipes:', error);
        return [];
      }
      
      return data || [];
    }
  });

  const handleKeyDown = (e: KeyboardEvent) => {
    if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') {
      return;
    }

    if (e.key >= '1' && e.key <= '9') {
      const groupIndex = parseInt(e.key) - 1;
      if (groupIndex < billGroups.length) {
        setCurrentBillGroup(billGroups[groupIndex]);
      }
    }

    if (e.key === '+') {
      addBillGroup();
    }
  };

  useEffect(() => {
    console.log("Setting up keyboard event listeners");
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      console.log("Cleaning up keyboard event listeners");
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [billGroups]);

  const handleOrderSubmit = async () => {
    if (cart.length === 0) {
      toast({
        title: "Empty cart",
        description: "Please add items to your cart before submitting",
        variant: "destructive"
      });
      return;
    }

    setIsValidatingOrder(true);
    const isValid = await validateOrderRecipes(cart, recipes || []);
    setIsValidatingOrder(false);
    
    if (!isValid) {
      setShowMissingRecipeAlert(true);
    } else {
      submitOrder.mutate(cart, {
        onSuccess: (data) => {
          // Clear cart after successful submission
          setCart([]);
          setBillGroups([1]);
          setCurrentBillGroup(1);
          
          toast({
            title: "Order completed successfully",
            description: "All bills have been processed",
            variant: "default"
          });
        }
      });
    }
  };

  const submitCurrentGroup = async () => {
    const currentGroupItems = cart.filter(item => item.billGroup === currentBillGroup);
    
    if (currentGroupItems.length === 0) {
      toast({
        title: "Empty bill",
        description: "Please add items to the current bill before submitting",
        variant: "destructive"
      });
      return;
    }

    setIsValidatingOrder(true);
    const isValid = await validateOrderRecipes(currentGroupItems, recipes || []);
    setIsValidatingOrder(false);
    
    if (!isValid) {
      setShowMissingRecipeAlert(true);
    } else {
      submitOrder.mutate(currentGroupItems, {
        onSuccess: (data) => {
          // Remove the processed items from cart
          setCart(cart.filter(item => item.billGroup !== currentBillGroup));
          
          if (billGroups.length > 1) {
            setBillGroups(billGroups.filter(g => g !== currentBillGroup));
            setCurrentBillGroup(billGroups.filter(g => g !== currentBillGroup)[0]);
          } else {
            setCurrentBillGroup(1);
          }
          
          toast({
            title: "Bill completed",
            description: `Bill #${currentBillGroup} has been processed`,
            variant: "default"
          });
        }
      });
    }
  };

  const currentGroupTotal = cart
    .filter(item => item.billGroup === currentBillGroup)
    .reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  useEffect(() => {
    console.log("POSContainer initialized");
    return () => {
      console.log("POSContainer unmounted");
    };
  }, []);

  const deleteBillGroupInner = (groupToDelete: number) => {
    deleteBillGroup(groupToDelete, cart, setCart);
  };

  useEffect(() => {
    // Update portions when price changes
    const price = parseFloat(importPrice) || 0;
    const updatedPortions: PortionType[] = [
      { label: 'Full', price: price, unit: 'plate', multiplier: 1 }
    ];

    if (showPortionOptions && halfPortionPrice) {
      const halfPrice = parseFloat(halfPortionPrice) || 0;
      updatedPortions.push({ label: 'Half', price: halfPrice, unit: 'plate', multiplier: 0.5 });
    }

    setPortions(updatedPortions);
  }, [importPrice, halfPortionPrice, showPortionOptions]);

  const handleImportItem = async () => {
    if (!importName || !importPrice) {
      toast({
        title: "Missing information",
        description: "Please fill all required fields",
        variant: "destructive"
      });
      return;
    }

    const price = parseFloat(importPrice);
    if (isNaN(price)) {
      toast({
        title: "Invalid price",
        description: "Please enter a valid price",
        variant: "destructive"
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('menuitems')
        .insert({
          name: importName,
          price: price,
          category: importCategory,
          portions: JSON.stringify(portions),
          supportshalf: showPortionOptions,
          halfprice: showPortionOptions ? parseFloat(halfPortionPrice) || null : null
        })
        .select();

      if (error) throw error;

      toast({
        title: "Item added successfully",
        description: `${importName} has been added to the menu`,
        variant: "default"
      });
      
      setImportName("");
      setImportPrice("");
      setImportCategory("Main Course");
      setShowPortionOptions(false);
      setHalfPortionPrice("");
      setImportDialogOpen(false);
      
      // Refresh menu items
      queryClient.invalidateQueries({ queryKey: ['menuItems'] });
    } catch (error: any) {
      toast({
        title: "Failed to add item",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const generateCsvTemplate = () => {
    const header = "Name,Price,Category,SupportHalf,HalfPrice\n";
    const sampleRows = [
      "Chicken Biriyani,130,Main Course,TRUE,70",
      "Masala Dosa,90,Main Course,TRUE,50",
      "Coffee,15,Beverages,FALSE,"
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
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Button 
            variant="ghost" 
            size="sm" 
            className="mr-2"
            onClick={() => {
              console.log("Navigating back to home");
              navigate('/');
            }}
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
          <h1 className="text-2xl font-bold">Point of Sale</h1>
        </div>
        
        <div className="flex items-center gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => {
                    console.log("Navigating to analytics page");
                    navigate('/analytics');
                  }}
                >
                  <BarChart3 className="h-4 w-4 mr-1" />
                  Analytics
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>View Sales Analytics</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Upload className="h-4 w-4 mr-1" />
                Import Item
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Add New Menu Item</DialogTitle>
                <DialogDescription>
                  Add a new item to your menu or download a template to bulk import items.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">
                    Name
                  </Label>
                  <Input
                    id="name"
                    value={importName}
                    onChange={(e) => setImportName(e.target.value)}
                    className="col-span-3"
                    placeholder="Item name"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="price" className="text-right">
                    Price (₹)
                  </Label>
                  <Input
                    id="price"
                    value={importPrice}
                    onChange={(e) => setImportPrice(e.target.value)}
                    type="number"
                    min="0"
                    step="0.01"
                    className="col-span-3"
                    placeholder="0.00"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="category" className="text-right">
                    Category
                  </Label>
                  <Select
                    value={importCategory}
                    onValueChange={(val) => setImportCategory(val as MenuCategory)}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Main Course">Main Course</SelectItem>
                      <SelectItem value="Starters">Starters</SelectItem>
                      <SelectItem value="Desserts">Desserts</SelectItem>
                      <SelectItem value="Beverages">Beverages</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <div className="text-right col-span-4">
                    <div className="flex items-center justify-end space-x-2">
                      <input 
                        type="checkbox" 
                        id="supportHalf"
                        checked={showPortionOptions}
                        onChange={(e) => setShowPortionOptions(e.target.checked)}
                        className="h-4 w-4"
                      />
                      <Label htmlFor="supportHalf">
                        Support Half Portion
                      </Label>
                    </div>
                  </div>
                </div>
                {showPortionOptions && (
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="halfPrice" className="text-right">
                      Half Price (₹)
                    </Label>
                    <Input
                      id="halfPrice"
                      value={halfPortionPrice}
                      onChange={(e) => setHalfPortionPrice(e.target.value)}
                      type="number"
                      min="0"
                      step="0.01"
                      className="col-span-3"
                      placeholder="0.00"
                    />
                  </div>
                )}
              </div>
              <DialogFooter className="flex justify-between items-center">
                <Button
                  variant="outline"
                  onClick={generateCsvTemplate}
                  type="button"
                  className="mr-auto"
                >
                  <Download className="h-4 w-4 mr-1" />
                  Download Template
                </Button>
                <Button
                  type="submit"
                  onClick={handleImportItem}
                >
                  Add Item
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <MenuList 
            onAddToCart={(item, portionType, note) => addToCart(item, portionType, currentBillGroup, note)} 
            searchTerm={searchTerm} 
            setSearchTerm={setSearchTerm} 
          />
        </div>

        <div className="bg-muted/30 rounded-lg p-4 border shadow-sm">
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-semibold">Bill Groups</h2>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={addBillGroup}
                className="flex items-center gap-1"
              >
                <Split className="h-3 w-3" />
                New Bill
              </Button>
            </div>
            <Tabs value={String(currentBillGroup)} onValueChange={(val) => setCurrentBillGroup(Number(val))}>
              <TabsList className="w-full flex overflow-x-auto">
                {billGroups.map((group) => (
                  <TabsTrigger 
                    key={group} 
                    value={String(group)}
                    className="flex-1 min-w-[60px]"
                  >
                    Bill #{group}
                    {billGroups.length > 1 && group !== 1 && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-5 w-5 p-0 ml-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteBillGroupInner(group);
                        }}
                      >
                        ×
                      </Button>
                    )}
                  </TabsTrigger>
                ))}
              </TabsList>
              
              {billGroups.map((group) => (
                <TabsContent key={group} value={String(group)}>
                  <OrderList 
                    cart={cart.filter(item => item.billGroup === group)} 
                    total={cart
                      .filter(item => item.billGroup === group)
                      .reduce((sum, item) => sum + (item.price * item.quantity), 0)
                    }
                    onUpdateQuantity={(index, change) => {
                      const globalIndex = cart.findIndex((item, i) => 
                        item.billGroup === group && 
                        i === index + cart.filter(item => item.billGroup === group).findIndex((_, idx) => idx === 0)
                      );
                      updateQuantity(globalIndex, change);
                    }}
                    onSetQuantity={(index, quantity) => {
                      const globalIndex = cart.findIndex((item, i) => 
                        item.billGroup === group && 
                        i === index + cart.filter(item => item.billGroup === group).findIndex((_, idx) => idx === 0)
                      );
                      setItemQuantity(globalIndex, quantity);
                    }}
                    onUpdateNote={(index, note) => {
                      const globalIndex = cart.findIndex((item, i) => 
                        item.billGroup === group && 
                        i === index + cart.filter(item => item.billGroup === group).findIndex((_, idx) => idx === 0)
                      );
                      updateNote(globalIndex, note);
                    }}
                    onRemoveItem={(index) => {
                      const globalIndex = cart.findIndex((item, i) => 
                        item.billGroup === group && 
                        i === index + cart.filter(item => item.billGroup === group).findIndex((_, idx) => idx === 0)
                      );
                      removeFromCart(globalIndex);
                    }}
                    onSubmitOrder={submitCurrentGroup}
                    isSubmitting={submitOrder.isPending || isValidatingOrder}
                  />
                  <div className="mt-2">
                    <Button
                      variant="outline"
                      className="w-full text-sm"
                      onClick={submitCurrentGroup}
                      disabled={submitOrder.isPending || isValidatingOrder}
                    >
                      <FileText className="h-4 w-4 mr-1" />
                      Complete Bill #{group}
                    </Button>
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </div>

          <div className="mt-4 pt-4 border-t">
            <Button 
              className="w-full" 
              size="lg"
              onClick={handleOrderSubmit}
              disabled={submitOrder.isPending || isValidatingOrder || cart.length === 0}
            >
              {submitOrder.isPending || isValidatingOrder ? "Processing..." : `Complete All Bills (₹${total.toFixed(2)})`}
            </Button>
          </div>
        </div>
      </div>

      <AlertDialog open={showMissingRecipeAlert} onOpenChange={setShowMissingRecipeAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center">
              <AlertCircle className="h-5 w-5 text-amber-500 mr-2" />
              Missing Recipe Data
            </AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogDescription>
            The following items do not have recipe data defined:
            <ul className="mt-2 list-disc pl-5">
              {missingRecipes.map((item, index) => (
                <li key={index} className="mb-1">{item}</li>
              ))}
            </ul>
            <p className="mt-2">
              Without recipe data, inventory stock will not be automatically reduced.
              Do you want to continue anyway?
            </p>
          </AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              submitOrder.mutate(cart);
            }}>
              Continue Anyway
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default POSContainer;
