import { useSelector } from "react-redux";
import { Navigate,Outlet } from "react-router-dom";


const ProtectedRoutes = () => {
    const user = useSelector((state) =>state.auth.user)
    
    if(!user) {
        return <Navigate to="/login" replace ></Navigate>
    }
    return<Outlet />
}

export default ProtectedRoutes;