import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import * as wishlistApi from '../services/wishlistService';
import { useAuth } from './AuthContext';

const WishlistContext = createContext(null);

export function WishlistProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const refreshWishlist = useCallback(async () => {
    if (!isAuthenticated) {
      setItems([]);
      return;
    }
    setLoading(true);
    try {
      const res = await wishlistApi.getWishlist();
      setItems(res.data.items);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    refreshWishlist();
  }, [refreshWishlist]);

  const isInWishlist = useCallback(
    (productId) => items.some((i) => i.product_id === productId),
    [items]
  );

  const toggle = useCallback(
    async (productId) => {
      if (isInWishlist(productId)) {
        const res = await wishlistApi.removeFromWishlist(productId);
        setItems(res.data.items);
      } else {
        const res = await wishlistApi.addToWishlist(productId);
        setItems(res.data.items);
      }
    },
    [isInWishlist]
  );

  return (
    <WishlistContext.Provider value={{ items, loading, isInWishlist, toggle, refreshWishlist }}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error('useWishlist must be used within a WishlistProvider');
  return ctx;
}
