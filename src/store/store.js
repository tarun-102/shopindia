import { configureStore } from "@reduxjs/toolkit";
import cartSlice from "../store/slices/CartSlice"; 
import authSlice from "../store/slices/authSlice"


const store = configureStore({
  reducer: {
    cart: cartSlice ,
    auth: authSlice,
  },
});

export default store;