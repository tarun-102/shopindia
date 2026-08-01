import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, updateProfile } from 'firebase/auth';
import { doc, setDoc, getDoc, collection, getDocs } from 'firebase/firestore';
import { auth, db } from '../firebase'; 

// ----------------------------------------------------------------------
// Authentication Services
// ----------------------------------------------------------------------

export const registerUser = async (fullName, email, password) => {
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        await updateProfile(user, {
            displayName: fullName
        });
        // Initialize wallet with ₹500 welcome credit and record the month
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, "0");
        const monthKey = `${year}-${month}`;

        await setDoc(doc(db, "users", user.uid), {
            uid: user.uid,
            fullName: fullName,
            email: email,
            role: "customer",
            createdAt: new Date().toISOString(),
            wallet: {
                balance: 500,
                lastMonthlyCredit: monthKey
            }
        });
        
        return { success: true, user }; 
    } catch(error) {
        return { success: false, error: error.message };
    }
}

export const loginUser = async (email, password) => {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        const userDocRef = doc(db, "users", user.uid);
        const userDocSnap = await getDoc(userDocRef);

        let userRole = "customer";

        if (userDocSnap.exists()) {
            userRole = userDocSnap.data().role; 
        }
        
        return { success: true, user: user, role: userRole };
    } catch (error) {
        return { success: false, error: "Invalid Email or Password" };
    }
}

export const logoutUser = async () => {
    try {
        await signOut(auth);
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// ----------------------------------------------------------------------
// User Management Services (Admin)
// ----------------------------------------------------------------------

/**
 * Fetches all registered users for the admin dashboard.
 * @returns {Array} Array of user objects.
 */
export const getAllUsers = async () => {
    try {
        const querySnapshot = await getDocs(collection(db, "users"));
        const users = [];
        querySnapshot.forEach((docItem) => {
            users.push({ id: docItem.id, ...docItem.data() });
        });
        return users;
    } catch (error) {
        console.error("Error fetching users collection:", error);
        return [];
    }
};