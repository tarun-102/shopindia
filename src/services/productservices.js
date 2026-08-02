import { db } from "./firebase";
import { collection, addDoc, getDocs, doc, deleteDoc, getDoc, updateDoc, where, query, onSnapshot, runTransaction } from "firebase/firestore";

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

export const getTopSellingProducts = async () => {
    try {
        const ordersSnapshot = await getDocs(collection(db, "orders"));
        const salesFrequency = {};

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

        const sortedProductIds = Object.keys(salesFrequency)
            .sort((a, b) => salesFrequency[b] - salesFrequency[a])
            .slice(0, 4); 

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
        if (error && error.code === 'permission-denied') {
            return [];
        }
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

export const updateProductStock = async (productId, newStock) => {
    try {
        const productRef = doc(db, "products", productId);
        await updateDoc(productRef, { stock: Number(newStock) });
        return { success: true };
    } catch (error) {
        console.error("Error updating product stock:", error);
        return { success: false, error: error.message };
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
            assignedTo: null, 
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
        return [];
    }
};

export const getDeliveryOrders = async (deliveryBoyId) => {
    if (!deliveryBoyId) {
        throw new Error("Delivery personnel ID required.");
    }

    try {
        const allowedStatuses = ['Pending', 'Pending ⏳', 'Assigning Delivery Partner 🟡', 'Order Confirmed 🟢', 'Out for Delivery 🚚'];
        
        const qStatuses = query(collection(db, "orders"), where("status", "in", allowedStatuses));
        const qAssigned = query(collection(db, "orders"), where("assignedTo", "==", deliveryBoyId));

        const [statusSnap, assignedSnap] = await Promise.all([
            getDocs(qStatuses),
            getDocs(qAssigned)
        ]);

        const combined = {};
        
        statusSnap.forEach((docItem) => {
            combined[docItem.id] = { id: docItem.id, ...docItem.data() };
        });
        assignedSnap.forEach((docItem) => {
            combined[docItem.id] = { id: docItem.id, ...docItem.data() };
        });

        const orders = Object.values(combined);

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

    const allowedStatuses = ['Pending', 'Pending ⏳', 'Assigning Delivery Partner 🟡', 'Order Confirmed 🟢', 'Out for Delivery 🚚'];

    const qStatuses = query(collection(db, "orders"), where("status", "in", allowedStatuses));
    const qAssigned = query(collection(db, "orders"), where("assignedTo", "==", deliveryBoyId));

    const snapResults = { statuses: [], assigned: [] };

    const processAndEmit = () => {
        const combined = {};
        for (const item of [...snapResults.statuses, ...snapResults.assigned]) {
            combined[item.id] = item;
        }
        const ordersList = Object.values(combined);
        ordersList.sort((a, b) => {
            const aTime = new Date(a.date).getTime();
            const bTime = new Date(b.date).getTime();
            if (isNaN(aTime) || isNaN(bTime)) return 0;
            return bTime - aTime;
        });
        onUpdate(ordersList);
    };

    const unsub1 = onSnapshot(
        qStatuses,
        (snapshot) => {
            const list = [];
            snapshot.forEach((docItem) => list.push({ id: docItem.id, ...docItem.data() }));
            snapResults.statuses = list;
            processAndEmit();
        },
        (error) => {
            console.error("Order subscription (statuses) failed:", error);
            if (onError) onError(error);
        }
    );

    const unsub2 = onSnapshot(
        qAssigned,
        (snapshot) => {
            const list = [];
            snapshot.forEach((docItem) => list.push({ id: docItem.id, ...docItem.data() }));
            snapResults.assigned = list;
            processAndEmit();
        },
        (error) => {
            console.error("Order subscription (assigned) failed:", error);
            if (onError) onError(error);
        }
    );

    return () => {
        try { unsub1(); } catch (e) {}
        try { unsub2(); } catch (e) {}
    };
};

export const assignOrderToDeliveryBoy = async (orderId, deliveryBoyId) => {
    try {
        const orderRef = doc(db, "orders", orderId);

        const otp = String(Math.floor(1000 + Math.random() * 9000));

        await runTransaction(db, async (transaction) => {
            const orderSnap = await transaction.get(orderRef);
            if (!orderSnap.exists()) {
                throw new Error("Order record not found.");
            }

            const orderData = orderSnap.data();
            if (orderData.assignedTo && orderData.assignedTo !== deliveryBoyId) {
                throw new Error("Order is already assigned.");
            }
            
            // FIX: Exact string match instead of .includes('deliver')
            const statusLower = String(orderData.status || '').toLowerCase();
            if (statusLower.includes('cancel')) {
                throw new Error('Order has been cancelled.');
            }
            if (orderData.status === 'Delivered ✅' || orderData.status === 'Delivered') {
                throw new Error('Order already delivered.');
            }

            transaction.update(orderRef, {
                status: "Out for Delivery 🚚",
                assignedTo: deliveryBoyId,
                otp: otp,
                otpVerified: false,
            });
        });

        return { success: true };
    } catch (error) {
        console.error("Error assigning order:", error);
        return { success: false, error: error.message || "Failed to process assignment." };
    }
};

export const verifyOrderOTP = async (orderId, otpInput) => {
    try {
        const orderRef = doc(db, "orders", orderId);
        const orderSnap = await getDoc(orderRef);
        if (!orderSnap.exists()) {
            return { success: false, error: "Order not found." };
        }
        const data = orderSnap.data();
        if (!data.otp) {
            return { success: false, error: "No OTP set for this order." };
        }
        if (String(data.otp) !== String(otpInput)) {
            return { success: false, error: "Invalid OTP provided." };
        }

        const updated = await updateOrderStatusInDB(orderId, "Delivered ✅");
        if (updated) {
            await updateDoc(orderRef, { otpVerified: true, otp: null });
            return { success: true };
        }
        return { success: false, error: "Failed to mark order delivered." };
    } catch (error) {
        console.error("OTP verification failed:", error);
        return { success: false, error: error.message || "Verification failed." };
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
        
        // FIX: Replaced .includes('deliver') with exact match to stop it from running on "Assigning Delivery Partner 🟡"
        if (status === "Delivered ✅" || status === "Delivered") {
            await runTransaction(db, async (transaction) => {
                const orderSnap = await transaction.get(orderRef);
                if (!orderSnap.exists()) throw new Error("Order not found");
                const orderData = orderSnap.data();
                const items = orderData.items || [];

                const prodRefs = items.map((item) => doc(db, "products", String(item.id))).filter(Boolean);
                const prodSnaps = [];
                for (const ref of prodRefs) {
                    prodSnaps.push(await transaction.get(ref));
                }

                transaction.update(orderRef, { status, otpVerified: true, otp: null });

                for (let i = 0; i < prodRefs.length; i++) {
                    const item = items[i];
                    const prodRef = prodRefs[i];
                    const prodSnap = prodSnaps[i];
                    if (!item || !item.id || !prodSnap.exists()) continue;
                    const currentStock = Number(prodSnap.data().stock || 0);
                    const qty = Number(item.quantity || 1);
                    const newStock = Math.max(0, currentStock - qty);
                    transaction.update(prodRef, { stock: newStock });
                }
            });
            return true;
        }

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

export const regenerateOrderOTP = async (orderId, deliveryBoyId) => {
    try {
        const orderRef = doc(db, "orders", orderId);
        const newOtp = String(Math.floor(1000 + Math.random() * 9000));

        await runTransaction(db, async (transaction) => {
            const orderSnap = await transaction.get(orderRef);
            if (!orderSnap.exists()) throw new Error('Order not found');
            const orderData = orderSnap.data() || {};
            const status = String(orderData.status || '').toLowerCase();
            if (!String(orderData.assignedTo).length || orderData.assignedTo !== deliveryBoyId) {
                throw new Error('Not assigned to this delivery partner');
            }
            if (!status.includes('out for delivery')) {
                throw new Error('Can regenerate OTP only for orders Out for Delivery');
            }

            transaction.update(orderRef, { otp: newOtp, otpVerified: false });
        });

        return { success: true, otp: newOtp };
    } catch (error) {
        console.error('Error regenerating OTP:', error);
        return { success: false, error: error.message || 'Failed to regenerate OTP' };
    }
};