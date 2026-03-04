import React, { createContext, useReducer, useMemo, useEffect  } from "react";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const CartContext = createContext();

const CART_ACTIONS = {
  ADD_ITEM: "ADD_ITEM",
  REMOVE_ITEM: "REMOVE_ITEM",
  UPDATE_QUANTITY: "UPDATE_QUANTITY",
  CLEAR_CART: "CLEAR_CART",
  SET_CART: "SET_CART",
};

// state = array item: { id, name, price, imageUrl, quantity }
const cartReducer = (state, action) => {
  switch (action.type) {
    case CART_ACTIONS.SET_CART: {
      return Array.isArray(action.payload) ? action.payload : [];
    }

    case CART_ACTIONS.ADD_ITEM: {
      const { product, quantity } = action.payload;
      const existing = state.find((item) => item.id === product.id);

      if (existing) {
        // if item already in cart → plus quantity
        return state.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }

      return [
        ...state,
        {
          id: product.id,
          name: product.name,
          price: product.price,
          imageUrl: product.imageUrl || null,
          quantity,
        },
      ];
    }

    case CART_ACTIONS.REMOVE_ITEM: {
      const id = action.payload;
      return state.filter((item) => item.id !== id);
    }

    case CART_ACTIONS.UPDATE_QUANTITY: {
      const { id, quantity } = action.payload;
      if (quantity <= 0) {
        return state.filter((item) => item.id !== id);
      }
      return state.map((item) =>
        item.id === id ? { ...item, quantity } : item
      );
    }

    case CART_ACTIONS.CLEAR_CART:
      return [];

    default:
      return state;
  }
};

const STORAGE_KEY = "cart_items_v1";
// read storage
const readCartStorage = async () => {
  try {
    if (Platform.OS === "web") {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    }
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.log("readCartStorage error:", e);
    return [];
  }
};

// write storage
const writeCartStorage = async (cartItems) => {
  try {
    const raw = JSON.stringify(cartItems);
    if (Platform.OS === "web") {
      window.localStorage.setItem(STORAGE_KEY, raw);
      return;
    }
    await AsyncStorage.setItem(STORAGE_KEY, raw);
  } catch (e) {
    console.log("writeCartStorage error:", e);
  }
};

export const CartProvider = ({ children }) => {
  const [cartItems, dispatch] = useReducer(cartReducer, []);

  // Load cart once when app starts
  useEffect(() => {
    (async () => {
      const saved = await readCartStorage();
      dispatch({ type: CART_ACTIONS.SET_CART, payload: saved });
    })();
  }, []);

  // Save cart whenever it changes
  useEffect(() => {
    writeCartStorage(cartItems);
  }, [cartItems]);

  // helper functions
  const addToCart = (product, quantity = 1) => {
    dispatch({
      type: CART_ACTIONS.ADD_ITEM,
      payload: { product, quantity },
    });
  };

  const removeFromCart = (id) => {
    dispatch({ type: CART_ACTIONS.REMOVE_ITEM, payload: id });
  };

  const updateQuantity = (id, quantity) => {
    dispatch({
      type: CART_ACTIONS.UPDATE_QUANTITY,
      payload: { id, quantity },
    });
  };

  const clearCart = () => {
    dispatch({ type: CART_ACTIONS.CLEAR_CART });
  };

  // total quantity + total price
  const { totalItems, totalPrice } = useMemo(() => {
    let items = 0;
    let price = 0;
    cartItems.forEach((item) => {
      items += item.quantity;
      price += item.quantity * item.price;
    });
    return { totalItems: items, totalPrice: price };
  }, [cartItems]);

  const value = {
    cartItems,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    totalItems,
    totalPrice,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};
