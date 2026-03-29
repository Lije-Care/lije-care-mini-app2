import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface CartItem {
  id: number;
  name: string;
  price: number;
  image: string;
  quantity: number;
  color?: string;
}

interface CartState {
  items: CartItem[];
}

const initialState: CartState = {
  items: [],
};
const persistedState = () => {
  try {
    const serializedState = localStorage.getItem("cart");
    if (serializedState === null) return initialState;
    return JSON.parse(serializedState);
  } catch {
    return initialState;
  }
};
const cartSlice = createSlice({
  name: "cart",
  initialState: persistedState(),
  reducers: {
    addToCart: (state, action: PayloadAction<CartItem>) => {
      const existingItem = state.items.find(
        (item: any) => item.id === action.payload.id
      );
      if (existingItem) {
        existingItem.quantity += action.payload.quantity;
      } else {
        state.items.push(action.payload);
      }
    },
    removeFromCart: (state, action: PayloadAction<any>) => {
      state.items = state.items.filter(
        (item: any) => item.id !== action.payload
      );
    },
    updateQuantity: (
      state,
      action: PayloadAction<{ id: string; quantity: number }>
    ) => {
      const item = state.items.find(
        (item: any) => item.id === action.payload.id
      );
      if (item) {
        item.quantity = Math.max(1, action.payload.quantity);
      }
    },
    clearCart: (state) => {
      state.items = [];
      localStorage.removeItem("cart");
    },
  },
});

export const { addToCart, removeFromCart, updateQuantity, clearCart } =
  cartSlice.actions;
export default cartSlice.reducer;
