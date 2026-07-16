import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { apiClient } from '../api/client';

export interface CartItemType {
  productId: string;
  productName: string;
  productSku: string;
  quantity: number;
  unitPrice: number;
}

interface CartContextType {
  items: CartItemType[];
  totalAmount: number;
  itemCount: number;
  loading: boolean;
  addToCart: (item: Omit<CartItemType, 'quantity'>, quantity: number) => Promise<void>;
  updateQuantity: (productId: string, quantity: number) => Promise<void>;
  removeFromCart: (productId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  fetchCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | null>(null);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [items, setItems] = useState<CartItemType[]>([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [itemCount, setItemCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchCart = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    try {
      const response = await apiClient.get('/api/cart');
      const data = response.data;
      setItems(data.items || []);
      setTotalAmount(data.totalAmount || 0);
      setItemCount(data.itemCount || 0);
    } catch (error) {
      console.error('Error fetching cart:', error);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  // Sync cart automatically on auth state changes
  useEffect(() => {
    if (isAuthenticated) {
      fetchCart();
    } else {
      setItems([]);
      setTotalAmount(0);
      setItemCount(0);
    }
  }, [isAuthenticated, fetchCart]);

  const addToCart = async (item: Omit<CartItemType, 'quantity'>, quantity: number) => {
    if (!isAuthenticated) {
      throw new Error('Please login to add items to your cart.');
    }
    try {
      const response = await apiClient.post('/api/cart/items', {
        ...item,
        quantity,
      });
      const data = response.data;
      setItems(data.items || []);
      setTotalAmount(data.totalAmount || 0);
      setItemCount(data.itemCount || 0);
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to add item to cart.');
    }
  };

  const updateQuantity = async (productId: string, quantity: number) => {
    if (!isAuthenticated) return;
    if (quantity <= 0) {
      await removeFromCart(productId);
      return;
    }
    try {
      const response = await apiClient.put(`/api/cart/items/${productId}?quantity=${quantity}`);
      const data = response.data;
      setItems(data.items || []);
      setTotalAmount(data.totalAmount || 0);
      setItemCount(data.itemCount || 0);
    } catch (error) {
      console.error('Error updating quantity:', error);
    }
  };

  const removeFromCart = async (productId: string) => {
    if (!isAuthenticated) return;
    try {
      const response = await apiClient.delete(`/api/cart/items/${productId}`);
      const data = response.data;
      setItems(data.items || []);
      setTotalAmount(data.totalAmount || 0);
      setItemCount(data.itemCount || 0);
    } catch (error) {
      console.error('Error removing item from cart:', error);
    }
  };

  const clearCart = async () => {
    if (!isAuthenticated) return;
    try {
      await apiClient.delete('/api/cart');
      setItems([]);
      setTotalAmount(0);
      setItemCount(0);
    } catch (error) {
      console.error('Error clearing cart:', error);
    }
  };

  return (
    <CartContext.Provider
      value={{
        items,
        totalAmount,
        itemCount,
        loading,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        fetchCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
