import { useState, useEffect, useMemo } from "react";
import toast from 'react-hot-toast';
import { useSelector } from "react-redux";
import { 
  addProductToDB, getAllProducts, deleteProductFromDB, updateProductInDB, updateProductStock,
  getAllOrders, cancelOrderInDB, deleteOrderFromDB, updateOrderStatusInDB 
} from "../services/productservices";
import { getAllUsers } from "../services/auth/authService"; 
import { formatPrice } from "../utils/priceFormatter";
import { db } from "../services/firebase";
import { doc, getDoc, updateDoc, arrayUnion } from "firebase/firestore";

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
  const [activeTab, setActiveTab] = useState("analytics"); 
  
  const [product, setProduct] = useState({ 
    title: "", 
    mrp: "",          
    costPrice: "",    
    price: "",        
    discount: "",     
    stock: "", 
    category: "", 
    thumbnail: "", 
    description: "" 
  });

  const [productsList, setProductsList] = useState([]);
  const [ordersList, setOrdersList] = useState([]);
  const [usersList, setUsersList] = useState([]); 
  const [editingId, setEditingId] = useState(null);
  
  const [loading, setLoading] = useState(false);
  
  // Search, Gifting & Centered Inventory Edit Modals
  const [orderSearchQuery, setOrderSearchQuery] = useState("");
  const [giftModal, setGiftModal] = useState({ show: false, userId: null, userEmail: "", amount: "" });
  const [stockModal, setStockModal] = useState({ show: false, product: null, stock: "", costPrice: "", price: "" });

  const user = useSelector((state) => state.auth.user);
  const userRole = useSelector((state) => state.auth.role);

  const [confirmDialog, setConfirmDialog] = useState({ show: false, id: null, actionType: "", message: "" });

  const [productsPage, setProductsPage] = useState(1);
  const [ordersPage, setOrdersPage] = useState(1);
  const [usersPage, setUsersPage] = useState(1); 
  const [inventoryPage, setInventoryPage] = useState(1);
  const [inventoryCategory, setInventoryCategory] = useState("");
  
  const productsPerPage = 8; 
  const ordersPerPage = 8;
  const usersPerPage = 10; 
  const inventoryPerPage = 8; 

  const totalOrdersCount = ordersList.length;
  const deliveredOrders = ordersList.filter((o) => o.status === "Delivered ✅" || o.status === "Delivered" || o.status?.includes("Deliver"));
  
  const totalRevenue = deliveredOrders.reduce((sum, order) => sum + (Number(order.totalAmount) || 0), 0);

  // Accurate Store Owner Profit Calculation
  const totalOwnerProfit = useMemo(() => {
    let profit = 0;
    deliveredOrders.forEach(order => {
      const items = order.items || order.cartItems || [];
      items.forEach(item => {
        const prod = productsList.find(p => p.id === item.id || p.id === item.productId);
        const sellingPrice = Number(item.price || prod?.price || 0);
        const costPrice = Number(prod?.costPrice ?? (sellingPrice * 0.5)); 
        const itemProfit = (sellingPrice - costPrice) * (Number(item.quantity) || 1);
        profit += itemProfit;
      });
    });
    return profit;
  }, [deliveredOrders, productsList]);

  // Top Selling & Low Selling Products with Images
  const { topSellingProducts, lowSellingProducts } = useMemo(() => {
    const salesCount = {};
    productsList.filter(Boolean).forEach(p => { salesCount[p.id] = 0; });

    ordersList.forEach(order => {
      const items = order.items || order.cartItems || []; 
      items.forEach(item => {
        const matchedId = item.id || item.productId;
        if (matchedId && salesCount[matchedId] !== undefined) {
          salesCount[matchedId] = (salesCount[matchedId] || 0) + (Number(item.quantity) || 1);
        }
      });
    });

    const mappedProducts = Object.keys(salesCount)
      .map(id => {
        const prod = productsList.find(p => p.id === id);
        return prod ? { ...prod, totalSold: salesCount[id] } : null;
      })
      .filter(p => p !== null);

    const sortedByHigh = [...mappedProducts].sort((a, b) => b.totalSold - a.totalSold);
    const sortedByLow = [...mappedProducts].sort((a, b) => a.totalSold - b.totalSold);

    return {
      topSellingProducts: sortedByHigh.slice(0, 4),
      lowSellingProducts: sortedByLow.slice(0, 4)
    };
  }, [ordersList, productsList]);

  const filteredOrders = useMemo(() => {
    if (!orderSearchQuery.trim()) return ordersList;
    const query = orderSearchQuery.toLowerCase();
    return ordersList.filter(o => 
      o.id?.toLowerCase().includes(query) || 
      o.shipping?.name?.toLowerCase().includes(query) ||
      o.userEmail?.toLowerCase().includes(query)
    );
  }, [ordersList, orderSearchQuery]);

  const totalProductPages = Math.max(1, Math.ceil(productsList.length / productsPerPage));
  const totalOrderPages = Math.max(1, Math.ceil(filteredOrders.length / ordersPerPage));
  const totalUserPages = Math.max(1, Math.ceil(usersList.length / usersPerPage)); 

  const paginatedProducts = productsList.slice((productsPage - 1) * productsPerPage, productsPage * productsPerPage);
  const paginatedOrders = filteredOrders.slice((ordersPage - 1) * ordersPerPage, ordersPage * ordersPerPage);
  const paginatedUsers = usersList.slice((usersPage - 1) * usersPerPage, usersPage * usersPerPage); 
  
  const filteredInventory = inventoryCategory ? productsList.filter(p => p.category === inventoryCategory) : productsList.slice();
  const totalInventoryPages = Math.max(1, Math.ceil(filteredInventory.length / inventoryPerPage));
  const paginatedInventory = filteredInventory.slice((inventoryPage - 1) * inventoryPerPage, inventoryPage * inventoryPerPage);

  const showCustomAlert = (message, icon) => {
    toast.success(`${icon || ''} ${message}`, {
      className: 'dark:bg-[#111827] dark:text-white dark:border-white/10 bg-white text-gray-950 border-gray-200 shadow-lg'
    });
  };

  useEffect(() => {
    fetchProducts();
    fetchOrders();
    fetchUsers();
  }, []);

  const fetchProducts = async () => {
    try {
      const products = await getAllProducts();
      setProductsList(products || []);
    } catch (error) { 
      console.error("Error fetching products:", error); 
    }
  };

  const fetchOrders = async () => {
    try {
      const orders = await getAllOrders();
      setOrdersList(orders || []);
    } catch (error) { 
      console.error("Error fetching orders:", error); 
    }
  };

  const fetchUsers = async () => {
    try {
      const users = await getAllUsers();
      setUsersList(users || []);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const handleSendGiftMoney = async () => {
    const { userId, amount } = giftModal;
    const giftAmount = Number(amount);
    if (!userId || isNaN(giftAmount) || giftAmount <= 0) {
      toast.error("Please enter a valid gift amount.");
      return;
    }

    try {
      const userRef = doc(db, "users", userId);
      const snap = await getDoc(userRef);
      const currentWallet = (snap.exists() && snap.data().wallet) || { balance: 0, transactions: [] };
      const newBalance = (currentWallet.balance || 0) + giftAmount;

      const newTx = {
        type: "credit",
        amount: giftAmount,
        note: "🎁 Store Owner Gift Bonus",
        date: new Date().toISOString()
      };

      await updateDoc(userRef, {
        "wallet.balance": newBalance,
        "wallet.transactions": arrayUnion(newTx)
      });

      toast.success(`Successfully gifted ₹${formatPrice(giftAmount)} to user!`);
      setGiftModal({ show: false, userId: null, userEmail: "", amount: "" });
      fetchUsers();
    } catch (err) {
      console.error("Gift wallet error:", err);
      toast.error("Failed to send gift money.");
    }
  };

  const handleUpdateInventoryItem = async () => {
    const { product, stock, costPrice, price } = stockModal;
    if (!product) return;

    try {
      await updateProductInDB(product.id, {
        stock: Number(stock),
        costPrice: Number(costPrice),
        price: Number(price)
      });
      toast.success("Inventory updated successfully!");
      setStockModal({ show: false, product: null, stock: "", costPrice: "", price: "" });
      fetchProducts();
    } catch (err) {
      console.error("Inventory update error:", err);
      toast.error("Failed to update inventory.");
    }
  };

  const handlePricingChange = (field, value) => {
    const updated = { ...product, [field]: value };
    const mrp = Number(field === 'mrp' ? value : updated.mrp) || 0;
    const discount = Number(field === 'discount' ? value : updated.discount) || 0;
    
    if (mrp > 0 && discount >= 0) {
      const finalPrice = mrp - (mrp * discount / 100);
      updated.price = Math.round(finalPrice * 100) / 100;
    }
    setProduct(updated);
  };

  const handleProductSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);  
    
    const productData = { 
      ...product, 
      mrp: Number(product.mrp || product.price || 0),
      costPrice: Number(product.costPrice || 0), 
      price: Number(product.price || 0),         
      discount: Number(product.discount || 0),   
      stock: Number(product.stock || 0)
    };
    
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
    setProduct({ title: "", mrp: "", costPrice: "", price: "", discount: "", stock: "", category: "", thumbnail: "", description: "" });
    fetchProducts();
    setLoading(false);
  };

  const handleEdit = (item) => {
    setProduct({ 
      ...item, 
      mrp: item.mrp || item.price || "", 
      costPrice: item.costPrice || "", 
      price: item.price || "", 
      discount: item.discount || "", 
      stock: item.stock || "" 
    });
    setEditingId(item.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const executeConfirmAction = async () => {
    const { id, actionType } = confirmDialog;
    setConfirmDialog({ show: false, id: null, actionType: "", message: "" });

    if (actionType === "CANCEL_ORDER") {
      await cancelOrderInDB(id, { isAdmin: true });
      fetchOrders(); 
      showCustomAlert("Order Cancelled", "🚫");
    } else if (actionType === "DELETE_ORDER") {
      await deleteOrderFromDB(id);
      fetchOrders(); 
      showCustomAlert("Order Deleted", "🗑️");
    } else if (actionType === "DELETE_PRODUCT") {
      await deleteProductFromDB(id);
      fetchProducts(); 
      showCustomAlert("Product Deleted", "🗑️");
    }
  };

  return (
    <div className="max-w-[1400px] mx-auto mt-8 p-4 md:p-8 bg-white/90 dark:bg-gradient-to-b dark:from-[#0a0f16]/95 dark:to-[#05080c]/95 backdrop-blur-3xl rounded-[2rem] md:rounded-[2.5rem] border border-gray-200 dark:border-white/10 shadow-xl dark:shadow-2xl text-gray-900 dark:text-white relative min-h-[85vh] transition-colors duration-500">
      
      {/* Gift Modal */}
      {giftModal.show && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-gray-900/40 dark:bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white dark:bg-[#111827] border p-8 rounded-3xl max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-2xl font-black text-gray-900 dark:text-white">🎁 Gift Wallet Bonus</h3>
            <p className="text-sm text-gray-500">Send bonus money to user: <span className="font-bold text-emerald-600">{giftModal.userEmail}</span></p>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase">Amount (₹)</label>
              <input 
                type="number" 
                value={giftModal.amount} 
                onChange={(e) => setGiftModal({ ...giftModal, amount: e.target.value })} 
                placeholder="e.g. 100" 
                className="w-full mt-1 px-4 py-3 rounded-xl border bg-gray-50 dark:bg-black/40 text-gray-900 dark:text-white font-bold" 
              />
            </div>
            <div className="flex gap-3 justify-end pt-2">
              <button onClick={() => setGiftModal({ show: false, userId: null, userEmail: "", amount: "" })} className="px-4 py-2 rounded-xl bg-gray-100 dark:bg-white/5 font-bold">Cancel</button>
              <button onClick={handleSendGiftMoney} className="px-5 py-2 rounded-xl bg-emerald-500 text-white font-bold">Send Gift 🚀</button>
            </div>
          </div>
        </div>
      )}

      {/* Perfectly Centered Fixed Inventory Modal */}
      {stockModal.show && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-fade-in">
          <div className="bg-white dark:bg-[#111827] border border-gray-200 dark:border-white/10 p-8 rounded-3xl max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-2xl font-black text-gray-900 dark:text-white">📦 Manage Inventory</h3>
            <p className="text-sm text-gray-500 line-clamp-1">Product: <span className="font-bold text-emerald-600">{stockModal.product?.title}</span></p>
            
            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Stock Quantity</label>
                <input type="number" value={stockModal.stock} onChange={(e) => setStockModal({ ...stockModal, stock: e.target.value })} className="w-full mt-1 px-4 py-3 rounded-xl border bg-gray-50 dark:bg-black/40 text-gray-900 dark:text-white font-bold" />
              </div>
              <div>
                <label className="text-xs font-bold text-amber-600 uppercase">Buying Cost (₹)</label>
                <input type="number" value={stockModal.costPrice} onChange={(e) => setStockModal({ ...stockModal, costPrice: e.target.value })} className="w-full mt-1 px-4 py-3 rounded-xl border bg-amber-50 dark:bg-amber-500/10 text-amber-600 font-bold" />
              </div>
              <div>
                <label className="text-xs font-bold text-emerald-600 uppercase">Selling Price (₹)</label>
                <input type="number" value={stockModal.price} onChange={(e) => setStockModal({ ...stockModal, price: e.target.value })} className="w-full mt-1 px-4 py-3 rounded-xl border bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 font-bold" />
              </div>
            </div>

            <div className="flex gap-3 justify-end pt-2">
              <button onClick={() => setStockModal({ show: false, product: null, stock: "", costPrice: "", price: "" })} className="px-4 py-2 rounded-xl bg-gray-100 dark:bg-white/5 font-bold">Cancel</button>
              <button onClick={handleUpdateInventoryItem} className="px-5 py-2 rounded-xl bg-indigo-600 text-white font-bold">Save Changes 💾</button>
            </div>
          </div>
        </div>
      )}

      {confirmDialog.show && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-gray-900/40 dark:bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-[#111827] border p-8 rounded-3xl max-w-md w-full text-center shadow-2xl">
            <div className="text-5xl mb-4">⚠️</div>
            <h3 className="text-2xl font-black mb-2">Are you sure?</h3>
            <p className="text-gray-500 mb-8 text-sm">{confirmDialog.message}</p>
            <div className="flex gap-4 justify-center">
              <button onClick={() => setConfirmDialog({ show: false, id: null, actionType: "", message: "" })} className="flex-1 bg-gray-100 dark:bg-white/5 py-3 rounded-xl font-bold">Cancel</button>
              <button onClick={executeConfirmAction} className="flex-1 bg-rose-500 text-white py-3 rounded-xl font-bold">Confirm</button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
        <div>
          <h2 className="text-3xl md:text-5xl font-black uppercase tracking-widest bg-gradient-to-r from-emerald-500 to-teal-600 bg-clip-text text-transparent">
            Control Center 🎛️
          </h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">Manage Store, Products, Inventory, Orders & Users.</p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-2 md:gap-3 mb-8 border-b border-gray-200 dark:border-white/10 pb-6">
        {[
          { id: "analytics", label: "📊 Analytics & Profit" },
          { id: "products", label: "📦 Products" },
          { id: "inventory", label: "📋 Inventory" },
          { id: "orders", label: "🛒 Orders" },
          { id: "users", label: "👥 Users & Wallet" }
        ].map((tab) => (
          <button 
            key={tab.id}
            onClick={() => setActiveTab(tab.id)} 
            className={`px-4 md:px-6 py-2.5 rounded-xl font-bold transition-all text-sm md:text-base ${
              activeTab === tab.id 
              ? "bg-emerald-500 text-white shadow-md scale-105" 
              : "bg-gray-50 dark:bg-white/5 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 border border-gray-200 dark:border-white/5"
            }`}>
              {tab.label}
          </button>
        ))}
      </div>

      {/* ================= TAB 1: ANALYTICS ================= */}
      {activeTab === "analytics" && (
        <div className="animate-fade-in space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-gradient-to-br dark:from-[#111827] dark:to-[#1f2937] p-7 rounded-[2rem] border shadow-md">
              <p className="text-gray-500 dark:text-gray-400 font-bold text-sm tracking-wider uppercase">Total Revenue</p>
              <h3 className="text-4xl font-black text-emerald-600 dark:text-emerald-400 mt-3">₹{formatPrice(totalRevenue)}</h3>
            </div>
            
            <div className="bg-white dark:bg-gradient-to-br dark:from-[#111827] dark:to-[#1f2937] p-7 rounded-[2rem] border shadow-md">
              <p className="text-gray-500 dark:text-gray-400 font-bold text-sm tracking-wider uppercase">Store Owner Net Profit 💰</p>
              <h3 className="text-4xl font-black text-indigo-600 dark:text-indigo-400 mt-3">₹{formatPrice(totalOwnerProfit)}</h3>
            </div>

            <div className="bg-white dark:bg-gradient-to-br dark:from-[#111827] dark:to-[#1f2937] p-7 rounded-[2rem] border shadow-md">
              <p className="text-gray-500 dark:text-gray-400 font-bold text-sm tracking-wider uppercase">Delivered Orders</p>
              <h3 className="text-4xl font-black text-blue-600 dark:text-blue-400 mt-3">{deliveredOrders.length}</h3>
            </div>
          </div>

          {/* Top & Low Selling Products with Images */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-[#111827]/50 p-6 rounded-3xl border shadow-sm space-y-4">
              <h3 className="text-xl font-black flex items-center gap-2">🔥 Top Selling Products</h3>
              {topSellingProducts.length > 0 ? (
                <div className="space-y-3">
                  {topSellingProducts.map((p, idx) => (
                    <div key={p.id} className="flex justify-between items-center bg-gray-50 dark:bg-black/30 p-3 rounded-2xl border gap-4">
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-emerald-500">#{idx + 1}</span>
                        <div className="w-12 h-12 bg-white rounded-xl p-1 shrink-0 border flex items-center justify-center overflow-hidden">
                          <img src={p.thumbnail} alt={p.title} className="w-full h-full object-contain" />
                        </div>
                        <span className="font-semibold text-sm line-clamp-1">{p.title}</span>
                      </div>
                      <span className="bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold px-3 py-1 rounded-xl text-xs">{p.totalSold} Sold</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 text-sm">No sales data recorded yet.</p>
              )}
            </div>

            <div className="bg-white dark:bg-[#111827]/50 p-6 rounded-3xl border shadow-sm space-y-4">
              <h3 className="text-xl font-black flex items-center gap-2">📉 Lowest Selling Products</h3>
              {lowSellingProducts.length > 0 ? (
                <div className="space-y-3">
                  {lowSellingProducts.map((p) => (
                    <div key={p.id} className="flex justify-between items-center bg-gray-50 dark:bg-black/30 p-3 rounded-2xl border gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-white rounded-xl p-1 shrink-0 border flex items-center justify-center overflow-hidden">
                          <img src={p.thumbnail} alt={p.title} className="w-full h-full object-contain" />
                        </div>
                        <span className="font-semibold text-sm line-clamp-1">{p.title}</span>
                      </div>
                      <span className="bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 font-bold px-3 py-1 rounded-xl text-xs">{p.totalSold || 0} Sold</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 text-sm">No product data available.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 2: PRODUCTS (WITH OWNER PROFIT BREAKDOWN) ================= */}
      {activeTab === "products" && (
        <div className="animate-fade-in">
           <form onSubmit={handleProductSubmit} className={`flex flex-col gap-5 mb-8 p-6 md:p-8 rounded-3xl border ${editingId ? 'bg-indigo-50 border-indigo-200' : 'bg-gray-50 dark:bg-black/40 border-gray-200 dark:border-white/10'}`}>
            <h3 className={`text-xl font-black flex items-center justify-between ${editingId ? 'text-indigo-600' : 'text-emerald-600'}`}>
              {editingId ? "Update Product 🛠️" : "Add New Product ➕"}
              {editingId && <button type="button" onClick={() => {setEditingId(null); setProduct({ title: "", mrp: "", costPrice: "", price: "", discount: "", stock: "", category: "", thumbnail: "", description: "" });}} className="text-xs text-rose-600 underline">Cancel</button>}
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase">Product Title</label>
                <input type="text" value={product.title} onChange={(e) => setProduct({...product, title: e.target.value})} required placeholder="e.g. Jeans" className="w-full px-4 py-3 rounded-xl border outline-none bg-white dark:bg-white/5" />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase">MRP Price (₹)</label>
                <input type="number" value={product.mrp} onChange={(e) => handlePricingChange('mrp', e.target.value)} required placeholder="e.g. 40" className="w-full px-4 py-3 rounded-xl border outline-none bg-white dark:bg-white/5" />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-amber-600 uppercase">Buying Cost (₹)</label>
                <input type="number" value={product.costPrice} onChange={(e) => setProduct({...product, costPrice: e.target.value})} required placeholder="e.g. 20" className="w-full px-4 py-3 rounded-xl border outline-none bg-amber-50 dark:bg-amber-500/10 text-amber-600 font-bold" />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase">Discount (%)</label>
                <input type="number" value={product.discount} onChange={(e) => handlePricingChange('discount', e.target.value)} placeholder="e.g. 10%" className="w-full px-4 py-3 rounded-xl border outline-none bg-white dark:bg-white/5" />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-emerald-600 uppercase">Selling Price (₹)</label>
                <input type="number" value={product.price} onChange={(e) => setProduct({...product, price: e.target.value})} required placeholder="Selling price" className="w-full px-4 py-3 rounded-xl border outline-none bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 font-bold" />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase">Stock</label>
                <input type="number" value={product.stock} onChange={(e) => setProduct({...product, stock: e.target.value})} required placeholder="e.g. 50" className="w-full px-4 py-3 rounded-xl border outline-none bg-white dark:bg-white/5" />
              </div>
              
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase">Category</label>
                <select value={product.category} onChange={(e) => setProduct({...product, category: e.target.value})} required className="w-full px-4 py-3 rounded-xl border outline-none bg-white dark:bg-black/60">
                  <option value="" disabled>Select Category...</option>
                  {categoriesList.map((cat) => <option key={cat.id} value={cat.value}>{cat.icon} {cat.name}</option>)}
                </select>
              </div>
              
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase">Image URL</label>
                <input type="text" value={product.thumbnail} onChange={(e) => setProduct({...product, thumbnail: e.target.value})} required placeholder="https://..." className="w-full px-4 py-3 rounded-xl border outline-none bg-white dark:bg-white/5" />
              </div>

              <div className="space-y-1 sm:col-span-full">
                <label className="text-xs font-bold text-gray-500 uppercase">Description</label>
                <textarea value={product.description} onChange={(e) => setProduct({...product, description: e.target.value})} required rows="2" placeholder="Details..." className="w-full px-4 py-3 rounded-xl border outline-none bg-white dark:bg-white/5 resize-none"></textarea>
              </div>
            </div>
            
            <button type="submit" className="font-black py-3 rounded-xl text-white uppercase tracking-widest bg-emerald-500 hover:bg-emerald-600 shadow-lg">
              {loading ? "Saving... ⏳" : (editingId ? "Update Product 🚀" : "Publish Product 🚀")}
            </button>
          </form>

          {/* Catalog Listing with Profit Breakdown */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Product Catalog & Profit Breakdown</h3>
            {productsList.length === 0 ? (
               <div className="p-10 text-center text-gray-400">No products found.</div>
            ) : (
              <>
                {paginatedProducts.map((item) => {
                  const sellingPrice = Number(item.price) || 0;
                  const costPrice = Number(item.costPrice ?? (sellingPrice * 0.5)); 
                  const profitPerItem = sellingPrice - costPrice;
                  const profitMargin = costPrice > 0 ? ((profitPerItem / costPrice) * 100).toFixed(1) : 0;

                  return (
                    <div key={item.id} className="bg-white dark:bg-black/30 border p-4 md:p-6 rounded-3xl flex flex-col md:flex-row justify-between gap-4 shadow-sm items-center">
                      <div className="flex gap-4 items-center flex-1">
                        <div className="w-20 h-20 bg-gray-50 dark:bg-white rounded-2xl p-2 flex items-center justify-center shrink-0 border">
                          <img src={item.thumbnail} alt={item.title} className="w-full h-full object-contain" />
                        </div>
                        <div className="space-y-1">
                          <h4 className="font-bold text-lg text-gray-900 dark:text-white">{item.title}</h4>
                          <div className="flex flex-wrap gap-2 text-xs">
                            <span className="bg-gray-100 dark:bg-white/10 px-2 py-0.5 rounded">MRP: ₹{item.mrp || item.price}</span>
                            <span className="bg-amber-50 text-amber-600 px-2 py-0.5 rounded font-semibold">Cost: ₹{item.costPrice || 0}</span>
                          </div>
                          <p className="text-emerald-600 font-black text-lg pt-1">Selling: ₹{formatPrice(sellingPrice)}</p>
                        </div>
                      </div>

                      {/* Owner Profit Per Unit Card */}
                      <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 p-3 rounded-2xl text-center shrink-0 min-w-[160px]">
                        <p className="text-[10px] uppercase font-bold text-emerald-600">Owner Profit / Unit</p>
                        <p className="text-lg font-black text-emerald-600">₹{formatPrice(profitPerItem)}</p>
                        <p className="text-[10px] text-gray-500">Margin: {profitMargin}%</p>
                      </div>

                      <div className="flex gap-2 w-full md:w-28 shrink-0">
                        <button onClick={() => handleEdit(item)} className="flex-1 bg-gray-100 dark:bg-white/5 border py-2 rounded-xl font-bold text-sm">Edit</button>
                        <button onClick={() => setConfirmDialog({show: true, id: item.id, actionType: "DELETE_PRODUCT", message: "Delete?"})} className="flex-1 bg-rose-50 text-rose-600 border py-2 rounded-xl font-bold text-sm">Delete</button>
                      </div>
                    </div>
                  );
                })}

                {totalProductPages > 1 && (
                  <div className="flex items-center justify-between px-6 py-4 bg-gray-50 dark:bg-white/5 rounded-2xl border">
                    <span className="text-sm font-medium">Page {productsPage} of {totalProductPages}</span>
                    <div className="flex gap-2">
                      <button onClick={() => setProductsPage(p => Math.max(p - 1, 1))} disabled={productsPage === 1} className="px-4 py-2 rounded-xl bg-white dark:bg-white/10 border font-bold text-sm disabled:opacity-30">Prev</button>
                      <button onClick={() => setProductsPage(p => Math.min(p + 1, totalProductPages))} disabled={productsPage === totalProductPages} className="px-4 py-2 rounded-xl bg-emerald-500 text-white font-bold text-sm disabled:opacity-30">Next</button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* ================= TAB 3: INVENTORY ================= */}
      {activeTab === "inventory" && (
        <div className="animate-fade-in space-y-6">
          <div className="flex items-center justify-between gap-4">
            <h3 className="text-xl font-bold">Inventory Stock & Pricing Management</h3>
            <select value={inventoryCategory} onChange={(e) => { setInventoryCategory(e.target.value); setInventoryPage(1); }} className="px-4 py-2 rounded-xl border bg-gray-50 dark:bg-black/40 text-sm font-bold">
              <option value="">All Categories</option>
              {categoriesList.map(c => <option key={c.id} value={c.value}>{c.name}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {paginatedInventory.map((p) => (
              <div key={p.id} className="bg-white dark:bg-black/30 border p-5 rounded-3xl flex items-center gap-4 shadow-sm">
                <img src={p.thumbnail} alt={p.title} className="w-16 h-16 object-contain bg-white rounded-xl p-1 shrink-0 border" />
                <div className="flex-1">
                  <h4 className="font-bold text-sm line-clamp-1">{p.title}</h4>
                  <p className="text-xs text-gray-500 mt-1">Stock: <span className="font-bold text-emerald-600">{p.stock ?? 0}</span> | Cost: ₹{p.costPrice || 0}</p>
                </div>
                <button 
                  onClick={() => setStockModal({ show: true, product: p, stock: p.stock ?? 0, costPrice: p.costPrice || 0, price: p.price || 0 })} 
                  className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold text-xs shadow-md"
                >
                  Edit Stock & Cost ⚙️
                </button>
              </div>
            ))}
          </div>

          {totalInventoryPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 bg-gray-50 dark:bg-white/5 rounded-2xl border">
              <span className="text-sm font-medium">Page {inventoryPage} of {totalInventoryPages}</span>
              <div className="flex gap-2">
                <button onClick={() => setInventoryPage(p => Math.max(p - 1, 1))} disabled={inventoryPage === 1} className="px-4 py-2 rounded-xl bg-white dark:bg-white/10 border font-bold text-sm disabled:opacity-30">Prev</button>
                <button onClick={() => setInventoryPage(p => Math.min(p + 1, totalInventoryPages))} disabled={inventoryPage === totalInventoryPages} className="px-4 py-2 rounded-xl bg-emerald-500 text-white font-bold text-sm disabled:opacity-30">Next</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ================= TAB 4: ORDERS ================= */}
      {activeTab === "orders" && (
        <div className="space-y-6 animate-fade-in">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h3 className="text-xl font-bold">All Customer Orders History ({ordersList.length})</h3>
            <input 
              type="text" 
              value={orderSearchQuery} 
              onChange={(e) => { setOrderSearchQuery(e.target.value); setOrdersPage(1); }} 
              placeholder="🔍 Search by Order ID or Customer Name..." 
              className="w-full sm:w-80 px-4 py-2.5 rounded-xl border bg-gray-50 dark:bg-black/40 text-sm font-bold outline-none focus:border-emerald-500 shadow-sm"
            />
          </div>

          {filteredOrders.length === 0 ? (
            <div className="p-12 text-center text-gray-400">No orders found.</div>
          ) : (
            <>
              <div className="space-y-4">
                {paginatedOrders.map((order) => (
                  <div key={order.id} className="bg-white dark:bg-black/40 border p-6 rounded-3xl shadow-sm flex flex-col md:flex-row justify-between gap-4 items-center">
                    <div>
                      <p className="font-bold text-lg">{order.shipping?.name || order.userEmail || "Customer"}</p>
                      <p className="text-xs text-gray-400 font-mono">ID: {order.id}</p>
                      <p className="text-xs text-gray-500 mt-1">Date: {new Date(order.date).toLocaleString('en-IN')}</p>
                      <p className="text-emerald-600 font-black text-xl mt-2">₹{formatPrice(order.totalAmount)}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2 w-full md:w-auto">
                      <span className="text-xs font-bold uppercase bg-gray-100 dark:bg-white/10 px-3 py-1 rounded text-center">{order.status}</span>
                      <button onClick={() => setConfirmDialog({show: true, id: order.id, actionType: "DELETE_ORDER", message: "Delete order?"})} className="bg-rose-500 text-white py-2 px-4 rounded-xl font-bold text-xs">Delete Order</button>
                    </div>
                  </div>
                ))}
              </div>

              {totalOrderPages > 1 && (
                <div className="flex items-center justify-between px-6 py-4 bg-gray-50 dark:bg-white/5 rounded-2xl border">
                  <span className="text-sm font-medium">Page {ordersPage} of {totalOrderPages}</span>
                  <div className="flex gap-2">
                    <button onClick={() => setOrdersPage(p => Math.max(p - 1, 1))} disabled={ordersPage === 1} className="px-4 py-2 rounded-xl bg-white dark:bg-white/10 border font-bold text-sm disabled:opacity-30">Prev</button>
                    <button onClick={() => setOrdersPage(p => Math.min(p + 1, totalOrderPages))} disabled={ordersPage === totalOrderPages} className="px-4 py-2 rounded-xl bg-emerald-500 text-white font-bold text-sm disabled:opacity-30">Next</button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ================= TAB 5: USERS & WALLET GIFTING ================= */}
      {activeTab === "users" && (
        <div className="animate-fade-in space-y-6">
          <div className="bg-white dark:bg-black/40 rounded-3xl border overflow-hidden shadow-sm">
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-50 dark:bg-white/5 text-gray-400 text-xs uppercase font-black border-b">
                <tr>
                  <th className="p-6">User Details</th>
                  <th className="p-6">Role</th>
                  <th className="p-6 text-right">Gift Wallet Money</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                {usersList.length === 0 ? (
                  <tr><td colSpan="3" className="p-10 text-center text-gray-400">No users found.</td></tr>
                ) : (
                  paginatedUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                      <td className="p-6">
                        <p className="font-black text-base">{u.fullName || "Guest"}</p>
                        <p className="text-xs text-gray-400">{u.email}</p>
                      </td>
                      <td className="p-6">
                        <span className="px-3 py-1 text-[10px] font-black uppercase rounded bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 border">
                          {u.role || "customer"}
                        </span>
                      </td>
                      <td className="p-6 text-right">
                        <button 
                          onClick={() => setGiftModal({ show: true, userId: u.id, userEmail: u.email, amount: "" })}
                          className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold px-4 py-2 rounded-xl text-xs shadow-md hover:brightness-110 transition"
                        >
                          🎁 Gift Bonus
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {totalUserPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 bg-gray-50 dark:bg-white/5 rounded-2xl border">
              <span className="text-sm font-medium">Page {usersPage} of {totalUserPages}</span>
              <div className="flex gap-2">
                <button onClick={() => setUsersPage(p => Math.max(p - 1, 1))} disabled={usersPage === 1} className="px-4 py-2 rounded-xl bg-white dark:bg-white/10 border font-bold text-sm disabled:opacity-30">Prev</button>
                <button onClick={() => setUsersPage(p => Math.min(p + 1, totalUserPages))} disabled={usersPage === totalUserPages} className="px-4 py-2 rounded-xl bg-emerald-500 text-white font-bold text-sm disabled:opacity-30">Next</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Admin;