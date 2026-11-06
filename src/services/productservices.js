import { db } from "./firebase";
import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  deleteDoc, 
  getDoc, 
  updateDoc, 
  where, 
  query, 
  onSnapshot, 
  runTransaction, 
  arrayUnion 
} from "firebase/firestore";

// ----------------------------------------------------------------------
// Product Management Services
// ----------------------------------------------------------------------

export const addProductToDB = async (productData) => {
    try {
        await addDoc(collection(db, "products"), {
            ...productData,
            createdAt: new Date().toISOString()
        });
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
                    const matchedId = item.id || item.productId;
                    if (matchedId) {
                        salesFrequency[matchedId] = (salesFrequency[matchedId] || 0) + (Number(item.quantity) || 1);
                    }
                });
            }
        });

        const sortedProductIds = Object.keys(salesFrequency)
            .sort((a, b) => salesFrequency[b] - salesFrequency[a])
            .slice(0, 6); 

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

export const updateProductStock = async (productId, newStock) => {
    try {
        const productRef = doc(db, "products", productId);
        await updateDoc(productRef, { stock: Math.max(0, Number(newStock)) });
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
// Order Management Services (ShopIndia Prime 5-Stage Lifecycle & Live AWB Tracking)
// ----------------------------------------------------------------------

export const parseOrderTime = (dateVal) => {
    if (!dateVal) return 0;
    if (typeof dateVal === "number") return dateVal;
    if (typeof dateVal?.toDate === "function") return dateVal.toDate().getTime();
    if (typeof dateVal?.toMillis === "function") return dateVal.toMillis();
    
    const str = String(dateVal).trim();
    if (/^\d{12,14}$/.test(str)) return Number(str);
    
    // Handle Indian DD/MM/YYYY or DD-MM-YYYY formats with or without time (e.g. "12/10/2026, 3:57:15 pm")
    const ddmmyyyyMatch = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})(?:[,\s]+(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?\s*(am|pm)?)?/i);
    if (ddmmyyyyMatch) {
        const day = parseInt(ddmmyyyyMatch[1], 10);
        const month = parseInt(ddmmyyyyMatch[2], 10) - 1;
        const year = parseInt(ddmmyyyyMatch[3], 10);
        let hours = ddmmyyyyMatch[4] ? parseInt(ddmmyyyyMatch[4], 10) : 0;
        const minutes = ddmmyyyyMatch[5] ? parseInt(ddmmyyyyMatch[5], 10) : 0;
        const seconds = ddmmyyyyMatch[6] ? parseInt(ddmmyyyyMatch[6], 10) : 0;
        const meridiem = ddmmyyyyMatch[7]?.toLowerCase();
        if (meridiem === 'pm' && hours < 12) hours += 12;
        if (meridiem === 'am' && hours === 12) hours = 0;
        return new Date(year, month, day, hours, minutes, seconds).getTime();
    }
    
    const t = new Date(str).getTime();
    return isNaN(t) ? 0 : t;
};

export const generateAWBTrackingNumber = () => {
    const timeSuffix = Date.now().toString().slice(-6);
    const randSuffix = Math.floor(1000 + Math.random() * 9000);
    return `SIP${timeSuffix}${randSuffix}IN`;
};

export const getOrderTrackingNumber = (order) => {
    const raw = order?.trackingNumber;
    if (raw && typeof raw === "string") {
        if (raw.startsWith("FMPC")) {
            return raw.replace(/^FMPC/, "SIP");
        }
        return raw;
    }
    if (!order?.id) return "SIP10849201IN";
    // Deterministic hash so legacy orders have consistent AWB
    let hash = 0;
    for (let i = 0; i < order.id.length; i++) {
        hash = (hash << 5) - hash + order.id.charCodeAt(i);
        hash |= 0;
    }
    const cleanNum = Math.abs(hash).toString().padEnd(10, "7").slice(0, 10);
    return `SIP${cleanNum}IN`;
};

export const formatOrderDate = (dateVal) => {
    const ts = parseOrderTime(dateVal);
    if (!ts) return String(dateVal || "N/A");
    return new Date(ts).toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    });
};

