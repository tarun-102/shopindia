import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { 
  addProductToDB, getAllProducts, deleteProductFromDB, updateProductInDB,
  getAllOrders, cancelOrderInDB, deleteOrderFromDB, updateOrderStatusInDB 
} from "../services/productservices";
import { getAllUsers } from "../services/auth/authService"; 
import { formatPrice } from "../utils/priceFormatter";

export const categoriesList = [
  { id: 1, name: "Smartphones & Accessories", value: "smartphones", icon: "📱" },
  { id: 2, name: "Laptops & Computers", value: "laptops", icon: "💻" },
  { id: 3, name: "Tablets & E-readers", value: "tablets", icon: "📲" },
  { id: 4, name: "Audio, Earbuds & Headphones", value: "audio", icon: "🎧" },
  { id: 5, name: "Smartwatches & Wearables", value: "wearables", icon: "⌚" },
  { id: 6, name: "Cameras & Photography", value: "cameras", icon: "📸" },
  { id: 7, name: "Gaming Consoles & Accessories", value: "gaming", icon: "🎮" },
  { id: 8, name: "TV & Home Entertainment", value: "tv-appliances", icon: "📺" },
  { id: 9, name: "Men's Clothing", value: "mens-clothing", icon: "👕" },
  { id: 10, name: "Women's Clothing", value: "womens-clothing", icon: "👗" },
  { id: 11, name: "Kids' Clothing & Toys", value: "kids-clothing", icon: "🧸" },
  { id: 12, name: "Men's Footwear", value: "mens-shoes", icon: "👞" },
  { id: 13, name: "Women's Footwear", value: "womens-shoes", icon: "👠" },
  { id: 14, name: "Home Appliances (AC, Fridge)", value: "home-appliances", icon: "🏠" },
  { id: 15, name: "Kitchen Appliances", value: "kitchen-appliances", icon: "🍳" },
  { id: 16, name: "Home Decor & Furniture", value: "furniture", icon: "🛏️" },
  { id: 17, name: "Groceries & Daily Essentials", value: "groceries", icon: "🥫" },
  { id: 18, name: "Beauty & Personal Care", value: "beauty", icon: "💄" },
  { id: 19, name: "Health & Wellness", value: "health", icon: "💊" },
  { id: 20, name: "Sports, Fitness & Outdoors", value: "sports", icon: "🏏" },
  { id: 21, name: "Automotive & Bike Accessories", value: "automotive", icon: "🚗" },
  { id: 22, name: "Books & Stationery", value: "books", icon: "📚" },
  { id: 23, name: "Luggage & Travel Bags", value: "travel", icon: "🧳" },
  { id: 24, name: "Pet Supplies", value: "pets", icon: "🐕" },
  { id: 25, name: "Musical Instruments", value: "musical-instruments", icon: "🎸" }
];

