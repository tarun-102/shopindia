import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    user: null,
    role: null,
    isAuthenticated: false,
    isAuthReady: false,
}

const authSlice = createSlice({
    name: "auth",
    initialState,
    reducers: {
        loginUserRedux: ( state ,action ) => {
            state.user = action.payload;
            state.role = action.payload.role || "customer";
            state.isAuthenticated = true;
            state.isAuthReady = true;
        },
        logoutUserRedux: (state) => {
            state.user = null;
            state.role = null;
            state.isAuthenticated = false;
            state.isAuthReady = true;
        },
    }
})

export const {loginUserRedux, logoutUserRedux} = authSlice.actions
export default authSlice.reducer 