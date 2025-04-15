
import { useState } from "react";
import { CartItem, PortionType } from "@/types";

export const useCart = () => {
  const [cart, setCart] = useState<CartItem[]>([]);

  const addToCart = (item: any, portionType: PortionType, note: string = '') => {
    const itemName = `${item.name} (${portionType.label})`;
    
    const existingItemIndex = cart.findIndex(cartItem => 
      cartItem.menuItemId === item.id && 
      cartItem.portionType.label === portionType.label && 
      cartItem.note === note &&
      cartItem.billGroup === currentBillGroup
    );
    
    if (existingItemIndex !== -1) {
      const updatedCart = [...cart];
      updatedCart[existingItemIndex] = {
        ...updatedCart[existingItemIndex],
        quantity: updatedCart[existingItemIndex].quantity + 1
      };
      setCart(updatedCart);
    } else {
      setCart([...cart, {
        menuItemId: item.id,
        name: itemName,
        price: portionType.price,
        quantity: 1,
        note: note,
        billGroup: currentBillGroup,
        portionType: portionType
      }]);
    }
  };

  const updateQuantity = (index: number, change: number) => {
    const updatedCart = [...cart];
    const newQuantity = Math.max(0, updatedCart[index].quantity + change);
    
    if (newQuantity === 0) {
      updatedCart.splice(index, 1);
    } else {
      updatedCart[index] = { ...updatedCart[index], quantity: newQuantity };
    }
    
    setCart(updatedCart);
  };

  const removeFromCart = (index: number) => {
    const updatedCart = [...cart];
    updatedCart.splice(index, 1);
    setCart(updatedCart);
  };

  const updateNote = (index: number, note: string) => {
    const updatedCart = [...cart];
    updatedCart[index] = { ...updatedCart[index], note };
    setCart(updatedCart);
  };

  const setItemQuantity = (index: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(index);
      return;
    }
    
    const updatedCart = [...cart];
    updatedCart[index] = { ...updatedCart[index], quantity };
    setCart(updatedCart);
  };

  return {
    cart,
    setCart,
    addToCart,
    updateQuantity,
    removeFromCart,
    updateNote,
    setItemQuantity
  };
};