export const getOrderCarrier = (order) => {
    return "ShopIndia Prime Express";
};

export const sanitizeForFirestore = (data) => {
    if (data === undefined) return null;
    if (data === null || typeof data !== "object") return data;
    if (Array.isArray(data)) {
        return data.map(item => sanitizeForFirestore(item));
    }
    const cleaned = {};
    for (const key of Object.keys(data)) {
        const val = data[key];
        if (val !== undefined) {
            cleaned[key] = sanitizeForFirestore(val);
        }
    }
    return cleaned;
};

export const placeOrderInDB = async (orderData) => {
    try {
        const orderDate = orderData.date || new Date().toISOString();
        const trackingNum = generateAWBTrackingNumber();
        const finalOrderData = {
            ...orderData,
            status: "Order Confirmed 📦", 
            orderStage: 1, // 1: Confirmed, 2: Packed, 3: In Transit / On the Way, 4: Out for Delivery, 5: Delivered
            trackingNumber: trackingNum,
            carrier: "ShopIndia Prime Express",
            assignedTo: null, 
            refunded: false,
            date: orderDate,
            trackingTimeline: [
                {
                    stage: 1,
                    title: "Order Confirmed",
                    desc: "Order verified & confirmed by ShopIndia Fulfillment Center",
                    time: orderDate
                }
            ]
        };
        const sanitized = sanitizeForFirestore(finalOrderData);
        const docRef = await addDoc(collection(db, "orders"), sanitized);
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
        
        return orders.sort((a, b) => parseOrderTime(b.date) - parseOrderTime(a.date));
    } catch (error) {
        console.error("Error fetching user orders:", error);
        return [];
    }
};

export const checkAndAutoPackOrders = (ordersList) => {
    if (!Array.isArray(ordersList)) return;
    const now = Date.now();
    ordersList.forEach(order => {
        if (!order?.id) return;
        const statusLower = String(order.status || "").toLowerCase();
        if (statusLower.includes("cancel") || statusLower.includes("return")) return;
        const stage = Number(order.orderStage || (statusLower.includes("packed") || statusLower.includes("shipping") ? 2 : 1));
        if (stage === 1) {
            const orderTime = parseOrderTime(order.date);
            if (orderTime > 0 && (now - orderTime) >= 60000) {
                // User requirement: 1 minute after order placed, automatically advance to Shipping Order 📦
                markOrderPacked(order.id).catch(err => console.warn("Auto-pack error:", err));
            }
        }
    });
};

export const subscribeUserOrders = (userId, onUpdate, onError) => {
    if (!userId) return () => {};
    const q = query(collection(db, "orders"), where("userId", "==", userId));
    return onSnapshot(
        q,
        (snapshot) => {
            const orders = [];
            snapshot.forEach((doc) => {
                orders.push({ id: doc.id, ...doc.data() });
            });
            orders.sort((a, b) => parseOrderTime(b.date) - parseOrderTime(a.date));
            checkAndAutoPackOrders(orders);
            onUpdate(orders);
        },
        (error) => {
            console.error("Error subscribing to user orders:", error);
            if (onError) onError(error);
        }
    );
};

export const getAllOrders = async () => {
    try {
        const querySnapshot = await getDocs(collection(db, "orders"));
        const orders = [];
        querySnapshot.forEach((docItem) => {
            orders.push({ id: docItem.id, ...docItem.data() });
        });
        const sorted = orders.sort((a, b) => parseOrderTime(b.date) - parseOrderTime(a.date));
        checkAndAutoPackOrders(sorted);
        return sorted;
    } catch (error) {
        console.error("Error fetching all orders:", error);
        return [];
    }
};

// Real-Time Live Order Stream for Admin Panel
export const subscribeAllOrders = (onUpdate, onError) => {
    const qAllOrders = query(collection(db, "orders"));
    return onSnapshot(
        qAllOrders,
        (snapshot) => {
            const list = [];
            snapshot.forEach((docItem) => {
                list.push({ id: docItem.id, ...docItem.data() });
            });
            list.sort((a, b) => parseOrderTime(b.date) - parseOrderTime(a.date));
            checkAndAutoPackOrders(list);
            onUpdate(list);
        },
        (error) => {
            console.error("Admin order subscription failed:", error);
            if (onError) onError(error);
        }
    );
};

