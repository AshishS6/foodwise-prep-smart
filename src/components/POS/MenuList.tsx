
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Search, Plus, Pencil } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import EditItemDialog from "./EditItemDialog";

interface MenuListProps {
  onAddToCart: (item: any, isHalf?: boolean, note?: string) => void;
  searchTerm?: string;
  setSearchTerm?: (term: string) => void;
}

const MenuList = ({ onAddToCart, searchTerm = "", setSearchTerm }: MenuListProps) => {
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

  const queryClient = useQueryClient();

  // Fetch menu items
  const { data: menuItems, isLoading, error } = useQuery({
    queryKey: ['menuItems'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('menuitems')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data || [];
    }
  });

  // Handle search input change and update parent component
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setLocalSearch(value);
    
    if (setSearchTerm) {
      setSearchTerm(value);
    }
  };

  // Filter menu items based on search term and category
  const filteredItems = menuItems?.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(localSearch.toLowerCase());
    const matchesCategory = activeCategory === "All Items" || item.category === activeCategory;
    return matchesSearch && matchesCategory;
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

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingItem(null);
  };

  if (error) {
    return <p className="text-destructive">Error loading menu items: {error.message}</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        {/* Search bar */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search menu items..."
            value={localSearch}
            onChange={handleSearchChange}
            className="pl-9 w-full"
          />
        </div>
        <Button onClick={handleAddNewItem} className="shrink-0">
          <Plus className="h-4 w-4 mr-2" />
          Add Item
        </Button>
      </div>

      {/* Category filter */}
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

      {/* Menu items grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <CardContent className="p-0">
                <div className="p-4">
                  <Skeleton className="h-5 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/4" />
                  <div className="mt-4 flex justify-between">
                    <Skeleton className="h-9 w-24" />
                    <Skeleton className="h-9 w-24" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems?.length === 0 ? (
            <p className="col-span-full text-center py-8 text-muted-foreground">
              No menu items found. Try adjusting your search or category.
            </p>
          ) : (
            filteredItems?.map((item) => (
              <Card key={item.id} className="overflow-hidden hover:border-primary/50 transition-colors">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-medium">{item.name}</h3>
                      <p className="text-muted-foreground">₹{item.price.toFixed(2)}</p>
                      <span className="inline-block text-xs bg-gray-100 px-2 py-0.5 rounded-full text-gray-600 mt-1">
                        {item.category}
                      </span>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleEditItem(item)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex justify-between">
                    <Button
                      onClick={() => onAddToCart(item)}
                      className="flex-1 mr-1"
                    >
                      Add
                    </Button>
                    {item.supportshalf && (
                      <Button
                        onClick={() => onAddToCart(item, true)}
                        variant="outline"
                        className="flex-1 ml-1"
                      >
                        Half
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Edit/Add Item Dialog */}
      <EditItemDialog
        isOpen={isDialogOpen}
        onClose={handleCloseDialog}
        item={editingItem}
      />
    </div>
  );
};

export default MenuList;
