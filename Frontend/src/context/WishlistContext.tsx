import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export interface WishlistProduct {
  id: string;
  name: string;
  brand: string;
  price: number;
  imageUrl: string;
  sku: string;
  categoryName: string;
  description: string;
}

interface WishlistContextType {
  wishlistItems: WishlistProduct[];
  wishlistCount: number;
  toggleWishlist: (product: WishlistProduct) => void;
  isWishlisted: (productId: string) => boolean;
  removeFromWishlist: (productId: string) => void;
  moveToCart: (product: WishlistProduct) => void;
  _pendingMoveToCart: WishlistProduct | null;
  _clearPendingMoveToCart: () => void;
}

const WishlistContext = createContext<WishlistContextType | null>(null);

const WISHLIST_KEY = 'lvmh_wishlist';

export const WishlistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [wishlistItems, setWishlistItems] = useState<WishlistProduct[]>(() => {
    try {
      const stored = localStorage.getItem(WISHLIST_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Pending cart move — communicated to CartContext via CatalogView
  const [_pendingMoveToCart, setPendingMoveToCart] = useState<WishlistProduct | null>(null);

  // Persist on change
  useEffect(() => {
    localStorage.setItem(WISHLIST_KEY, JSON.stringify(wishlistItems));
  }, [wishlistItems]);

  const isWishlisted = useCallback((productId: string) => {
    return wishlistItems.some(p => p.id === productId);
  }, [wishlistItems]);

  const toggleWishlist = useCallback((product: WishlistProduct) => {
    setWishlistItems(prev => {
      if (prev.some(p => p.id === product.id)) {
        return prev.filter(p => p.id !== product.id);
      }
      return [...prev, product];
    });
  }, []);

  const removeFromWishlist = useCallback((productId: string) => {
    setWishlistItems(prev => prev.filter(p => p.id !== productId));
  }, []);

  const moveToCart = useCallback((product: WishlistProduct) => {
    setPendingMoveToCart(product);
    removeFromWishlist(product.id);
  }, [removeFromWishlist]);

  const _clearPendingMoveToCart = useCallback(() => {
    setPendingMoveToCart(null);
  }, []);

  return (
    <WishlistContext.Provider value={{
      wishlistItems,
      wishlistCount: wishlistItems.length,
      toggleWishlist,
      isWishlisted,
      removeFromWishlist,
      moveToCart,
      _pendingMoveToCart,
      _clearPendingMoveToCart,
    }}>
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) throw new Error('useWishlist must be used within a WishlistProvider');
  return context;
};