// Real-Time Delivery Dispatch Subscription without dropping statuses
export const subscribeDeliveryOrders = (deliveryBoyId, onUpdate, onError) => {
    if (!deliveryBoyId) {
        throw new Error("Delivery personnel ID required for subscription.");
    }

    const qAllOrders = query(collection(db, "orders"));

    const unsub = onSnapshot(
        qAllOrders,
        (snapshot) => {
            const list = [];
            snapshot.forEach((docItem) => {
                list.push({ id: docItem.id, ...docItem.data() });
            });
            list.sort((a, b) => parseOrderTime(b.date) - parseOrderTime(a.date));
            checkAndAutoPackOrders(list);
            onUpdate(list);
        },
        (error) => {
            console.error("Order subscription failed:", error);
            if (onError) onError(error);
        }
    );

    return () => {
        try { unsub(); } catch (e) {}
    };
};

// Stage 2: Warehouse Admin packs order & generates AWB shipping label
export const markOrderPacked = async (orderId) => {
    try {
        const orderRef = doc(db, "orders", orderId);
        const orderSnap = await getDoc(orderRef);
        if (!orderSnap.exists()) return { success: false, error: "Order not found" };

        const now = new Date().toISOString();
        const event = {
            stage: 2,
            title: "Shipping Order",
            desc: "Package packed and shipping initiated with ShopIndia Prime AWB label",
            time: now
        };

        await updateDoc(orderRef, {
            status: "Shipping Order 📦",
            orderStage: 2,
            packedAt: now,
            shippingStartedAt: now,
            trackingTimeline: arrayUnion(event)
        });
        return { success: true };
    } catch (error) {
        console.error("Error marking order packed:", error);
        return { success: false, error: error.message };
    }
};

// Stage 3: Warehouse hands over package to logistics carrier / Delivery partner
export const markOrderDispatched = async (orderId, carrierName = "ShopIndia Prime Express") => {
    try {
        const orderRef = doc(db, "orders", orderId);
        const orderSnap = await getDoc(orderRef);
        if (!orderSnap.exists()) return { success: false, error: "Order not found" };

        const now = new Date().toISOString();
        const event = {
            stage: 3,
            title: "Your Order is on the Way",
            desc: `Consignment handed over to ${carrierName}`,
            time: now
        };

        await updateDoc(orderRef, {
            status: "Your Order is on the Way 🚚",
            orderStage: 3,
            carrier: carrierName,
            dispatchedAt: now,
            trackingTimeline: arrayUnion(event)
        });
        return { success: true };
    } catch (error) {
        console.error("Error marking order dispatched:", error);
        return { success: false, error: error.message };
    }
};

// Atomic 1-Click Order Claiming by Delivery Boy (Pickup consignment from Hub)
export const assignOrderToDeliveryBoy = async (orderId, deliveryBoyId) => {
    try {
        const orderRef = doc(db, "orders", orderId);

        await runTransaction(db, async (transaction) => {
            const orderSnap = await transaction.get(orderRef);
            if (!orderSnap.exists()) {
                throw new Error("Order record not found.");
            }

            const orderData = orderSnap.data();
            
            // Concurrency lock check
            if (orderData.assignedTo && orderData.assignedTo !== deliveryBoyId) {
                throw new Error("This order was just accepted by another delivery partner!");
            }
            
            const statusLower = String(orderData.status || '').toLowerCase().trim();
            if (statusLower.includes('cancel')) {
                throw new Error('This order has been cancelled.');
            }
            
            if (statusLower === 'delivered' || statusLower.startsWith('delivered') || statusLower.includes('delivered ✅')) {
                throw new Error('This order is already delivered.');
            }

            const now = new Date().toISOString();
            const event = {
                stage: 3,
                title: "Your Order is on the Way",
                desc: "ShopIndia Prime Delivery partner has accepted your package and is on the way",
                time: now
            };

            const existingTimeline = orderData.trackingTimeline || [];

            transaction.update(orderRef, {
                status: "Your Order is on the Way 🚚",
                orderStage: 3,
                assignedTo: deliveryBoyId,
                acceptedAt: now,
                trackingTimeline: [...existingTimeline, event]
            });
        });

        return { success: true };
    } catch (error) {
        console.error("Error assigning order:", error);
        return { success: false, error: error.message || "Failed to process assignment." };
    }
};

