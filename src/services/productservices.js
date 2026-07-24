import { db } from "./firebase";
import { collection, addDoc, getDocs, doc, deleteDoc, getDoc, updateDoc, where, query, onSnapshot } from "firebase/firestore";

// ----------------------------------------------------------------------
// Product Management Services
// ----------------------------------------------------------------------

export const addProductToDB = async (productData) => {
    try {
        await addDoc(collection(db, "products"), productData);
        return true;
    } catch (error) {
        console.error("Error adding product:", error);
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
            console.warn(`Error fetching products from collection '${name}':`, error);
        }
    }

    // Fallback block
    try {
        const querySnapshot = await getDocs(collection(db, "products"));
        const products = [];
        querySnapshot.forEach((docItem) => {
            products.push({ id: docItem.id, ...docItem.data() }); 
        });
        return products; 
    } catch (error) {
        console.error("Failed to fetch products:", error); 
        return [];
    }
};

/**
 * Calculates and fetches the top selling products based on actual order history.
 * Scans the orders collection, counts item frequencies, and retrieves product details.
 */
export const getTopSellingProducts = async () => {
    try {
        const ordersSnapshot = await getDocs(collection(db, "orders"));
        const salesFrequency = {};

        // Aggregate purchased quantities per product ID
        ordersSnapshot.forEach((docItem) => {
            const orderData = docItem.data();
            if (orderData.items && Array.isArray(orderData.items)) {
                orderData.items.forEach((item) => {
                    if (item.id) {
                        salesFrequency[item.id] = (salesFrequency[item.id] || 0) + (item.quantity || 1);
                    }
                });
            }
        });

        // Sort product IDs by highest sales frequency
        const sortedProductIds = Object.keys(salesFrequency)
            .sort((a, b) => salesFrequency[b] - salesFrequency[a])
            .slice(0, 4); // Fetch top 4

        const topProducts = [];
        for (const id of sortedProductIds) {
            const productRef = doc(db, "products", id);
            const productSnap = await getDoc(productRef);
            if (productSnap.exists()) {
                topProducts.push({ id: productSnap.id, ...productSnap.data() });
            }
        }

        return topProducts;
    } catch (error) {
        console.error("Failed to calculate top selling products:", error);
        return [];
    }
};

export const deleteProductFromDB = async (productId) => {
    try {
        await deleteDoc(doc(db, "products", productId));
        return true;
    } catch (error) {
        console.error("Error deleting product:", error);
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
            console.warn("Product document not found.");
            return null;
        }
    } catch (error) { 
        console.error("Error fetching product details:", error);
        return null;
    }
};

export const updateProductInDB = async (productId, updatedData) => {
    try {
        const productRef = doc(db, "products", productId);
        await updateDoc(productRef, updatedData);
        return true;
    } catch (error) {
        console.error("Error updating product:", error);
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
            console.warn(`Error fetching category products from '${name}':`, error);
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
        console.error("Error executing category query:", error);
        return [];
    }
};

// ----------------------------------------------------------------------
// Order Management Services
// ----------------------------------------------------------------------

export const placeOrderInDB = async (orderData) => {
    try {
        const finalOrderData = {
            ...orderData,
            status: "Pending", 
            date: orderData.date || new Date().toISOString()
        };
        const docRef = await addDoc(collection(db, "orders"), finalOrderData);
        return docRef.id; 
    } catch (error) {
        console.error("Error creating order document:", error);
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
        console.error("Error fetching user orders:", error);
        return [];
    }
};

export const getAllOrders = async (userId) => {
    if (!userId) {
        throw new Error("Authentication required for admin order fetch.");
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
        console.error("Error fetching all orders:", error);
        throw error;
    }
};

export const getDeliveryOrders = async (deliveryBoyId) => {
    if (!deliveryBoyId) {
        throw new Error("Delivery personnel ID required.");
    }

    try {
        const querySnapshot = await getDocs(collection(db, "orders"));
        const orders = [];
        querySnapshot.forEach((docItem) => {
            const data = docItem.data();
            orders.push({ id: docItem.id, ...data });
        });

        return orders.sort((a, b) => {
            const aTime = new Date(a.date).getTime();
            const bTime = new Date(b.date).getTime();
            if (isNaN(aTime) || isNaN(bTime)) return 0;
            return bTime - aTime;
        });
    } catch (error) {
        console.error("Error fetching delivery orders:", error);
        throw error;
    }
};

export const subscribeDeliveryOrders = (deliveryBoyId, onUpdate, onError) => {
    if (!deliveryBoyId) {
        throw new Error("Delivery personnel ID required for subscription.");
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
            console.error("Order subscription failed:", error);
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
            return { success: false, error: "Order record not found." };
        }
        const orderData = orderSnap.data();
        
        if (orderData.assignedTo && orderData.assignedTo !== deliveryBoyId) {
            return { success: false, error: "Order is already assigned." };
        }
        
        await updateDoc(orderRef, {
            status: "Out for Delivery",
            assignedTo: deliveryBoyId,
        });
        return { success: true };
    } catch (error) {
        console.error("Error assigning order:", error);
        return { success: false, error: error.message || "Failed to process assignment." };
    }
};

export const cancelOrderInDB = async (orderId, { userId, isAdmin = false } = {}) => {
    try {
        const orderRef = doc(db, "orders", orderId);

        if (!isAdmin) {
            const orderSnap = await getDoc(orderRef);
            if (!orderSnap.exists()) {
                return { success: false, error: "Order record not found." };
            }

            const orderData = orderSnap.data();
            const orderTime = new Date(orderData.date).getTime();
            const elapsedMs = Date.now() - orderTime;

            if (orderData.userId !== userId) {
                return { success: false, error: "Unauthorized cancellation request." };
            }
            if (orderData.status !== "Pending") {
                return { success: false, error: "Only pending orders can be cancelled." };
            }
            if (isNaN(orderTime) || elapsedMs > 60000) {
                return { success: false, error: "Cancellation window has expired." };
            }
        }

        await updateDoc(orderRef, {
            status: "Cancelled"
        });
        return { success: true };
    } catch (error) {
        console.error("Error cancelling order:", error);
        return { success: false, error: error.message || "Failed to cancel order." };
    }
};

export const updateOrderStatusInDB = async (orderId, status) => {
    try {
        const orderRef = doc(db, "orders", orderId);
        await updateDoc(orderRef, { status });
        return true;
    } catch (error) {
        console.error("Error updating order status:", error);
        return false;
    }
};

export const deleteOrderFromDB = async (orderId) => {
    try {
        await deleteDoc(doc(db, "orders", orderId));
        return true;
    } catch (error) {
        console.error("Error deleting order:", error);
        return false;
    }
};