import { configureStore } from "@reduxjs/toolkit";
import cartSlice from "./CartSlice";

const store = sessionStorage({
    reducer: {
        cart: cartSlice.reducer,
    }
})

export default store;