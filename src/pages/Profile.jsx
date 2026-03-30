import { useState, useEffect } from "react";
import { auth } from "../services/firebase"; 
import GlassCard from "../components/ui/GlassCard";
import { formatPrice } from "../utils/priceFormatter";
import { getUserOrders, cancelOrderInDB } from "../services/productservices";
import { onAuthStateChanged } from "firebase/auth";

const Profile = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);

  // Custom Alert State
  const [alertData, setAlertData] = useState({ show: false, message: "", icon: "" });

  // 🔥 NAYA JADOO: Custom Confirm Popup State (User ke liye)
  const [confirmDialog, setConfirmDialog] = useState({
    show: false,
    orderId: null,
  });

  const showCustomAlert = (message, icon) => {
    setAlertData({ show: true, message, icon });
    setTimeout(() => {
      setAlertData({ show: false, message: "", icon: "" });
    }, 3000); 
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user);
        fetchOrders(user.uid);
      } else {
        setCurrentUser(null);
        setLoading(false);
      }
    });
    window.scrollTo(0, 0);
    return () => unsubscribe();
  }, []);

  const fetchOrders = async (uid) => {
    setLoading(true);
    const data = await getUserOrders(uid);
    setOrders(data);
    setLoading(false);
  };

  
  const triggerCancelOrder = (orderId) => {
    setConfirmDialog({ show: true, orderId });
  };

  
  const executeCancelOrder = async () => {
    const orderId = confirmDialog.orderId;
    
    
    setConfirmDialog({ show: false, orderId: null });

    const isSuccess = await cancelOrderInDB(orderId);
    if (isSuccess) {
    
      setOrders(orders.map(order => 
        order.id === orderId ? { ...order, status: "Cancelled 🔴" } : order
      ));
      showCustomAlert("Order Cancelled Successfully", "🚫");
    }
  };

  if (!currentUser && loading) {
    return (
      <div className="flex justify-center items-center h-screen text-yellow-400 text-2xl font-bold animate-pulse">
        Loading Profile... ⏳
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-10 space-y-8 relative">
      
      {/* ================= CUSTOM GLASS ALERT ================= */}
      {alertData.show && (
        <div className="fixed top-24 right-5 md:right-10 z-[100] animate-bounce">
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 shadow-[0_8px_32px_0_rgba(31,38,135,0.37)] px-6 py-4 rounded-2xl flex items-center gap-3 text-white">
            <span className="text-2xl">{alertData.icon}</span>
            <p className="font-bold tracking-wide">{alertData.message}</p>
          </div>
        </div>
      )}

      {/* ================= 🛑 CUSTOM CONFIRMATION POPUP ================= */}
      {confirmDialog.show && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-gray-900/90 border border-white/20 shadow-[0_0_50px_rgba(0,0,0,0.5)] p-8 rounded-3xl max-w-md w-full text-center scale-up">
            <div className="text-5xl mb-4">😢</div>
            <h3 className="text-2xl font-black text-white mb-2">Cancel Order?</h3>
            <p className="text-gray-400 mb-8 leading-relaxed">
              Are you sure you want to cancel this order? This action cannot be undone.
            </p>
            
            <div className="flex gap-4 justify-center">
              <button 
                onClick={() => setConfirmDialog({ show: false, orderId: null })}
                className="flex-1 bg-white/10 hover:bg-white/20 text-white font-bold py-3 rounded-xl transition"
              >
                No, Keep it
              </button>
              <button 
                onClick={executeCancelOrder}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-3 rounded-xl shadow-lg shadow-red-500/30 transition"
              >
                Yes, Cancel it
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🟢 ASLI PROFILE HEADER */}
      <GlassCard className="p-8 flex items-center gap-6 border-l-4 border-yellow-400">
        <div className="w-20 h-20 md:w-24 md:h-24 bg-gradient-to-tr from-yellow-400 to-orange-500 rounded-full flex items-center justify-center text-4xl md:text-5xl shadow-lg border-4 border-white/20 text-black font-black uppercase">
          {currentUser?.displayName ? currentUser.displayName.charAt(0) : "U"}
        </div>
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-white">
            {currentUser?.displayName || "Awesome User"}
          </h1>
          <p className="text-yellow-400/80 mt-1 font-medium tracking-wide">
            {currentUser?.email}
          </p>
        </div>
      </GlassCard>

      <h2 className="text-3xl font-bold text-white border-b border-white/10 pb-4 mt-10">
        📦 My Order History
      </h2>

      {/* 🔴 ORDERS LIST */}
      {loading ? (
        <div className="text-center text-yellow-400 text-xl py-10 animate-pulse font-bold">
          Loading your orders... ⏳
        </div>
      ) : orders.length === 0 ? (
        <GlassCard className="p-10 text-center">
          <span className="text-6xl block mb-4">🛒</span>
          <h3 className="text-2xl font-bold text-white mb-2">No Orders Yet!</h3>
          <p className="text-gray-400">Aapne abhi tak koi shopping nahi ki hai.</p>
        </GlassCard>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => (
            <GlassCard 
              key={order.id} 
              className={`p-6 border-l-4 transition-transform duration-300 ${
                order.status === "Cancelled 🔴" ? "border-l-red-500 opacity-70" : "border-l-green-500 hover:scale-[1.01]"
              }`}
            >
              
              {/* ORDER HEADER */}
              <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 border-b border-white/10 pb-4 mb-4">
                <div>
                  <p className="text-sm text-gray-400">Order ID: <span className="text-white font-mono">{order.id}</span></p>
                  <p className="text-sm text-gray-400">
                    Date: <span className="text-white font-semibold">
                      {new Date(order.date).toLocaleDateString('en-IN', {
                        day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                      })}
                    </span>
                  </p>
                </div>
                <div className="text-left md:text-right flex flex-col items-start md:items-end gap-2">
                  <p className={`font-bold px-3 py-1 rounded-full inline-block text-sm uppercase tracking-wider ${
                    order.status === "Cancelled 🔴" ? "bg-red-500/10 text-red-400" : "bg-green-500/10 text-green-400"
                  }`}>
                    {order.status || "Order Confirmed 🟢"}
                  </p>
                  
                  {/* 🔥 CUSTOM CANCEL BUTTON */}
                  {order.status !== "Cancelled 🔴" && (
                    <button 
                      onClick={() => triggerCancelOrder(order.id)}
                      className="text-xs bg-red-500 hover:bg-red-600 text-white font-bold py-1.5 px-3 rounded-lg transition-colors mt-1 shadow-md shadow-red-500/20"
                    >
                      Cancel Order ✖️
                    </button>
                  )}
                </div>
              </div>

              {/* ORDER ITEMS */}
              <div className="space-y-4">
                {order.items.map((item, i) => (
                  <div key={i} className="flex items-center gap-4 bg-white/5 p-3 rounded-xl hover:bg-white/10 transition">
                    <img 
                      src={item.image || item.thumbnail} 
                      alt={item.title} 
                      className="w-16 h-16 object-contain rounded bg-white/10 p-1"
                    />
                    <div className="flex-1">
                      <h4 className="font-bold text-white text-sm md:text-base line-clamp-1">{item.title}</h4>
                      <p className="text-gray-400 text-sm mt-1">
                        ₹ {formatPrice(item.price)} <span className="mx-1 text-white/30">x</span> <span className="text-yellow-400 font-bold">{item.quantity}</span>
                      </p>
                    </div>
                    <div className="font-bold text-white text-lg">
                      ₹ {formatPrice(item.totalPrice)}
                    </div>
                  </div>
                ))}
                
                {/* Total Display */}
                <div className="flex justify-end pt-2">
                   <p className="text-xl font-black text-yellow-400">
                    Total: ₹ {formatPrice(order.totalAmount)}
                  </p>
                </div>
              </div>

            </GlassCard>
          ))}
        </div>
      )}
    </div>
  );
};

export default Profile