// Stage 4: Delivery Boy explicitly triggers "Start Delivery Run / Out for Delivery"
// This activates customer 4-digit OTP and alerts customer
export const startDeliveryRun = async (orderId, deliveryBoyId) => {
    try {
        const orderRef = doc(db, "orders", orderId);
        const otp = String(Math.floor(1000 + Math.random() * 9000));
        const now = new Date().toISOString();

        await runTransaction(db, async (transaction) => {
            const orderSnap = await transaction.get(orderRef);
            if (!orderSnap.exists()) throw new Error("Order not found");

            const orderData = orderSnap.data();
            if (orderData.assignedTo !== deliveryBoyId) {
                throw new Error("Only the assigned delivery partner can initiate Out for Delivery.");
            }

            const event = {
                stage: 4,
                title: "Out for Delivery",
                desc: "Delivery partner is on the way to your doorstep. Keep 4-digit OTP ready.",
                time: now
            };

            const existingTimeline = orderData.trackingTimeline || [];

            transaction.update(orderRef, {
                status: "Out for Delivery 🛵",
                orderStage: 4,
                otp: otp,
                otpVerified: false,
                outForDeliveryAt: now,
                trackingTimeline: [...existingTimeline, event]
            });
        });

        return { success: true, otp };
    } catch (error) {
        console.error("Error starting delivery run:", error);
        return { success: false, error: error.message || "Failed to mark out for delivery." };
    }
};

