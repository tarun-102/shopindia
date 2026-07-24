import { Outlet } from "react-router-dom";
import Navbar from './Navbar';
import Footer from "./Footer";
import { useEffect, useState } from "react";

import { useDispatch, useSelector } from "react-redux";
import { auth, db } from "../../services/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { loginUserRedux, logoutUserRedux } from "../../store/slices/authSlice";
import { saveCartToDB, getCartFromDB } from "../../services/cartService";
import { setCartFromDB, clearCart } from "../../store/slices/CartSlice";

const Layout = () => {
    const dispatch = useDispatch();
    const user = useSelector((state) => state.auth.user);
    const cart = useSelector((state) => state.cart);
    const [isCartLoading, setIsCartLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                let userRole = "customer";
                try {
                    const userDocRef = doc(db, "users", currentUser.uid);
                    const userDocSnap = await getDoc(userDocRef);
                    if (userDocSnap.exists()) {
                        userRole = userDocSnap.data().role || "customer";
                    }
                } catch (error) {
                    console.error("User role fetch error:", error);
                }

                dispatch(loginUserRedux({
                    uid: currentUser.uid,
                    email: currentUser.email,
                    role: userRole,
                }));

                const dbCart = await getCartFromDB(currentUser.uid);
                dispatch(setCartFromDB(dbCart));
                setIsCartLoading(false);
            } else {
                dispatch(logoutUserRedux());
                dispatch(clearCart());
                setIsCartLoading(false);
            }
        });
        return () => unsubscribe();
    }, [dispatch]);

    useEffect(() => {
        if (user && user.uid && !isCartLoading) {
            saveCartToDB(user.uid, cart);
        }
    }, [cart, user, isCartLoading]);

    return (
       
        <div className="min-h-screen flex flex-col bg-[#0a0f16] text-gray-100 font-sans selection:bg-emerald-500/30">
            
            <Navbar />

            {/* Added flex-grow so footer stays at bottom, and made container responsive */}
            <main className="flex-grow w-full max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-12 transition-all duration-300">
                <Outlet />
            </main>
            
            <Footer />
        </div>
    )
}

export default Layout;