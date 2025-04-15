import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, BarChart3, AlertCircle, Split, FileText } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuthStore } from "@/stores/authStore";
import { useCart } from "@/hooks/useCart";
import { useBillGroups } from "@/hooks/useBillGroups";
import { useOrderSubmission } from "@/hooks/useOrderSubmission";
import MenuList from "./MenuList";
import OrderList from "./OrderList";
import { CartItem } from "@/types";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TooltipProvider, Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const POSContainer = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { user, userRole } = useAuthStore();
  const [searchTerm, setSearchTerm] = useState<string>("");
  
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
        onSuccess: () => {
          setCart([]);
          setBillGroups([1]);
          setCurrentBillGroup(1);
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
        onSuccess: () => {
          setCart(cart.filter(item => item.billGroup !== currentBillGroup));
          if (billGroups.length > 1) {
            setBillGroups(billGroups.filter(g => g !== currentBillGroup));
            setCurrentBillGroup(billGroups.filter(g => g !== currentBillGroup)[0]);
          } else {
            setCurrentBillGroup(1);
          }
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
          <span className="text-sm text-muted-foreground">👤 {user?.email} | {userRole}</span>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="ml-2" 
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
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <MenuList 
            onAddToCart={addToCart} 
            searchTerm={searchTerm} 
            setSearchTerm={setSearchTerm} 
          />
        </div>

        <div className="bg-muted/30 rounded-lg p-4 border">
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
                    isSubmitting={submitOrder.isLoading || isValidatingOrder}
                  />
                  <div className="mt-2">
                    <Button
                      variant="outline"
                      className="w-full text-sm"
                      onClick={submitCurrentGroup}
                      disabled={submitOrder.isLoading || isValidatingOrder}
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
              disabled={submitOrder.isLoading || isValidatingOrder || cart.length === 0}
            >
              {submitOrder.isLoading || isValidatingOrder ? "Processing..." : `Complete All Bills (₹${total.toFixed(2)})`}
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
            <AlertDialogDescription>
              <div>
                <p>The following items do not have recipe data defined:</p>
                <ul className="mt-2 list-disc pl-5">
                  {missingRecipes.map((item, index) => (
                    <li key={index} className="mb-1">{item}</li>
                  ))}
                </ul>
                <p className="mt-2">
                  Without recipe data, inventory stock will not be automatically reduced.
                  Do you want to continue anyway?
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
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
