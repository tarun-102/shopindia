import { configureStore } from "@reduxjs/toolkit";
import cartSlice from "./slices/CartSlice"; 
import authSlice from "./slices/authSlice";


const store = configureStore({
  reducer: {
    cart: cartSlice ,
    auth: authSlice,
  },
});

export default store;