const Admin = () => {
  // ---------------------------------------------------------------------------
  // Component States
  // ---------------------------------------------------------------------------
  const [activeTab, setActiveTab] = useState("analytics"); 

  const [product, setProduct] = useState({ title: "", price: "", category: "", thumbnail: "", description: "" });
  const [productsList, setProductsList] = useState([]);
  const [ordersList, setOrdersList] = useState([]);
  const [usersList, setUsersList] = useState([]); 
  const [editingId, setEditingId] = useState(null);
  
  const [loading, setLoading] = useState(false);
  const [ordersLoading, setOrdersLoading] = useState(true);
  
  const user = useSelector((state) => state.auth.user);
  const userRole = useSelector((state) => state.auth.role);

  const [alertData, setAlertData] = useState({ show: false, message: "", icon: "" });
  const [confirmDialog, setConfirmDialog] = useState({ show: false, id: null, actionType: "", message: "" });

  // Pagination States
  const [productsPage, setProductsPage] = useState(1);
  const [ordersPage, setOrdersPage] = useState(1);
  const [usersPage, setUsersPage] = useState(1); 
  
  const productsPerPage = 5; 
  const ordersPerPage = 5;
  const usersPerPage = 5; 

  // ---------------------------------------------------------------------------
  // Real Analytics Calculations (Synced with Firestore Orders List)
  // ---------------------------------------------------------------------------
  const totalOrdersCount = ordersList.length;
  const deliveredOrders = ordersList.filter((o) => o.status === "Delivered ✅");
  const activeDeliveryOrders = ordersList.filter((o) => o.status === "Order Confirmed 🟢" || o.status === "Out for Delivery 🚚" || o.status === "Pending ⏳");
  
  const totalRevenue = deliveredOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
  const pendingRevenue = activeDeliveryOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);

  const totalProductPages = Math.max(1, Math.ceil(productsList.length / productsPerPage));
  const totalOrderPages = Math.max(1, Math.ceil(ordersList.length / ordersPerPage));
  const totalUserPages = Math.max(1, Math.ceil(usersList.length / usersPerPage)); 

  const paginatedProducts = productsList.slice((productsPage - 1) * productsPerPage, productsPage * productsPerPage);
  const paginatedOrders = ordersList.slice((ordersPage - 1) * ordersPerPage, ordersPage * ordersPerPage);
  const paginatedUsers = usersList.slice((usersPage - 1) * usersPerPage, usersPage * usersPerPage); 

  // ---------------------------------------------------------------------------
  // Helper Functions
  // ---------------------------------------------------------------------------
  const showCustomAlert = (message, icon) => {
    setAlertData({ show: true, message, icon });
    setTimeout(() => setAlertData({ show: false, message: "", icon: "" }), 4000); 
  };

  // ---------------------------------------------------------------------------
  // Data Fetching Effects
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (userRole === "admin") {
      fetchProducts();
      fetchOrders();
      fetchUsers();
    }
  }, [userRole]);

  const fetchProducts = async () => {
    try {
      const products = await getAllProducts();
      setProductsList(products);
    } catch (error) { 
      console.error("Error fetching products:", error); 
    }
  };

  const fetchOrders = async () => {
    setOrdersLoading(true);
    try {
      const orders = await getAllOrders(user?.uid);
      setOrdersList(orders);
    } catch (error) { 
      console.error("Error fetching orders:", error); 
    } finally { 
      setOrdersLoading(false); 
    }
  };

  const fetchUsers = async () => {
    try {
      const users = await getAllUsers();
      setUsersList(users);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  // ---------------------------------------------------------------------------
  // Action Handlers
  // ---------------------------------------------------------------------------
  const handleProductSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);  
    const productData = { ...product, price: Number(product.price) };
    
    if (editingId) {
      if (await updateProductInDB(editingId, productData)) {
        showCustomAlert("Product Updated Successfully!", "🛠️");
        setEditingId(null); 
      }
    } else {
      if (await addProductToDB(productData)) {
        showCustomAlert("Product Added Successfully!", "🔥");
      }
    }
    setProduct({ title: "", price: "", category: "", thumbnail: "", description: "" });
    fetchProducts();
    setLoading(false);
  };

  const handleEdit = (item) => {
    setProduct(item);
    setEditingId(item.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const updateOrderStatus = async (orderId, status, message, icon) => {
    if (await updateOrderStatusInDB(orderId, status)) {
      showCustomAlert(message, icon);
      fetchOrders();
    }
  };

  const executeConfirmAction = async () => {
    const { id, actionType } = confirmDialog;
    setConfirmDialog({ show: false, id: null, actionType: "", message: "" });

    if (actionType === "CANCEL_ORDER") {
      await cancelOrderInDB(id, { isAdmin: true });
      fetchOrders(); 
      showCustomAlert("Order Cancelled by Admin", "🚫");
    } else if (actionType === "DELETE_ORDER") {
      await deleteOrderFromDB(id);
      fetchOrders(); 
      showCustomAlert("Order Record Deleted", "🗑️");
    } else if (actionType === "DELETE_PRODUCT") {
      await deleteProductFromDB(id);
      fetchProducts(); 
      showCustomAlert("Product Deleted", "🗑️");
    }
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <div className="max-w-7xl mx-auto mt-8 p-4 md:p-8 bg-[#0a0f16]/85 backdrop-blur-3xl rounded-[2.5rem] border border-white/5 shadow-2xl text-white relative min-h-[85vh]">
      
      {/* Toast Notification */}
      {alertData.show && (
        <div className="fixed top-24 right-5 z-[100] animate-bounce">
          <div className="bg-[#111827] backdrop-blur-xl border border-emerald-500/40 shadow-emerald-500/20 px-6 py-4 rounded-2xl flex items-center gap-3">
            <span className="text-2xl">{alertData.icon}</span>
            <p className="font-semibold text-emerald-300">{alertData.message}</p>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmDialog.show && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
          <div className="bg-[#111827] border border-white/10 shadow-2xl p-8 rounded-3xl max-w-md w-full text-center">
            <div className="text-5xl mb-4">⚠️</div>
            <h3 className="text-2xl font-black text-white mb-2">Are you sure?</h3>
            <p className="text-gray-400 mb-8 leading-relaxed text-sm">{confirmDialog.message}</p>
            <div className="flex gap-4 justify-center">
              <button onClick={() => setConfirmDialog({ show: false, id: null, actionType: "", message: "" })} className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold py-3 rounded-xl transition">No, Cancel</button>
              <button onClick={executeConfirmAction} className="flex-1 bg-rose-500 hover:bg-rose-600 text-white font-bold py-3 rounded-xl shadow-lg shadow-rose-500/30 transition">Yes, Proceed</button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-4">
        <div>
          <h2 className="text-3xl md:text-4xl font-black uppercase tracking-widest bg-gradient-to-r from-emerald-400 to-teal-500 bg-clip-text text-transparent">
            Control Center 🎛️
          </h2>
          <p className="text-gray-400 text-sm mt-1">Real-time e-commerce metrics and management console.</p>
        </div>
        <div className="bg-white/5 border border-white/10 px-5 py-2.5 rounded-full flex items-center gap-3">
          <div className="w-8 h-8 bg-emerald-500/20 rounded-full flex items-center justify-center text-emerald-400">👤</div>
          <span className="font-semibold text-sm">{user?.email || "Admin"}</span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-3 mb-10 border-b border-white/10 pb-6">
        {[
          { id: "analytics", label: "📊 Analytics Dashboard" },
          { id: "products", label: "📦 Manage Products" },
          { id: "orders", label: "🛒 Manage Orders" },
          { id: "users", label: "👥 Users & Staff" }
        ].map((tab) => (
          <button 
            key={tab.id}
            onClick={() => setActiveTab(tab.id)} 
            className={`px-6 py-3 rounded-xl font-bold transition-all duration-300 ${
              activeTab === tab.id 
              ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/20 scale-105 border-transparent" 
              : "bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 border border-white/5"
            }`}>
              {tab.label}
          </button>
        ))}
      </div>

      {/* ===================================================================
          TAB 1: ANALYTICS (REAL DATABASE METRICS)
      =================================================================== */}
      {activeTab === "analytics" && (
        <div className="animate-fade-in space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Total Revenue */}
            <div className="bg-gradient-to-br from-[#111827] to-[#1f2937] p-6 rounded-3xl border border-white/5 shadow-xl relative overflow-hidden group hover:border-emerald-500/30 transition-all">
              <div className="absolute top-0 right-0 p-4 opacity-10 text-6xl">💰</div>
              <p className="text-gray-400 font-bold text-sm tracking-wider uppercase">Total Revenue</p>
              <h3 className="text-3xl md:text-4xl font-black text-emerald-400 mt-2">₹{formatPrice(totalRevenue)}</h3>
              <p className="text-xs text-emerald-500/80 mt-2">From Delivered Orders</p>
            </div>
            
            {/* Pending / Active Revenue */}
            <div className="bg-gradient-to-br from-[#111827] to-[#1f2937] p-6 rounded-3xl border border-white/5 shadow-xl relative overflow-hidden group hover:border-amber-500/30 transition-all">
              <div className="absolute top-0 right-0 p-4 opacity-10 text-6xl">⏳</div>
              <p className="text-gray-400 font-bold text-sm tracking-wider uppercase">Active Value</p>
              <h3 className="text-3xl md:text-4xl font-black text-amber-400 mt-2">₹{formatPrice(pendingRevenue)}</h3>
              <p className="text-xs text-amber-500/80 mt-2">In Transit / Processing</p>
            </div>

            {/* Total Orders Count */}
            <div className="bg-gradient-to-br from-[#111827] to-[#1f2937] p-6 rounded-3xl border border-white/5 shadow-xl relative overflow-hidden group hover:border-blue-500/30 transition-all">
              <div className="absolute top-0 right-0 p-4 opacity-10 text-6xl">📦</div>
              <p className="text-gray-400 font-bold text-sm tracking-wider uppercase">Total Orders</p>
              <h3 className="text-3xl md:text-4xl font-black text-blue-400 mt-2">{totalOrdersCount}</h3>
              <p className="text-xs text-blue-500/80 mt-2">{deliveredOrders.length} Completed</p>
            </div>

            {/* Registered Users Count */}
            <div className="bg-gradient-to-br from-[#111827] to-[#1f2937] p-6 rounded-3xl border border-white/5 shadow-xl relative overflow-hidden group hover:border-indigo-500/30 transition-all">
              <div className="absolute top-0 right-0 p-4 opacity-10 text-6xl">👥</div>
              <p className="text-gray-400 font-bold text-sm tracking-wider uppercase">Total Users</p>
              <h3 className="text-3xl md:text-4xl font-black text-indigo-400 mt-2">{usersList.length}</h3>
              <p className="text-xs text-indigo-500/80 mt-2">Registered Accounts</p>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================
          TAB 2: PRODUCTS MANAGEMENT
      =================================================================== */}
      {activeTab === "products" && (
        <div className="animate-fade-in">
           <form onSubmit={handleProductSubmit} className={`flex flex-col gap-5 mb-10 p-6 md:p-8 rounded-3xl border backdrop-blur-sm ${editingId ? 'bg-indigo-900/10 border-indigo-500/30' : 'bg-white/5 border-white/10'}`}>
            <h3 className={`text-xl font-bold ${editingId ? 'text-indigo-400' : 'text-emerald-400'}`}>
              {editingId ? "Update Product 🛠️" : "Add New Product ➕"}
              {editingId && <button type="button" onClick={() => {setEditingId(null); setProduct({ title: "", price: "", category: "", thumbnail: "", description: "" });}} className="ml-4 text-sm text-rose-400 hover:text-rose-300 underline">Cancel Edit</button>}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <input type="text" name="title" value={product.title} onChange={(e) => setProduct({...product, title: e.target.value})} required placeholder="Product Title" className="px-4 py-3 rounded-xl bg-black/40 border border-gray-700 focus:border-emerald-500 focus:outline-none text-white transition-colors" />
              <input type="number" name="price" value={product.price} onChange={(e) => setProduct({...product, price: e.target.value})} required placeholder="Price (₹)" className="px-4 py-3 rounded-xl bg-black/40 border border-gray-700 focus:border-emerald-500 focus:outline-none text-white transition-colors" />
              
              <select name="category" value={product.category} onChange={(e) => setProduct({...product, category: e.target.value})} required className="px-4 py-3 rounded-xl bg-black/40 border border-gray-700 focus:border-emerald-500 focus:outline-none text-white transition-colors">
                <option value="" disabled className="text-gray-500">Select Category 🔽</option>
                {categoriesList.map((cat) => <option key={cat.id} value={cat.value} className="bg-gray-900">{cat.icon} {cat.name}</option>)}
              </select>
              
              <input type="text" name="thumbnail" value={product.thumbnail} onChange={(e) => setProduct({...product, thumbnail: e.target.value})} required placeholder="Image URL (Transparent PNG)" className="px-4 py-3 rounded-xl bg-black/40 border border-gray-700 focus:border-emerald-500 focus:outline-none text-white transition-colors" />
              <textarea name="description" value={product.description} onChange={(e) => setProduct({...product, description: e.target.value})} required rows="2" placeholder="Product Description..." className="px-4 py-3 rounded-xl bg-black/40 border border-gray-700 focus:border-emerald-500 focus:outline-none md:col-span-2 text-white transition-colors"></textarea>
            </div>
            <button type="submit" className={`mt-2 font-bold py-3.5 rounded-xl text-white shadow-lg transition-all ${editingId ? 'bg-indigo-500 hover:bg-indigo-400 shadow-indigo-500/20' : 'bg-emerald-500 hover:bg-emerald-400 shadow-emerald-500/20'}`}>
              {loading ? "Processing... ⏳" : (editingId ? "Update Product 🚀" : "Add Product 🚀")}
            </button>
          </form>

          <div className="space-y-4">
            {productsList.length === 0 ? (
               <div className="p-10 text-center text-gray-400 bg-white/5 rounded-3xl border border-white/5">
                 <span className="text-4xl mb-4 block">📦</span>
                 <p className="font-bold">No products available.</p>
               </div>
            ) : (
              paginatedProducts.map((item) => (
                <div key={item.id} className="bg-black/20 border border-white/5 p-5 rounded-3xl flex flex-col md:flex-row justify-between gap-6 hover:border-emerald-500/30 transition-all duration-300 shadow-lg group backdrop-blur-md">
                  <div className="flex gap-5 items-start md:items-center flex-1">
                    <div className="w-24 h-24 shrink-0 bg-white rounded-2xl p-2 border border-gray-700 flex items-center justify-center relative overflow-hidden shadow-inner">
                      <img src={item.thumbnail} alt={item.title} className="w-full h-full object-contain mix-blend-multiply group-hover:scale-110 transition-transform duration-500 ease-out" />
                    </div>
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-3 flex-wrap">
                        <h4 className="font-bold text-lg text-gray-100 group-hover:text-emerald-400 transition-colors">{item.title}</h4>
                        <span className="text-[10px] uppercase tracking-widest bg-white/10 text-gray-300 px-2.5 py-1 rounded-md border border-white/10">
                          {categoriesList.find(c => c.value === item.category)?.name || item.category}
                        </span>
                      </div>
                      <p className="text-sm text-gray-400 line-clamp-2 leading-relaxed max-w-3xl">{item.description}</p>
                      <p className="text-emerald-400 font-black text-xl mt-1">₹{formatPrice(item.price)}</p>
                    </div>
                  </div>
                  <div className="flex md:flex-col gap-2 shrink-0 justify-center">
                    <button onClick={() => handleEdit(item)} className="flex-1 bg-indigo-500/10 hover:bg-indigo-500 border border-indigo-500/30 text-indigo-400 hover:text-white px-5 py-2 rounded-xl font-bold text-sm transition">Edit</button>
                    <button onClick={() => setConfirmDialog({show: true, id: item.id, actionType: "DELETE_PRODUCT", message: "Delete Product?"})} className="flex-1 bg-rose-500/10 hover:bg-rose-600 border border-rose-500/30 text-rose-400 hover:text-white px-5 py-2 rounded-xl font-bold text-sm transition">Delete</button>
                  </div>
                </div>
              ))
            )}
            
            {productsList.length > 0 && (
              <div className="flex items-center justify-between px-6 py-4 bg-white/5 rounded-2xl border border-white/10 mt-6">
                <span className="text-sm text-gray-400 font-medium">Page {productsPage} of {totalProductPages}</span>
                <div className="flex gap-2">
                  <button onClick={() => setProductsPage(p => Math.max(p - 1, 1))} disabled={productsPage === 1} className="px-5 py-2 rounded-xl bg-white/10 text-white disabled:opacity-30 hover:bg-white/20 transition font-bold text-sm">Prev</button>
                  <button onClick={() => setProductsPage(p => Math.min(p + 1, totalProductPages))} disabled={productsPage === totalProductPages} className="px-5 py-2 rounded-xl bg-white/10 text-white disabled:opacity-30 hover:bg-white/20 transition font-bold text-sm">Next</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===================================================================
          TAB 3: ORDERS MANAGEMENT
      =================================================================== */}
      {activeTab === "orders" && (
        <div className="space-y-6 animate-fade-in">
          {ordersLoading ? (
             <div className="flex justify-center py-20">
               <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-500/20 border-t-emerald-400"></div>
             </div>
          ) : ordersList.length === 0 ? (
             <div className="p-10 text-center text-gray-400 bg-white/5 rounded-3xl border border-white/5">
                <p className="font-bold">No orders placed yet.</p>
             </div>
          ) : (
            <>
              {paginatedOrders.map((order) => (
                <div key={order.id} className="bg-black/30 border border-white/10 p-6 md:p-7 rounded-3xl flex flex-col md:flex-row justify-between gap-8 hover:border-emerald-500/40 transition-colors shadow-lg relative overflow-hidden">
                  <div className="flex-1 space-y-5">
                    <div className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/5">
                      <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex justify-center items-center font-black text-xl">
                        {(order.shipping?.name || "U").charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold text-lg">{order.shipping?.name || "Unknown Customer"}</p>
                        <p className="text-sm text-emerald-400/80">{order.userEmail || order.shipping?.email || `User ID: ${order.userId}`}</p>
                      </div>
                    </div>

                    <p className="text-sm text-gray-400">Order ID: <span className="text-white font-mono bg-black/40 px-2 py-1 rounded">{order.id}</span></p>

                    <div className="flex items-center gap-4 bg-black/40 p-4 rounded-2xl border border-white/5">
                      <div className="w-10 h-10 rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex justify-center items-center text-lg">🛵</div>
                      <div>
                        <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Delivery Partner ID</p>
                        <p className="text-sm font-semibold text-indigo-300 mt-0.5">{order.assignedTo || "Not Assigned / Pending"}</p>
                      </div>
                    </div>
                    
                    <div>
                      <span className={`inline-flex px-4 py-1.5 rounded-full text-xs font-black uppercase border ${
                        order.status === "Cancelled 🔴" ? "bg-rose-500/10 text-rose-400 border-rose-500/30" : 
                        order.status === "Delivered ✅" ? "bg-teal-500/10 text-teal-400 border-teal-500/30" :
                        "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                      }`}>{order.status}</span>
                    </div>
                  </div>

                  <div className="flex flex-col items-start md:items-end justify-between gap-6 bg-white/5 p-6 rounded-2xl border border-white/5 w-full md:w-72">
                    <div className="text-right w-full">
                      <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Total Amount</p>
                      <p className="text-3xl font-black text-emerald-400 mt-1">₹{formatPrice(order.totalAmount)}</p>
                    </div>
                    <div className="flex flex-col gap-3 w-full">
                      {order.status === "Order Confirmed 🟢" && (
                        <button onClick={() => updateOrderStatus(order.id, "Out for Delivery 🚚", "Sent to delivery!", "🚚")} className="w-full bg-indigo-500/20 hover:bg-indigo-500 border border-indigo-500/50 text-indigo-300 hover:text-white px-4 py-3 rounded-xl font-bold transition">Send to Delivery</button>
                      )}
                      {order.status === "Out for Delivery 🚚" && (
                         <button onClick={() => updateOrderStatus(order.id, "Delivered ✅", "Order delivered!", "✅")} className="w-full bg-teal-500/20 hover:bg-teal-500 border border-teal-500/50 text-teal-300 hover:text-white px-4 py-3 rounded-xl font-bold transition">Mark Delivered</button>
                      )}
                      {order.status !== "Cancelled 🔴" && (
                        <button onClick={() => setConfirmDialog({show: true, id: order.id, actionType: "CANCEL_ORDER", message: "Cancel this order?"})} className="w-full bg-orange-500/10 hover:bg-orange-500 border border-orange-500/30 text-orange-400 hover:text-white px-4 py-3 rounded-xl font-bold transition">Cancel Order</button>
                      )}
                      <button onClick={() => setConfirmDialog({show: true, id: order.id, actionType: "DELETE_ORDER", message: "Delete this record forever?"})} className="w-full bg-rose-500 hover:bg-rose-600 shadow-lg shadow-rose-500/20 text-white px-4 py-3 rounded-xl font-bold transition mt-1">Delete Order 🗑️</button>
                    </div>
                  </div>
                </div>
              ))}
              <div className="flex items-center justify-between px-6 py-4 bg-white/5 rounded-2xl border border-white/10 mt-6">
                <span className="text-sm text-gray-400 font-medium">Page {ordersPage} of {totalOrderPages}</span>
                <div className="flex gap-2">
                  <button onClick={() => setOrdersPage(p => Math.max(p - 1, 1))} disabled={ordersPage === 1} className="px-5 py-2 rounded-xl bg-white/10 text-white disabled:opacity-30 hover:bg-white/20 transition font-bold text-sm">Prev</button>
                  <button onClick={() => setOrdersPage(p => Math.min(p + 1, totalOrderPages))} disabled={ordersPage === totalOrderPages} className="px-5 py-2 rounded-xl bg-white/10 text-white disabled:opacity-30 hover:bg-white/20 transition font-bold text-sm">Next</button>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ===================================================================
          TAB 4: USERS & STAFF DIRECTORY
      =================================================================== */}
      {activeTab === "users" && (
        <div className="animate-fade-in space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-center bg-white/5 p-6 md:p-8 rounded-3xl border border-white/10 gap-4">
            <div>
              <h3 className="text-2xl font-bold text-white">Staff & User Directory</h3>
              <p className="text-sm text-gray-400 mt-1">Manage Roles, Admins, and Delivery Personnel.</p>
            </div>
            <button onClick={fetchUsers} className="bg-emerald-500 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-emerald-500/20 hover:bg-emerald-400 transition whitespace-nowrap w-full md:w-auto">
              🔄 Refresh Directory
            </button>
          </div>

          <div className="bg-black/30 rounded-3xl border border-white/10 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left min-w-[600px]">
                <thead className="bg-white/5 text-gray-400 text-xs uppercase font-black tracking-widest border-b border-white/10">
                  <tr>
                    <th className="p-6">User / Email</th>
                    <th className="p-6">System Role</th>
                    <th className="p-6">Joined Date</th>
                    <th className="p-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedUsers.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="p-10 text-center text-gray-500 font-bold">No Users Found.</td>
                    </tr>
                  ) : (
                    paginatedUsers.map((u) => (
                      <tr key={u.id} className="border-b border-white/5 hover:bg-white/5 transition-colors group">
                        <td className="p-6">
                          <p className="font-bold text-white text-lg">{u.fullName || "User"}</p>
                          <p className="text-sm text-gray-400">{u.email}</p>
                        </td>
                        <td className="p-6">
                          <span className={`px-4 py-1.5 text-xs font-black uppercase tracking-wider rounded-lg border ${
                            u.role === 'admin' ? 'bg-rose-500/10 text-rose-400 border-rose-500/30' : 
                            u.role === 'deliveryboy' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30' : 
                            'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          }`}>
                            {u.role || "customer"}
                          </span>
                        </td>
                        <td className="p-6 text-gray-400 text-sm font-medium">
                          {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "-"}
                        </td>
                        <td className="p-6 text-right">
                          <button className="bg-white/5 hover:bg-white/10 border border-white/10 text-white px-4 py-2 rounded-lg font-bold text-sm transition">Manage</button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {usersList.length > 0 && (
              <div className="flex items-center justify-between px-6 py-4 bg-white/5 border-t border-white/10">
                <span className="text-sm text-gray-400 font-medium">Page {usersPage} of {totalUserPages}</span>
                <div className="flex gap-2">
                  <button onClick={() => setUsersPage(p => Math.max(p - 1, 1))} disabled={usersPage === 1} className="px-5 py-2 rounded-xl bg-white/10 text-white disabled:opacity-30 hover:bg-white/20 transition font-bold text-sm">Prev</button>
                  <button onClick={() => setUsersPage(p => Math.min(p + 1, totalUserPages))} disabled={usersPage === totalUserPages} className="px-5 py-2 rounded-xl bg-white/10 text-white disabled:opacity-30 hover:bg-white/20 transition font-bold text-sm">Next</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Admin;