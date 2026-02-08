import { configureStore } from "@reduxjs/toolkit";
import specialistReducer from "@/redux/slices/specialistSlice";
import parentReducer from "@/redux/slices/itemSlice";
import childReducer from "@/redux/slices/childSlice";
import articlesReducer from "@/redux/slices/articlesSlice";
import notificationReducer from "@/redux/slices/notificationSlice";
import cartReducer from "./slices/cartSlice";
import productReducer from "./slices/productSlice";
import mealReducer from "./slices/mealSlice";

// Load cart state from localStorage if exists
const loadCartState = () => {
  try {
    const serializedState = localStorage.getItem("cart");
    if (serializedState === null) return undefined;
    return JSON.parse(serializedState);
  } catch (err) {
    console.warn("Failed to load cart state from localStorage:", err);
    return undefined;
  }
};
// Load specialists from localStorage
// const loadSpecialistsState = () => {
//   try {
//     const serializedState = localStorage.getItem("specialists");
//     if (!serializedState) return undefined;
//     return JSON.parse(serializedState);
//   } catch (err) {
//     console.warn("Failed to load specialists:", err);
//     return undefined;
//   }
// };

// Save specialists to localStorage
// const saveSpecialistsState = (state: any) => {
//   try {
//     const serializedState = JSON.stringify(state);
//     localStorage.setItem("specialists", serializedState);
//   } catch (err) {
//     console.warn("Failed to save specialists:", err);
//   }
// };

// Save cart state to localStorage
const saveCartState = (state: any) => {
  try {
    const serializedState = JSON.stringify(state);
    localStorage.setItem("cart", serializedState);
  } catch (err) {
    console.warn("Failed to save cart state to localStorage:", err);
  }
};

const preloadedCartState = loadCartState();
// const preloadedSpecialistsState = loadSpecialistsState();

export const store = configureStore({
  reducer: {
    parent: parentReducer,
    children: childReducer,
    articles: articlesReducer,
    cart: cartReducer,
    specialists: specialistReducer,
    notificartions: notificationReducer,
    products: productReducer,
    meals: mealReducer,
  },
  // Inject persisted cart state into preloadedState
  preloadedState: {
    cart: preloadedCartState,
    // specialists: preloadedSpecialistsState,
  },
});

// Subscribe to store changes to save cart slice on update
store.subscribe(() => {
  const state = store.getState(); // ← NOW state exists

  saveCartState(state.cart);
  // saveSpecialistsState(state.specialists); // ← works now
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
