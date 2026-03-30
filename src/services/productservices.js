import { db } from "./firebase"; 
import { collection, addDoc, getDocs, doc, deleteDoc, getDoc, updateDoc ,where,query} from "firebase/firestore";

// ================= PRODUCT FUNCTIONS =================

export const addProductToDB = async (productData) => {
    try {
        const docRef = await addDoc(collection(db, "products"), productData);
        return true;
    } catch (error) {
        console.error("Product add error:", error);
        return false;
    }
};

export const getAllProducts = async () => {
    try {
        const querySnapshot = await getDocs(collection(db, "products"));
        const products = [];
        querySnapshot.forEach((docItem) => {
            products.push({ id: docItem.id, ...docItem.data() }); 
        });
        return products; 
    } catch (error) {
        console.error("Products fetch error:", error); 
        return [];
    }
};

export const deleteProductFromDB = async (productId) => {
    try {
        await deleteDoc(doc(db, "products", productId));
        return true;
    } catch (error) {
        console.error("Product delete error:", error);
        return false;
    }
};

export const getProductById = async ({ params }) => {
    try {
        const docRef = doc(db, "products", params.id);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
            return { id: docSnap.id, ...docSnap.data() };
        } else {
            console.log("Product not found!");
            return null;
        }
    } catch (error) { 
        console.error("Product detail error:", error);
        return null;
    }
};

export const updateProductInDB = async (productId, updatedData) => {
    try {
        const productRef = doc(db, "products", productId);
        await updateDoc(productRef, updatedData);
        return true;
    } catch (error) {
        console.error("Product update error:", error);
        return false;
    }
};

export const getProductsByCategory = async (categoryValue) => {
    try {
        const q = query(collection(db, "products"), where("category", "==", categoryValue));
        const querySnapshot = await getDocs(q);
        const products = [];
        querySnapshot.forEach((docItem) => {
            products.push({ id: docItem.id, ...docItem.data() }); 
        });
        return products; 
    } catch (error) {
        console.error("Category products laane mein error:", error); 
        return [];
    }
};


// ================= ORDER FUNCTIONS =================

// 🔥 NAYA: Cart se order place karne ke liye
export const placeOrderInDB = async (orderData) => {
    try {
        const docRef = await addDoc(collection(db, "orders"), orderData);
        return docRef.id; 
    } catch (error) {
        console.error("Order save karne mein error:", error);
        return null;
    }
};

export const getUserOrders = async (userId) => {
    try {
        const q = query(collection(db, "orders"), where("userId", "==", userId));
        const querySnapshot = await getDocs(q);
        
        const orders = [];
        querySnapshot.forEach((doc) => {
            orders.push({ id: doc.id, ...doc.data() });
        });
        
        // Orders ko latest date ke hisaab se sort karna
        return orders.sort((a, b) => new Date(b.date) - new Date(a.date));
    } catch (error) {
        console.error("Orders fetch karne mein error:", error);
        return [];
    }
};

// 🔥 NAYA: Admin panel ke liye saare orders laane ka function
export const getAllOrders = async () => {
    try {
        const querySnapshot = await getDocs(collection(db, "orders"));
        const orders = [];
        querySnapshot.forEach((docItem) => {
            orders.push({ id: docItem.id, ...docItem.data() });
        });
        return orders.sort((a, b) => new Date(b.date) - new Date(a.date));
    } catch (error) {
        console.error("Orders laane mein error:", error);
        return [];
    }
};

export const cancelOrderInDB = async (orderId) => {
    try {
        const orderRef = doc(db, "orders", orderId);
        await updateDoc(orderRef, {
            status: "Cancelled 🔴"
        });
        return true;
    } catch (error) {
        console.error("Order cancel karne mein error:", error);
        return false;
    }
};

// 🔥 NAYA: Admin panel se order completely delete karne ke liye
export const deleteOrderFromDB = async (orderId) => {
    try {
        await deleteDoc(doc(db, "orders", orderId));
        return true;
    } catch (error) {
        console.error("Order delete karne mein error:", error);
        return false;
    }
};