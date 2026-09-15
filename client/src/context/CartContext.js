import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import * as cartApi from '../services/cartService';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const [items, setItems] = useState([]);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPrice, setTotalPrice] = useState(0);
  const [loading, setLoading] = useState(false);

  const applyCartData = (data) => {
    setItems(data.items);
    setTotalItems(data.totalItems);
    setTotalPrice(data.totalPrice);
  };

  const refreshCart = useCallback(async () => {
    if (!isAuthenticated) {
      setItems([]);
      setTotalItems(0);
      setTotalPrice(0);
      return;
    }
    setLoading(true);
    try {
      const res = await cartApi.getCart();
      applyCartData(res.data);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    refreshCart();
  }, [refreshCart]);

  const addItem = useCallback(async (productId, quantity = 1) => {
    const res = await cartApi.addToCart(productId, quantity);
    applyCartData(res.data);
  }, []);

  const updateItem = useCallback(async (productId, quantity) => {
    const res = await cartApi.updateCartItem(productId, quantity);
    applyCartData(res.data);
  }, []);

  const removeItem = useCallback(async (productId) => {
    const res = await cartApi.removeFromCart(productId);
    applyCartData(res.data);
  }, []);

  const clear = useCallback(async () => {
    await cartApi.clearCart();
    setItems([]);
    setTotalItems(0);
    setTotalPrice(0);
  }, []);

  return (
    <CartContext.Provider
      value={{ items, totalItems, totalPrice, loading, addItem, updateItem, removeItem, clear, refreshCart }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within a CartProvider');
  return ctx;
}
