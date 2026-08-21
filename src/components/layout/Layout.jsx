import { Outlet } from "react-router-dom";
import Navbar from './Navbar';
import Footer from "./Footer";
import { useEffect, useState } from "react";

import { useDispatch, useSelector } from "react-redux";
import { auth, db } from "../../services/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";
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

                // Fetch full user document including wallet
                let userWallet = { balance: 0, lastMonthlyCredit: null };
                try {
                    const userDocRef = doc(db, "users", currentUser.uid);
                    const userDocSnapFull = await getDoc(userDocRef);
                    if (userDocSnapFull.exists()) {
                        const userData = userDocSnapFull.data();
                        userWallet = userData.wallet || userWallet;

                        // Monthly credit logic: credit once per calendar month when user logs in
                        const now = new Date();
                        const year = now.getFullYear();
                        const month = String(now.getMonth() + 1).padStart(2, "0");
                        const monthKey = `${year}-${month}`;
                        const dayOfMonth = now.getDate();

                        if (userWallet.lastMonthlyCredit !== monthKey && dayOfMonth >= 1) {
                            const newBalance = (userWallet.balance || 0) + 500;
                            try {
                                await updateDoc(userDocRef, {
                                    "wallet.balance": newBalance,
                                    "wallet.lastMonthlyCredit": monthKey,
                                });
                                userWallet.balance = newBalance;
                                userWallet.lastMonthlyCredit = monthKey;
                            } catch (err) {
                                console.error("Failed to apply monthly wallet credit:", err);
                            }
                        }
                    }
                } catch (err) {
                    console.error("User document fetch error:", err);
                }

                dispatch(loginUserRedux({
                    uid: currentUser.uid,
                    email: currentUser.email,
                    role: userRole,
                    wallet: userWallet,
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
        // FIX: Added light mode classes (bg-gray-50 text-gray-900) and dark mode classes (dark:bg-[#0a0f16] dark:text-gray-100)
        <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-[#0a0f16] text-gray-900 dark:text-gray-100 font-sans selection:bg-emerald-500/30 selection:text-emerald-900 dark:selection:text-emerald-100 transition-colors duration-500">
            
            <Navbar />

            {/* Added flex-grow so footer stays at bottom, and made container responsive */}
            <main className="flex-grow w-full max-w-screen-2xl mx-auto px-3 sm:px-6 lg:px-8 pt-5 md:pt-8 pb-24 md:pb-12 transition-all duration-300">
                <Outlet />
            </main>
            
            <Footer />
        </div>
    )
}

export default Layout;