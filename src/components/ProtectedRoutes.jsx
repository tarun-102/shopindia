import { useSelector } from "react-redux";
import { Navigate,Outlet } from "react-router-dom";
import Loader from "./ui/Loader"
import { useState } from "react";

const ProtectedRoutes = () => {
    const {user, isAuthReady} = useSelector((state) =>state.auth)

    if(!isAuthReady) {
        return <Loader />
    }
    return user ? <Outlet /> : <Navigate to="/login" ></Navigate>;
}
export default ProtectedRoutes;