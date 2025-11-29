import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { MobileFriendlyInput } from "@/components/ui/MobileFriendlyInput";
import { ResponsiveGrid } from "@/components/layout/ResponsiveGrid";
import { MobileCard } from "@/components/ui/MobileCard";
import { useDeviceDetection } from "@/hooks/useDeviceDetection";
import { TOUCH_TARGETS } from "@/constants/mobile";
import { PortionType } from "@/types";
import PortionTypeSelector from "./PortionTypeSelector";
import { cn } from "@/lib/utils";

interface MobileMenuListProps {
  onAddToCart: (item: any, portionType: PortionType, note?: string) => void;
  searchTerm?: string;
  setSearchTerm?: (term: string) => void;
}

const MobileMenuList = ({ onAddToCart, searchTerm = "", setSearchTerm }: MobileMenuListProps) => {
  const [categories] = useState([
    "All Items", 
    "Main Course", 
    "Starters", 
    "Desserts", 
    "Beverages"
  ]);
  const [activeCategory, setActiveCategory] = useState("All Items");
  const [localSearch, setLocalSearch] = useState(searchTerm);
  const { isMobile } = useDeviceDetection();

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

  const filteredItems = menuItems?.filter(item => {
    const matchesCategory = activeCategory === "All Items" || item.category === activeCategory;
    const matchesSearch = localSearch === "" || 
      item.name.toLowerCase().includes(localSearch.toLowerCase());
    return matchesCategory && matchesSearch;
  }) || [];

  const handleAddToCart = (item: any, portionType: PortionType) => {
    onAddToCart(item, portionType);
  };

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <MobileFriendlyInput
          type="text"
          inputMode="search"
          placeholder="Search menu items..."
          value={localSearch}
          onChange={(e) => {
            setLocalSearch(e.target.value);
            setSearchTerm?.(e.target.value);
          }}
          className="pl-10"
        />
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      </div>

      {/* Category Navigation - Horizontal Scroll on Mobile */}
      <div className="overflow-x-auto -mx-4 px-4">
        <div className="flex gap-2 min-w-max">
          {categories.map((category) => (
            <Button
              key={category}
              variant={activeCategory === category ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveCategory(category)}
              className={cn(
                "whitespace-nowrap",
                "min-h-[44px]"
              )}
              style={{
                minHeight: `${TOUCH_TARGETS.MINIMUM}px`,
              }}
            >
              {category}
            </Button>
          ))}
        </div>
      </div>

      {/* Menu Items Grid */}
      {isLoading ? (
        <ResponsiveGrid columns={{ mobile: 2, tablet: 3, desktop: 4 }} gap="md">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </ResponsiveGrid>
      ) : error ? (
        <div className="text-center text-destructive py-8">
          Error loading menu items
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="text-center text-muted-foreground py-8">
          No items found
        </div>
      ) : (
        <ResponsiveGrid columns={{ mobile: 2, tablet: 3, desktop: 4 }} gap="md">
          {filteredItems.map((item) => (
            <MobileCard
              key={item.id}
              className="cursor-pointer"
              onClick={() => {
                if (item.portions.length === 1) {
                  handleAddToCart(item, item.portions[0]);
                } else {
                  // Show portion selector
                  // For now, just add with first portion
                  handleAddToCart(item, item.portions[0]);
                }
              }}
            >
              <div className="space-y-2">
                <h3 className="font-semibold text-sm line-clamp-2">{item.name}</h3>
                <p className="text-lg font-bold text-primary">
                  ₹{item.portions[0]?.price?.toFixed(2) || item.price?.toFixed(2) || '0.00'}
                </p>
                {item.portions.length > 1 && (
                  <p className="text-xs text-muted-foreground">
                    {item.portions.length} portion types
                  </p>
                )}
              </div>
            </MobileCard>
          ))}
        </ResponsiveGrid>
      )}
    </div>
  );
};

export default MobileMenuList;