// Cancel active delivery assignment and return to queue
export const cancelDeliveryAssignment = async (orderId, deliveryBoyId) => {
    try {
        const orderRef = doc(db, "orders", orderId);

        await runTransaction(db, async (transaction) => {
            const orderSnap = await transaction.get(orderRef);
            if (!orderSnap.exists()) throw new Error("Order record not found.");

            const orderData = orderSnap.data();
            const status = String(orderData.status || '').toLowerCase();
            if (orderData.assignedTo !== deliveryBoyId) {
                throw new Error("This order is not assigned to you.");
            }
            if (!status.includes('out for delivery')) {
                throw new Error("Only active delivery assignments can be cancelled.");
            }

            transaction.update(orderRef, {
                status: "Assigning Delivery Partner 🟡",
                assignedTo: null,
                otp: null,
                otpVerified: false,
                deliveryCancelledAt: new Date().toISOString()
            });
        });

        return { success: true };
    } catch (error) {
        console.error("Error cancelling delivery assignment:", error);
        return { success: false, error: error.message || "Failed to release assignment." };
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
        if (String(data.otp).trim() !== String(otpInput).trim()) {
            return { success: false, error: "Invalid 4-digit OTP code." };
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

// AUTOMATED REFUND ON CANCELLATION (CARD, UPI, WALLET & SPLIT PAYMENT)
export const cancelOrderInDB = async (orderId, { userId, isAdmin = false } = {}) => {
    try {
        const orderRef = doc(db, "orders", orderId);
        const orderSnap = await getDoc(orderRef);
        if (!orderSnap.exists()) {
            return { success: false, error: "Order record not found." };
        }

        const orderData = orderSnap.data();
        const orderTime = new Date(orderData.date).getTime();
        const elapsedMs = Date.now() - orderTime;

        if (!isAdmin) {
            if (orderData.userId !== userId) {
                return { success: false, error: "Unauthorized cancellation request." };
            }
            const currentStatus = String(orderData.status || '').toLowerCase();
            if (currentStatus.includes('cancel')) {
                return { success: false, error: "Order is already cancelled." };
            }
            if (currentStatus.startsWith('delivered') || currentStatus.includes('delivered ✅')) {
                return { success: false, error: "Delivered orders cannot be cancelled." };
            }
            if (isNaN(orderTime) || elapsedMs > 60000) {
                return { success: false, error: "Cancellation window (60s) has expired." };
            }
        }

        const targetUserId = orderData.userId;
        const totalAmount = Number(orderData.totalAmount || 0);
        const paymentMethod = String(orderData.paymentMethod || 'cod').toLowerCase();
        let refundProcessed = false;
        let refundAmount = 0;
        let refundNote = "";

        // Check if Single Prepaid (Card, UPI, Wallet) OR Split Payment
        if (targetUserId && !orderData.refunded) {
            if (paymentMethod === 'split' && orderData.paymentBreakdown) {
                const breakdown = orderData.paymentBreakdown;
                const prepaidSum = (Number(breakdown.wallet) || 0) + (Number(breakdown.upi) || 0) + (Number(breakdown.card) || 0);
                if (prepaidSum > 0) {
                    refundAmount = prepaidSum;
                    refundNote = `Refund: Cancelled Order #${orderId.slice(0, 6)} (Split Payment)`;
                }
            } else if (paymentMethod === 'card' || paymentMethod === 'upi' || paymentMethod === 'wallet') {
                if (totalAmount > 0) {
                    refundAmount = totalAmount;
                    refundNote = `Refund: Cancelled Order #${orderId.slice(0, 6)} (${paymentMethod.toUpperCase()})`;
                }
            }

            if (refundAmount > 0) {
                try {
                    const userRef = doc(db, "users", targetUserId);
                    const userSnap = await getDoc(userRef);
                    if (userSnap.exists()) {
                        const currentWallet = userSnap.data().wallet || { balance: 0, transactions: [] };
                        const newBalance = (currentWallet.balance || 0) + refundAmount;
                        const refundTx = {
                            type: "credit",
                            amount: refundAmount,
                            note: refundNote,
                            date: new Date().toISOString()
                        };
                        await updateDoc(userRef, {
                            "wallet.balance": newBalance,
                            "wallet.transactions": arrayUnion(refundTx)
                        });
                        refundProcessed = true;
                    }
                } catch (refundErr) {
                    console.error("Wallet refund error:", refundErr);
                }
            }
        }

        await updateDoc(orderRef, {
            status: "Cancelled 🔴",
            orderStage: -1,
            refunded: refundProcessed,
            cancelledAt: new Date().toISOString()
        });

        return { 
            success: true, 
            refundAmount: refundProcessed ? refundAmount : 0,
            refunded: refundProcessed 
        };
    } catch (error) {
        console.error("Error cancelling order:", error);
        return { success: false, error: error.message || "Failed to cancel order." };
    }
};

export const updateOrderStatusInDB = async (orderId, status) => {
    try {
        const orderRef = doc(db, "orders", orderId);
        const now = new Date().toISOString();

        if (status === "Delivered ✅" || status === "Delivered" || status.toLowerCase().includes("delivered")) {
            await runTransaction(db, async (transaction) => {
                const orderSnap = await transaction.get(orderRef);
                if (!orderSnap.exists()) throw new Error("Order not found");
                const orderData = orderSnap.data();
                const items = orderData.items || [];

                const prodRefs = items.map((item) => doc(db, "products", String(item.id || item.productId))).filter(Boolean);
                const prodSnaps = [];
                for (const ref of prodRefs) {
                    prodSnaps.push(await transaction.get(ref));
                }

                const event = {
                    stage: 5,
                    title: "Delivered",
                    desc: "Package delivered safely to recipient (Admin Verified - No OTP required)",
                    time: now
                };
                const existingTimeline = orderData.trackingTimeline || [];

                transaction.update(orderRef, { 
                    status: "Delivered ✅", 
                    orderStage: 5,
                    deliveredAt: now,
                    otpVerified: true, 
                    otp: null,
                    trackingTimeline: [...existingTimeline, event]
                });

                // Decrement stock only once if order was not already delivered
                const wasDelivered = String(orderData.status || '').toLowerCase().includes('delivered');
                if (!wasDelivered) {
                    for (let i = 0; i < prodRefs.length; i++) {
                        const item = items[i];
                        const prodRef = prodRefs[i];
                        const prodSnap = prodSnaps[i];
                        if (!item || !prodSnap.exists()) continue;
                        const currentStock = Number(prodSnap.data().stock || 0);
                        const qty = Number(item.quantity || 1);
                        const newStock = Math.max(0, currentStock - qty);
                        transaction.update(prodRef, { stock: newStock });
                    }
                }
            });
            return true;
        }

        if (status.includes("Out for Delivery")) {
            const orderSnap = await getDoc(orderRef);
            const orderData = orderSnap.data() || {};
            const otpCode = orderData.otp || String(Math.floor(1000 + Math.random() * 9000));
            const event = {
                stage: 4,
                title: "Out for Delivery",
                desc: "Delivery partner is on the way to recipient address",
                time: now
            };
            await updateDoc(orderRef, {
                status: "Out for Delivery 🛵",
                orderStage: 4,
                outForDeliveryAt: now,
                otp: otpCode,
                trackingTimeline: arrayUnion(event)
            });
            return true;
        }

        if (status.includes("Way") || status.includes("Dispatched")) {
            const event = {
                stage: 3,
                title: "Your Order is on the Way",
                desc: "Consignment in transit with ShopIndia Prime Express",
                time: now
            };
            await updateDoc(orderRef, {
                status: "Your Order is on the Way 🚚",
                orderStage: 3,
                dispatchedAt: now,
                trackingTimeline: arrayUnion(event)
            });
            return true;
        }

        if (status.includes("Shipping") || status.includes("Packed")) {
            const event = {
                stage: 2,
                title: "Shipping Order",
                desc: "Package prepared and official AWB shipping label attached",
                time: now
            };
            await updateDoc(orderRef, {
                status: "Shipping Order 📦",
                orderStage: 2,
                packedAt: now,
                shippingStartedAt: now,
                trackingTimeline: arrayUnion(event)
            });
            return true;
        }

        if (status.includes("Confirmed") || status.includes("Pending")) {
            await updateDoc(orderRef, {
                status: "Order Confirmed 📦",
                orderStage: 1
            });
            return true;
        }

        if (status.includes("Cancel")) {
            const res = await cancelOrderInDB(orderId, { isAdmin: true });
            return res.success;
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
                throw new Error('Can regenerate OTP only for active deliveries');
            }

            transaction.update(orderRef, { otp: newOtp, otpVerified: false });
        });

        return { success: true, otp: newOtp };
    } catch (error) {
        console.error('Error regenerating OTP:', error);
        return { success: false, error: error.message || 'Failed to regenerate OTP' };
    }
};

// ----------------------------------------------------------------------
// 7-Day Product Return Services (With Automated Wallet Refunds)
// ----------------------------------------------------------------------

export const requestReturnInDB = async (orderId, { reason, comment, userId }) => {
    try {
        const orderRef = doc(db, "orders", orderId);
        const orderSnap = await getDoc(orderRef);

        if (!orderSnap.exists()) {
            return { success: false, error: "Order record not found." };
        }

        const orderData = orderSnap.data();
        if (orderData.userId !== userId) {
            return { success: false, error: "Unauthorized return request." };
        }

        const status = String(orderData.status || "").toLowerCase();
        if (!status.includes("delivered")) {
            return { success: false, error: "Only delivered orders are eligible for return." };
        }

        // Check 7-day return window (7 days = 7 * 24 * 60 * 60 * 1000 ms)
        const orderTime = new Date(orderData.deliveredAt || orderData.date).getTime();
        const elapsedDays = (Date.now() - orderTime) / (1000 * 60 * 60 * 24);
        if (elapsedDays > 7) {
            return { success: false, error: "The 7-day return window for this order has expired." };
        }

        await updateDoc(orderRef, {
            status: "Return Requested 🔄",
            returnRequest: {
                reason: reason || "Quality Issue",
                comment: comment || "",
                requestedAt: new Date().toISOString(),
                status: "Pending Admin Approval"
            }
        });

        return { success: true };
    } catch (error) {
        console.error("Error requesting product return:", error);
        return { success: false, error: error.message || "Failed to submit return request." };
    }
};

export const approveReturnInDB = async (orderId) => {
    try {
        const orderRef = doc(db, "orders", orderId);
        const orderSnap = await getDoc(orderRef);
        if (!orderSnap.exists()) return { success: false, error: "Order not found." };

        const orderData = orderSnap.data();
        const userId = orderData.userId;
        const refundAmount = Number(orderData.totalAmount || 0);

        // Credit refund to customer wallet
        if (userId && refundAmount > 0) {
            try {
                const userRef = doc(db, "users", userId);
                const userSnap = await getDoc(userRef);
                if (userSnap.exists()) {
                    const currentWallet = userSnap.data().wallet || { balance: 0, transactions: [] };
                    const newBalance = (currentWallet.balance || 0) + refundAmount;
                    const refundTx = {
                        type: "credit",
                        amount: refundAmount,
                        note: `Refund: 7-Day Return Approved for Order #${orderId.slice(0, 6)}`,
                        date: new Date().toISOString()
                    };
                    await updateDoc(userRef, {
                        "wallet.balance": newBalance,
                        "wallet.transactions": arrayUnion(refundTx)
                    });
                }
            } catch (wErr) {
                console.error("Return wallet credit error:", wErr);
            }
        }

        // Restock inventory for returned items
        const items = orderData.items || orderData.cartItems || [];
        for (const item of items) {
            const pId = item.id || item.productId;
            if (pId) {
                try {
                    const pRef = doc(db, "products", pId);
                    const pSnap = await getDoc(pRef);
                    if (pSnap.exists()) {
                        const curStock = Number(pSnap.data().stock || 0);
                        await updateDoc(pRef, { stock: curStock + (Number(item.quantity) || 1) });
                    }
                } catch (e) {}
            }
        }

        await updateDoc(orderRef, {
            status: "Returned & Refunded ✅",
            refunded: true,
            "returnRequest.status": "Approved & Refunded",
            "returnRequest.resolvedAt": new Date().toISOString()
        });

        return { success: true, refundAmount };
    } catch (error) {
        console.error("Error approving return:", error);
        return { success: false, error: error.message || "Failed to process return approval." };
    }
};

export const rejectReturnInDB = async (orderId, rejectionReason = "Return policy criteria not met") => {
    try {
        const orderRef = doc(db, "orders", orderId);
        await updateDoc(orderRef, {
            status: "Delivered (Return Rejected) ⚠️",
            "returnRequest.status": "Rejected",
            "returnRequest.rejectionReason": rejectionReason,
            "returnRequest.resolvedAt": new Date().toISOString()
        });
        return { success: true };
    } catch (error) {
        console.error("Error rejecting return:", error);
        return { success: false, error: error.message };
    }
};

// ----------------------------------------------------------------------
// Category-Aware GST Migration Utility (Food: 5%, Apparel: 12%, Tech: 18%)
// ----------------------------------------------------------------------
export const applyDefaultGstToProducts = async (forceReassign = false) => {
    try {
        const querySnapshot = await getDocs(collection(db, "products"));
        let updatedCount = 0;
        for (const docItem of querySnapshot.docs) {
            const data = docItem.data();
            const updates = {};

            const cat = String(data.category || "").toLowerCase();
            let suggestedRate = 18;
            let suggestedHsn = "8517";
            if (cat.includes("grocer") || cat.includes("food") || cat.includes("fruit") || cat.includes("spice") || cat.includes("snack")) {
                suggestedRate = 5;
                suggestedHsn = "1905";
            } else if (cat.includes("clothing") || cat.includes("apparel") || cat.includes("fashion")) {
                suggestedRate = 12;
                suggestedHsn = "6109";
            } else if (cat.includes("luxury")) {
                suggestedRate = 28;
                suggestedHsn = "8528";
            }

            if (forceReassign || data.gstRate === undefined || data.gstRate === null || data.gstRate === "") {
                updates.gstRate = suggestedRate;
                updates.hsnCode = suggestedHsn;
            }
            if (data.isReturnable === undefined) {
                updates.isReturnable = true;
            }
            if (Object.keys(updates).length > 0) {
                await updateDoc(doc(db, "products", docItem.id), updates);
                updatedCount++;
            }
        }
        return { success: true, updatedCount };
    } catch (error) {
        console.error("Error syncing category GST to products:", error);
        return { success: false, error: error.message };
    }
};