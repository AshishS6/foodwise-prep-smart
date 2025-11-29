
import { useState } from "react";

export const useBillGroups = () => {
  const [currentBillGroup, setCurrentBillGroup] = useState<number>(1);
  const [billGroups, setBillGroups] = useState<number[]>([1]);

  const addBillGroup = () => {
    const newGroup = Math.max(...billGroups) + 1;
    setBillGroups([...billGroups, newGroup]);
    setCurrentBillGroup(newGroup);
    return newGroup;
  };

  const deleteBillGroup = (groupToDelete: number, cart: any[], setCart: (cart: any[]) => void) => {
    if (billGroups.length <= 1) return;
    
    const updatedCart = cart.filter(item => item.billGroup !== groupToDelete);
    setCart(updatedCart);
    
    const updatedGroups = billGroups.filter(g => g !== groupToDelete);
    setBillGroups(updatedGroups);
    
    setCurrentBillGroup(updatedGroups[0]);
  };

  return {
    currentBillGroup,
    setCurrentBillGroup,
    billGroups,
    setBillGroups,
    addBillGroup,
    deleteBillGroup
  };
};
