import { Outlet } from "react-router-dom";
import Navbar from './Navbar'; 
import Footer from "./Footer";
import { useEffect } from "react";

import { useDispatch, useSelector } from "react-redux"; 
import { auth } from "../../services/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { loginUserRedux, logoutUserRedux } from "../../store/slices/authSlice";
import { saveCartToDB, getCartFromDB } from "../../services/cartService";
import { setCartFromDB, clearCart } from "../../store/slices/cartSlice";

const Layout = () => {
    
    const dispatch = useDispatch();
    const user = useSelector((state) => state.auth.user);
    const cart = useSelector((state) => state.cart); 

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                dispatch(loginUserRedux({
                    uid: currentUser.uid,
                    email: currentUser.email,
                }));
                
                
                const dbCart = await getCartFromDB(currentUser.uid);
                dispatch(setCartFromDB(dbCart));
            } else {
                dispatch(logoutUserRedux());
                dispatch(clearCart());
            }
        });
        return () => unsubscribe();
    }, [dispatch]);

    useEffect(() => {
        if (user && user.uid) {
            saveCartToDB(user.uid, cart);
        }
    }, [cart, user]);

    return(
        <div className="min-h-screen">
            
            <Navbar /> 

            <main className="px-6 mt-8">
                <Outlet />
            </main>
            <Footer />
        </div>
    )
}

export default Layout;