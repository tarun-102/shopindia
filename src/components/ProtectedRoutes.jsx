import { useSelector } from "react-redux";
import { Navigate, Outlet } from "react-router-dom";
import Loader from "./ui/Loader";

const ProtectedRoutes = ({ requiredRole }) => {
    const { user, role, isAuthReady } = useSelector((state) => state.auth);

    if (!isAuthReady) {
        return <Loader />;
    }

    if (!user) {
        return <Navigate to="/login" />;
    }

    if (requiredRole && role !== requiredRole) {
        return <Navigate to="/" />;
    }

    return <Outlet />;
};

export default ProtectedRoutes;