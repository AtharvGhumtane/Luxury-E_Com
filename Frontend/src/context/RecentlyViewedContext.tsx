import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { type WishlistProduct } from './WishlistContext';

// Reuse WishlistProduct shape since they share the same product fields
export type RecentProduct = WishlistProduct;

interface RecentlyViewedContextType {
  recentlyViewed: RecentProduct[];
  addRecentlyViewed: (product: RecentProduct) => void;
}

const RecentlyViewedContext = createContext<RecentlyViewedContextType | null>(null);

const RECENT_KEY = 'lvmh_recently_viewed';
const MAX_RECENT = 6;

export const RecentlyViewedProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [recentlyViewed, setRecentlyViewed] = useState<RecentProduct[]>(() => {
    try {
      const stored = localStorage.getItem(RECENT_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(RECENT_KEY, JSON.stringify(recentlyViewed));
  }, [recentlyViewed]);

  const addRecentlyViewed = useCallback((product: RecentProduct) => {
    setRecentlyViewed(prev => {
      // Move to front if already exists, otherwise prepend and cap at MAX_RECENT
      const filtered = prev.filter(p => p.id !== product.id);
      return [product, ...filtered].slice(0, MAX_RECENT);
    });
  }, []);

  return (
    <RecentlyViewedContext.Provider value={{ recentlyViewed, addRecentlyViewed }}>
      {children}
    </RecentlyViewedContext.Provider>
  );
};

export const useRecentlyViewed = () => {
  const context = useContext(RecentlyViewedContext);
  if (!context) throw new Error('useRecentlyViewed must be used within a RecentlyViewedProvider');
  return context;
};
