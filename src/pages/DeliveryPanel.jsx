import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import GlassCard from "../components/ui/GlassCard";
import { subscribeDeliveryOrders, updateOrderStatusInDB, assignOrderToDeliveryBoy } from "../services/productservices";

const DeliveryPanel = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("available"); // 'available' ya 'history'
  const [actionMessage, setActionMessage] = useState("");
  const [actionError, setActionError] = useState("");
  
  const [currentPage, setCurrentPage] = useState(1);
  const ordersPerPage = 5;

  const user = useSelector((state) => state.auth.user);
  const role = useSelector((state) => state.auth.role);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      setLoading(false);
      setError("Please login to view delivery orders.");
      return;
    }

    if (role !== "deliveryboy") {
      navigate("/");
      return;
    }

    const unsubscribe = subscribeDeliveryOrders(
      user.uid,
      (deliveryOrders) => {
        setOrders(deliveryOrders);
        setError("");
        setLoading(false);
      },
      (err) => {
        console.error("Delivery subscription error:", err);
        setError(err?.message || "Unable to subscribe to delivery orders.");
        setLoading(false);
      }
    );

    return () => {
      if (typeof unsubscribe === "function") {
        unsubscribe();
      }
    };
  }, [user, role, navigate]);

  const handleAcceptOrder = async (orderId) => {
    if (!user?.uid) return;
    setActionMessage("");
    setActionError("");

    const result = await assignOrderToDeliveryBoy(orderId, user.uid);
    if (result.success) {
      setActionMessage("Order accepted successfully! You can now deliver it.");
    } else {
      setActionError(result.error || "Unable to accept order. Please try again.");
    }
  };

  const handleMarkDelivered = async (orderId) => {
    setActionMessage("");
    setActionError("");
    const success = await updateOrderStatusInDB(orderId, "Delivered ✅");
    if (success) {
      setActionMessage("Order marked as delivered successfully.");
    } else {
      setActionError("Unable to update status. Please try again.");
    }
  };

  // Filter orders based on active tab
  const filteredOrders = orders.filter((order) => {
    if (activeTab === "available") {
      // Naye confirmed orders jo kisi ko assigned nahi hain, YA jo is delivery boy ne khud "Out for Delivery" kiye hain
      return (
        (order.status === "Order Confirmed 🟢" && !order.assignedTo) ||
        (order.assignedTo === user?.uid && order.status === "Out for Delivery 🚚")
      );
    } else {
      // Is delivery boy ki delivery history
      return order.assignedTo === user?.uid && order.status === "Delivered ✅";
    }
  });

  // Pagination Logic
  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / ordersPerPage));
  const paginatedOrders = filteredOrders.slice((currentPage - 1) * ordersPerPage, currentPage * ordersPerPage);

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <h1 className="text-4xl font-black text-white">Delivery Boy Panel</h1>
      <p className="text-gray-400">Manage incoming orders and track your completed deliveries.</p>
      
      {/* TABS FOR SWITCHING BETWEEN AVAILABLE ORDERS AND HISTORY */}
      <div className="flex gap-4 border-b border-white/10 pb-4">
        <button
          onClick={() => { setActiveTab("available"); setCurrentPage(1); }}
          className={`px-6 py-2.5 rounded-xl font-bold transition-all ${
            activeTab === "available"
              ? "bg-yellow-400 text-black scale-105"
              : "bg-white/10 text-white hover:bg-white/20"
          }`}
        >
          📦 Available / Active Orders
        </button>
        <button
          onClick={() => { setActiveTab("history"); setCurrentPage(1); }}
          className={`px-6 py-2.5 rounded-xl font-bold transition-all ${
            activeTab === "history"
              ? "bg-yellow-400 text-black scale-105"
              : "bg-white/10 text-white hover:bg-white/20"
          }`}
        >
          ✅ Delivery History
        </button>
      </div>

      <div className="text-xs text-gray-500">Debug: uid={user?.uid || 'none'} role={role || 'none'}</div>

      {loading ? (
        <div className="text-center text-yellow-400 py-20">Loading delivery orders...</div>
      ) : error ? (
        <div className="text-center text-red-400 py-20">{error}</div>
      ) : (
        <>
          {(actionMessage || actionError) && (
            <div className={`rounded-2xl p-4 mb-4 ${actionError ? 'bg-red-500/10 border border-red-500 text-red-200' : 'bg-green-500/10 border border-green-500 text-green-200'}`}>
              {actionError || actionMessage}
            </div>
          )}

          {filteredOrders.length === 0 ? (
            <div className="text-center text-gray-400 py-20">
              {activeTab === "available" ? "No new orders available right now." : "You have not completed any deliveries yet."}
            </div>
          ) : (
            <div className="space-y-6">
              <div className="grid gap-6">
                {paginatedOrders.map((order) => {
                  const isAssignedToMe = order.assignedTo === user?.uid;
                  const canAccept = order.status === "Order Confirmed 🟢" && !order.assignedTo;

                  return (
                    <GlassCard key={order.id} className="p-6 bg-black/50 border border-white/10">
                      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                        <div>
                          <p className="text-sm text-gray-400">Order ID: <span className="text-white font-mono">{order.id}</span></p>
                          <p className="text-sm text-gray-400">User ID: <span className="text-white">{order.userId}</span></p>
                          <p className="text-sm text-white/80">Status: <span className="font-bold text-yellow-400">{order.status}</span></p>
                          {order.assignedTo && (
                            <p className="text-sm text-gray-400">Assigned To: <span className="text-white font-mono">{order.assignedTo}</span></p>
                          )}
                        </div>

                        <div className="flex flex-col gap-3 items-start sm:items-end">
                          {canAccept && (
                            <button
                              onClick={() => handleAcceptOrder(order.id)}
                              className="px-5 py-2 rounded-full bg-blue-500 text-black font-semibold hover:bg-blue-400 transition"
                            >
                              Accept Order 🚚
                            </button>
                          )}

                          {isAssignedToMe && order.status === "Out for Delivery 🚚" && (
                            <button
                              onClick={() => handleMarkDelivered(order.id)}
                              className="px-5 py-2 rounded-full bg-green-500 text-black font-semibold hover:bg-green-400 transition"
                            >
                              Mark Delivered ✅
                            </button>
                          )}

                          {order.status === "Delivered ✅" && (
                            <span className="px-5 py-2 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30">
                              Successfully Delivered ✅
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="mt-4 grid sm:grid-cols-2 gap-4">
                        <div>
                          <p className="text-white font-semibold">Shipping Details</p>
                          <p className="text-gray-300">{order.shipping?.name || "-"}</p>
                          <p className="text-gray-300">{order.shipping?.address || order.shippingAddress || "-"}</p>
                          <p className="text-gray-300">PIN: {order.shipping?.pincode || "-"}</p>
                        </div>
                        <div>
                          <p className="text-white font-semibold">Items</p>
                          <div className="grid gap-2">
                            {order.items?.map((item, idx) => (
                              <div key={idx} className="bg-white/10 p-3 rounded-xl text-sm text-gray-200">
                                {item.quantity || 1}× {item.title || item.name}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </GlassCard>
                  );
                })}
              </div>

              {/* Pagination Controls */}
              <div className="flex items-center justify-between px-6 py-4 bg-white/5 rounded-2xl border border-white/10 text-white">
                <span className="text-sm text-gray-400">
                  Page {currentPage} of {totalPages} (Total: {filteredOrders.length})
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage((page) => Math.max(page - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 rounded-xl bg-white/10 text-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white/20 transition"
                  >
                    Prev
                  </button>
                  <button
                    onClick={() => setCurrentPage((page) => Math.min(page + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 rounded-xl bg-white/10 text-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white/20 transition"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default DeliveryPanel;