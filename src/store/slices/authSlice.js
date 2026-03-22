import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    user: null,
    isAuthenticated: false
}

const authSlice = createSlice({
    name: "auth",
    initialState,
    reducers: {
        loginUserRedux: ( state ,action ) => {
            state.user = action.payload;
            state.isAuthenticated = true;
        },
        logoutUserRedux: (state) => {
            state.user = null;
            state.isAuthenticated = false;

        },
    }
})

export const {loginUserRedux, logoutUserRedux} = authSlice.actions
export default authSlice.reducer 