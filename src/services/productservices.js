import { db } from "./firebase"; 
import { collection, addDoc, getDocs, doc, deleteDoc, getDoc, updateDoc, where, query, orderBy, onSnapshot } from "firebase/firestore";

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
    const collectionNames = ["products", "Products", "product", "Product"];

    for (const name of collectionNames) {
        try {
            const querySnapshot = await getDocs(collection(db, name));
            const products = [];
            querySnapshot.forEach((docItem) => {
                products.push({ id: docItem.id, ...docItem.data() });
            });
            if (products.length > 0) {
                return products;
            }
        } catch (error) {
            console.warn(`Products fetch error for collection '${name}':`, error);
        }
    }

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
    const collectionNames = ["products", "Products"];
    for (const name of collectionNames) {
        try {
            const q = query(collection(db, name), where("category", "==", categoryValue));
            const querySnapshot = await getDocs(q);
            const products = [];
            querySnapshot.forEach((docItem) => {
                products.push({ id: docItem.id, ...docItem.data() });
            });
            if (products.length > 0) {
                return products;
            }
        } catch (error) {
            console.warn(`Category products fetch error for collection '${name}':`, error);
        }
    }

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

export const placeOrderInDB = async (orderData) => {
    try {
        const finalOrderData = {
            ...orderData,
            status: "Pending ⏳", 
            date: orderData.date || new Date().toISOString()
        };
        const docRef = await addDoc(collection(db, "orders"), finalOrderData);
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
        
        return orders.sort((a, b) => new Date(b.date) - new Date(a.date));
    } catch (error) {
        console.error("Orders fetch karne mein error:", error);
        return [];
    }
};

export const getAllOrders = async (userId) => {
    if (!userId) {
        throw new Error("Admin order fetch requires authenticated user ID");
    }

    try {
        const querySnapshot = await getDocs(collection(db, "orders"));
        const orders = [];
        querySnapshot.forEach((docItem) => {
            orders.push({ id: docItem.id, ...docItem.data() });
        });
        return orders.sort((a, b) => {
            const aTime = new Date(a.date).getTime();
            const bTime = new Date(b.date).getTime();
            if (isNaN(aTime) || isNaN(bTime)) return 0;
            return bTime - aTime;
        });
    } catch (error) {
        console.error("Orders fetch error:", error);
        throw error;
    }
};

export const getDeliveryOrders = async (deliveryBoyId) => {
    if (!deliveryBoyId) {
        throw new Error("Delivery boy ID required to fetch delivery orders.");
    }

    try {
        const querySnapshot = await getDocs(collection(db, "orders"));
        const orders = [];
        querySnapshot.forEach((docItem) => {
            const data = docItem.data();
            // Delivery boy ko saare orders dikhenge jo ya toh unke assigned hain ya available hain
            orders.push({ id: docItem.id, ...data });
        });

        return orders.sort((a, b) => {
            const aTime = new Date(a.date).getTime();
            const bTime = new Date(b.date).getTime();
            if (isNaN(aTime) || isNaN(bTime)) return 0;
            return bTime - aTime;
        });
    } catch (error) {
        console.error("Delivery orders fetch error:", error);
        throw error;
    }
};

// 🔥 Simplified real-time listener jo bina query failure ke saare orders sync karega
export const subscribeDeliveryOrders = (deliveryBoyId, onUpdate, onError) => {
    if (!deliveryBoyId) {
        throw new Error("Delivery boy ID required to subscribe to delivery orders.");
    }

    const unsubscribe = onSnapshot(
        collection(db, "orders"),
        (snapshot) => {
            const ordersList = [];
            snapshot.forEach((docItem) => {
                ordersList.push({ id: docItem.id, ...docItem.data() });
            });

            ordersList.sort((a, b) => {
                const aTime = new Date(a.date).getTime();
                const bTime = new Date(b.date).getTime();
                if (isNaN(aTime) || isNaN(bTime)) return 0;
                return bTime - aTime;
            });

            onUpdate(ordersList);
        },
        (error) => {
            console.error("Orders subscription failed:", error);
            if (onError) onError(error);
        }
    );

    return () => unsubscribe();
};

export const assignOrderToDeliveryBoy = async (orderId, deliveryBoyId) => {
    try {
        const orderRef = doc(db, "orders", orderId);
        const orderSnap = await getDoc(orderRef);
        if (!orderSnap.exists()) {
            return { success: false, error: "Order not found." };
        }
        const orderData = orderSnap.data();
        
        if (orderData.assignedTo && orderData.assignedTo !== deliveryBoyId) {
            return { success: false, error: "This order has already been assigned." };
        }
        
        await updateDoc(orderRef, {
            status: "Out for Delivery 🚚",
            assignedTo: deliveryBoyId,
        });
        return { success: true };
    } catch (error) {
        console.error("Order assignment error:", error);
        return { success: false, error: error.message || "Unable to request delivery." };
    }
};

export const cancelOrderInDB = async (orderId, { userId, isAdmin = false } = {}) => {
    try {
        const orderRef = doc(db, "orders", orderId);

        if (!isAdmin) {
            const orderSnap = await getDoc(orderRef);
            if (!orderSnap.exists()) {
                return { success: false, error: "Order not found." };
            }

            const orderData = orderSnap.data();
            const orderTime = new Date(orderData.date).getTime();
            const elapsedMs = Date.now() - orderTime;

            if (orderData.userId !== userId) {
                return { success: false, error: "You can only cancel your own orders." };
            }
            if (orderData.status !== "Pending ⏳" && orderData.status !== "Pending") {
                return { success: false, error: "Only pending orders can be cancelled within 1 minute." };
            }
            if (isNaN(orderTime) || elapsedMs > 60000) {
                return { success: false, error: "Order cancellation window has expired." };
            }
        }

        await updateDoc(orderRef, {
            status: "Cancelled 🔴"
        });
        return { success: true };
    } catch (error) {
        console.error("Order cancel karne mein error:", error);
        return { success: false, error: error.message || "Unable to cancel order." };
    }
};

export const updateOrderStatusInDB = async (orderId, status) => {
    try {
        const orderRef = doc(db, "orders", orderId);
        await updateDoc(orderRef, { status });
        return true;
    } catch (error) {
        console.error("Order status update error:", error);
        return false;
    }
};

export const deleteOrderFromDB = async (orderId) => {
    try {
        await deleteDoc(doc(db, "orders", orderId));
        return true;
    } catch (error) {
        console.error("Order delete karne mein error:", error);
        return false;
    }
};