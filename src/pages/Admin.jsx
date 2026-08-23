import { useState, useEffect, useMemo } from "react";
import notify from "../components/ui/LuxuryToast";
import { useSelector } from "react-redux";
import { 
  addProductToDB, getAllProducts, deleteProductFromDB, updateProductInDB, updateProductStock,
  getAllOrders, cancelOrderInDB, deleteOrderFromDB, updateOrderStatusInDB 
} from "../services/productservices";
import { getAllUsers } from "../services/auth/authService"; 
import { formatPrice } from "../utils/priceFormatter";
import { db } from "../services/firebase";
import { doc, getDoc, updateDoc, arrayUnion } from "firebase/firestore";
import { 
  BarChart3, 
  Package, 
  Boxes, 
  ShoppingCart, 
  Users, 
  Gift, 
  Edit3, 
  Trash2, 
  Plus, 
  Minus,
  Search, 
  CheckCircle2, 
  AlertCircle,
  TrendingUp,
  TrendingDown,
  CreditCard,
  QrCode,
  Wallet,
  Truck,
  PieChart,
  Percent,
  SlidersHorizontal,
  Split
} from "lucide-react";

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
  
  // Search & Filters
  const [orderSearchQuery, setOrderSearchQuery] = useState("");
  const [inventorySearchQuery, setInventorySearchQuery] = useState("");
  const [inventoryStockFilter, setInventoryStockFilter] = useState("all"); 
  const [inventoryCategory, setInventoryCategory] = useState("");

  const [giftModal, setGiftModal] = useState({ show: false, userId: null, userEmail: "", amount: "" });
  const [stockModal, setStockModal] = useState({ show: false, product: null, stock: "", costPrice: "", price: "" });
  const [confirmDialog, setConfirmDialog] = useState({ show: false, id: null, actionType: "", message: "" });

  const [productsPage, setProductsPage] = useState(1);
  const [ordersPage, setOrdersPage] = useState(1);
  const [usersPage, setUsersPage] = useState(1); 
  const [inventoryPage, setInventoryPage] = useState(1);
  
  const productsPerPage = 8; 
  const ordersPerPage = 8;
  const usersPerPage = 10; 
  const inventoryPerPage = 8; 

  const deliveredOrders = useMemo(() => {
    return ordersList.filter((o) => o.status === "Delivered ✅" || o.status === "Delivered" || (o.status?.includes("Deliver") && !o.status?.includes("Out") && !o.status?.includes("Assigning")));
  }, [ordersList]);

  const totalRevenue = useMemo(() => {
    return deliveredOrders.reduce((sum, order) => sum + (Number(order.totalAmount) || 0), 0);
  }, [deliveredOrders]);

  // Total Units Sold
  const totalUnitsSold = useMemo(() => {
    let units = 0;
    deliveredOrders.forEach(order => {
      const items = order.items || order.cartItems || [];
      items.forEach(i => {
        units += (Number(i.quantity) || 1);
      });
    });
    return units;
  }, [deliveredOrders]);

  // Average Order Value (AOV)
  const averageOrderValue = useMemo(() => {
    if (deliveredOrders.length === 0) return 0;
    return Math.round(totalRevenue / deliveredOrders.length);
  }, [deliveredOrders, totalRevenue]);

  // Store Owner Profit Calculation
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

  // Net Profit Margin Percentage
  const profitMarginPercent = useMemo(() => {
    if (totalRevenue === 0) return 0;
    return ((totalOwnerProfit / totalRevenue) * 100).toFixed(1);
  }, [totalOwnerProfit, totalRevenue]);

  // Payment Methods Breakdown (Handling Split & Single)
  const paymentMethodStats = useMemo(() => {
    const stats = { card: 0, upi: 0, wallet: 0, cod: 0 };
    deliveredOrders.forEach(order => {
      if (order.paymentMethod === 'split' && order.paymentBreakdown) {
        stats.card += Number(order.paymentBreakdown.card || 0);
        stats.upi += Number(order.paymentBreakdown.upi || 0);
        stats.wallet += Number(order.paymentBreakdown.wallet || 0);
        stats.cod += Number(order.paymentBreakdown.cod || 0);
      } else {
        const method = String(order.paymentMethod || 'cod').toLowerCase();
        if (stats[method] !== undefined) {
          stats[method] += Number(order.totalAmount || 0);
        } else {
          stats.cod += Number(order.totalAmount || 0);
        }
      }
    });
    return stats;
  }, [deliveredOrders]);

  // Order Status Pipeline
  const orderStatusCounts = useMemo(() => {
    const counts = { pending: 0, outForDelivery: 0, delivered: 0, cancelled: 0 };
    ordersList.forEach(o => {
      const s = String(o.status || '').toLowerCase();
      if (s.includes('cancel')) counts.cancelled += 1;
      else if (s.includes('deliver') && !s.includes('out') && !s.includes('assigning')) counts.delivered += 1;
      else if (s.includes('out')) counts.outForDelivery += 1;
      else counts.pending += 1;
    });
    return counts;
  }, [ordersList]);

  // Top Selling & Low Selling Products (Accurate calculation & high contrast)
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

  const filteredInventory = useMemo(() => {
    let list = [...productsList];

    if (inventoryCategory) {
      list = list.filter(p => p.category === inventoryCategory);
    }

    if (inventorySearchQuery.trim()) {
      const q = inventorySearchQuery.toLowerCase();
      list = list.filter(p => p.title?.toLowerCase().includes(q) || p.category?.toLowerCase().includes(q));
    }

    if (inventoryStockFilter === "in-stock") {
      list = list.filter(p => Number(p.stock || 0) > 10);
    } else if (inventoryStockFilter === "low-stock") {
      list = list.filter(p => Number(p.stock || 0) > 0 && Number(p.stock || 0) <= 10);
    } else if (inventoryStockFilter === "out-of-stock") {
      list = list.filter(p => Number(p.stock || 0) <= 0);
    }

    return list;
  }, [productsList, inventoryCategory, inventorySearchQuery, inventoryStockFilter]);

  const totalProductPages = Math.max(1, Math.ceil(productsList.length / productsPerPage));
  const totalOrderPages = Math.max(1, Math.ceil(filteredOrders.length / ordersPerPage));
  const totalUserPages = Math.max(1, Math.ceil(usersList.length / usersPerPage)); 
  const totalInventoryPages = Math.max(1, Math.ceil(filteredInventory.length / inventoryPerPage));

  const paginatedProducts = productsList.slice((productsPage - 1) * productsPerPage, productsPage * productsPerPage);
  const paginatedOrders = filteredOrders.slice((ordersPage - 1) * ordersPerPage, ordersPage * ordersPerPage);
  const paginatedUsers = usersList.slice((usersPage - 1) * usersPerPage, usersPage * usersPerPage); 
  const paginatedInventory = filteredInventory.slice((inventoryPage - 1) * inventoryPerPage, inventoryPage * inventoryPerPage);

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
    const { userId, amount, userEmail } = giftModal;
    const giftAmount = Number(amount);
    if (!userId || isNaN(giftAmount) || giftAmount <= 0) {
      notify.error("Invalid Amount", "Please enter a valid gift amount in rupees.");
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

      notify.success("Gift Bonus Sent! 🎁", `₹${formatPrice(giftAmount)} credited to ${userEmail}`);
      setGiftModal({ show: false, userId: null, userEmail: "", amount: "" });
      fetchUsers();
    } catch (err) {
      console.error("Gift wallet error:", err);
      notify.error("Failed to send gift bonus");
    }
  };

  const handleQuickStockAdjust = async (productId, delta) => {
    const prod = productsList.find(p => p.id === productId);
    if (!prod) return;
    const newStock = Math.max(0, (Number(prod.stock) || 0) + delta);
    
    setProductsList(prev => prev.map(p => p.id === productId ? { ...p, stock: newStock } : p));
    
    const res = await updateProductStock(productId, newStock);
    if (res.success) {
      notify.success("Stock Updated", `${prod.title}: now ${newStock} units`);
    } else {
      notify.error("Failed to update stock");
      fetchProducts();
    }
  };

  const handleUpdateInventoryItem = async () => {
    const { product, stock, costPrice, price } = stockModal;
    if (!product) return;

    try {
      await updateProductInDB(product.id, {
        stock: Math.max(0, Number(stock)),
        costPrice: Number(costPrice),
        price: Number(price)
      });
      notify.success("Inventory Saved", `${product.title} updated successfully`);
      setStockModal({ show: false, product: null, stock: "", costPrice: "", price: "" });
      fetchProducts();
    } catch (err) {
      console.error("Inventory update error:", err);
      notify.error("Failed to update inventory.");
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
        notify.success("Product Updated 🛠️", `${productData.title} is now updated`);
        setEditingId(null); 
      }
    } else {
      if (await addProductToDB(productData)) {
        notify.success("Product Published 🔥", `${productData.title} added to store catalog`);
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
      const res = await cancelOrderInDB(id, { isAdmin: true });
      fetchOrders(); 
      if (res.refunded) {
        notify.refund(res.refundAmount, id);
      } else {
        notify.info("Order Cancelled", `Order #${id.slice(0,6)} has been cancelled`);
      }
    } else if (actionType === "DELETE_ORDER") {
      await deleteOrderFromDB(id);
      fetchOrders(); 
      notify.info("Order Deleted", "Record removed permanently");
    } else if (actionType === "DELETE_PRODUCT") {
      await deleteProductFromDB(id);
      fetchProducts(); 
      notify.info("Product Deleted", "Product removed from store");
    }
  };

  return (
    <div className="space-y-6 md:space-y-8 min-h-[85vh] transition-colors duration-300 pb-12">
      
      {/* Gift Modal */}
      {giftModal.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 p-6 md:p-8 rounded-2xl max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Gift className="text-emerald-500" size={22} />
              <span>Gift Wallet Bonus</span>
            </h3>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-slate-400">
              Send bonus money to: <span className="font-bold text-emerald-600 dark:text-emerald-400">{giftModal.userEmail}</span>
            </p>
            <div>
              <label className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase">Amount (₹)</label>
              <input 
                type="number" 
                value={giftModal.amount} 
                onChange={(e) => setGiftModal({ ...giftModal, amount: e.target.value })} 
                placeholder="e.g. 100" 
                className="w-full mt-1.5 px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-gray-900 dark:text-white font-bold outline-none focus:border-emerald-500" 
              />
            </div>
            <div className="flex gap-2.5 justify-end pt-2">
              <button 
                onClick={() => setGiftModal({ show: false, userId: null, userEmail: "", amount: "" })} 
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 font-bold text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button 
                onClick={handleSendGiftMoney} 
                className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs shadow-md cursor-pointer"
              >
                Send Bonus 🚀
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Centered Inventory Modal */}
      {stockModal.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 p-6 md:p-8 rounded-2xl max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Boxes className="text-indigo-500" size={22} />
              <span>Manage Inventory</span>
            </h3>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-slate-400 line-clamp-1">
              Product: <span className="font-bold text-emerald-600 dark:text-emerald-400">{stockModal.product?.title}</span>
            </p>
            
            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase">Stock Quantity</label>
                <input 
                  type="number" 
                  value={stockModal.stock} 
                  onChange={(e) => setStockModal({ ...stockModal, stock: e.target.value })} 
                  className="w-full mt-1 px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-gray-900 dark:text-white font-bold outline-none focus:border-emerald-500 text-sm" 
                />
              </div>
              <div>
                <label className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase">Buying Cost (₹)</label>
                <input 
                  type="number" 
                  value={stockModal.costPrice} 
                  onChange={(e) => setStockModal({ ...stockModal, costPrice: e.target.value })} 
                  className="w-full mt-1 px-3.5 py-2.5 rounded-xl border border-amber-300 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-300 font-bold outline-none text-sm" 
                />
              </div>
              <div>
                <label className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase">Selling Price (₹)</label>
                <input 
                  type="number" 
                  value={stockModal.price} 
                  onChange={(e) => setStockModal({ ...stockModal, price: e.target.value })} 
                  className="w-full mt-1 px-3.5 py-2.5 rounded-xl border border-emerald-300 dark:border-emerald-900/50 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-300 font-bold outline-none text-sm" 
                />
              </div>
            </div>

            <div className="flex gap-2.5 justify-end pt-2">
              <button 
                onClick={() => setStockModal({ show: false, product: null, stock: "", costPrice: "", price: "" })} 
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 font-bold text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button 
                onClick={handleUpdateInventoryItem} 
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md cursor-pointer"
              >
                Save Changes 💾
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Dialog */}
      {confirmDialog.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 p-6 md:p-8 rounded-2xl max-w-md w-full text-center shadow-2xl">
            <div className="text-4xl mb-3">⚠️</div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Confirm Action</h3>
            <p className="text-gray-500 dark:text-slate-400 mb-6 text-sm">{confirmDialog.message}</p>
            <div className="flex gap-3 justify-center">
              <button 
                onClick={() => setConfirmDialog({ show: false, id: null, actionType: "", message: "" })} 
                className="flex-1 bg-slate-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 py-2.5 rounded-xl font-bold text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button 
                onClick={executeConfirmAction} 
                className="flex-1 bg-rose-500 hover:bg-rose-600 text-white py-2.5 rounded-xl font-bold text-xs shadow-md cursor-pointer"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white dark:bg-slate-900/90 border border-gray-200/80 dark:border-slate-800 p-5 rounded-2xl md:rounded-3xl shadow-sm">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight bg-gradient-to-r from-emerald-600 to-teal-600 dark:from-emerald-400 dark:to-teal-400 bg-clip-text text-transparent">
            Admin Control Center
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-slate-400 mt-1">Manage Store, Products, Orders, Users & Inventory.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-black uppercase border border-emerald-200 dark:border-emerald-500/20">
            👑 Store Owner
          </span>
        </div>
      </div>

      {/* Responsive Horizontal Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-gray-200 dark:border-slate-800 no-scrollbar">
        {[
          { id: "analytics", label: "Analytics & Metrics", icon: BarChart3 },
          { id: "inventory", label: "Inventory Stock", icon: Boxes },
          { id: "products", label: "Add & Edit Catalog", icon: Package },
          { id: "orders", label: "Customer Orders", icon: ShoppingCart },
          { id: "users", label: "Users & Wallets", icon: Users }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id)} 
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold transition-all text-xs sm:text-sm shrink-0 cursor-pointer ${
                isActive 
                  ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/20" 
                  : "bg-white dark:bg-slate-900 text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 border border-gray-200 dark:border-slate-800"
              }`}
            >
              <Icon size={16} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ================= TAB 1: ADVANCED ANALYTICS & PROFIT METRICS ================= */}
      {activeTab === "analytics" && (
        <div className="space-y-6 animate-fade-in">
          
          {/* Top 6 KPI Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
            <div className="bg-white dark:bg-slate-900/90 p-4 rounded-2xl border border-gray-200/80 dark:border-slate-800 shadow-sm">
              <p className="text-gray-500 dark:text-slate-400 font-bold text-[10px] uppercase tracking-wider">Revenue</p>
              <h3 className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">₹{formatPrice(totalRevenue)}</h3>
              <p className="text-[10px] text-gray-400 dark:text-slate-500 mt-0.5">Delivered</p>
            </div>
            
            <div className="bg-white dark:bg-slate-900/90 p-4 rounded-2xl border border-gray-200/80 dark:border-slate-800 shadow-sm">
              <p className="text-gray-500 dark:text-slate-400 font-bold text-[10px] uppercase tracking-wider">Net Profit 💰</p>
              <h3 className="text-xl sm:text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-1">₹{formatPrice(totalOwnerProfit)}</h3>
              <p className="text-[10px] text-gray-400 dark:text-slate-500 mt-0.5">Margin: {profitMarginPercent}%</p>
            </div>

            <div className="bg-white dark:bg-slate-900/90 p-4 rounded-2xl border border-gray-200/80 dark:border-slate-800 shadow-sm">
              <p className="text-gray-500 dark:text-slate-400 font-bold text-[10px] uppercase tracking-wider">Delivered Orders</p>
              <h3 className="text-xl sm:text-2xl font-black text-blue-600 dark:text-blue-400 mt-1">{deliveredOrders.length}</h3>
              <p className="text-[10px] text-gray-400 dark:text-slate-500 mt-0.5">Completed</p>
            </div>

            <div className="bg-white dark:bg-slate-900/90 p-4 rounded-2xl border border-gray-200/80 dark:border-slate-800 shadow-sm">
              <p className="text-gray-500 dark:text-slate-400 font-bold text-[10px] uppercase tracking-wider">Units Sold 📦</p>
              <h3 className="text-xl sm:text-2xl font-black text-purple-600 dark:text-purple-400 mt-1">{totalUnitsSold}</h3>
              <p className="text-[10px] text-gray-400 dark:text-slate-500 mt-0.5">Items dispatched</p>
            </div>

            <div className="bg-white dark:bg-slate-900/90 p-4 rounded-2xl border border-gray-200/80 dark:border-slate-800 shadow-sm">
              <p className="text-gray-500 dark:text-slate-400 font-bold text-[10px] uppercase tracking-wider">Avg Order Value</p>
              <h3 className="text-xl sm:text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">₹{formatPrice(averageOrderValue)}</h3>
              <p className="text-[10px] text-gray-400 dark:text-slate-500 mt-0.5">AOV metric</p>
            </div>

            <div className="bg-white dark:bg-slate-900/90 p-4 rounded-2xl border border-gray-200/80 dark:border-slate-800 shadow-sm">
              <p className="text-gray-500 dark:text-slate-400 font-bold text-[10px] uppercase tracking-wider">Store Users</p>
              <h3 className="text-xl sm:text-2xl font-black text-teal-600 dark:text-teal-400 mt-1">{usersList.length}</h3>
              <p className="text-[10px] text-gray-400 dark:text-slate-500 mt-0.5">Registered accounts</p>
            </div>
          </div>

          {/* Revenue by Payment Method & Category Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            
            {/* Payment Methods Breakdown */}
            <div className="bg-white dark:bg-slate-900/90 p-5 rounded-2xl border border-gray-200/80 dark:border-slate-800 shadow-sm space-y-3">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <CreditCard size={18} className="text-emerald-500" />
                <span>Revenue by Payment Method (Single & Split)</span>
              </h3>
              
              <div className="space-y-2.5 pt-1 text-xs">
                {[
                  { label: "Credit / Debit Card", amount: paymentMethodStats.card, color: "bg-blue-500" },
                  { label: "UPI & QR Scan", amount: paymentMethodStats.upi, color: "bg-emerald-500" },
                  { label: "ShopIndia Wallet", amount: paymentMethodStats.wallet, color: "bg-indigo-500" },
                  { label: "Cash on Delivery (COD)", amount: paymentMethodStats.cod, color: "bg-amber-500" }
                ].map((m, idx) => {
                  const percent = totalRevenue > 0 ? Math.round((m.amount / totalRevenue) * 100) : 0;
                  return (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between font-bold">
                        <span className="text-gray-700 dark:text-slate-300">{m.label}</span>
                        <span className="text-gray-900 dark:text-white">₹{formatPrice(m.amount)} ({percent}%)</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-gray-100 dark:bg-slate-800 overflow-hidden">
                        <div className={`h-full ${m.color} rounded-full transition-all duration-500`} style={{ width: `${percent}%` }}></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Order Pipeline Status */}
            <div className="bg-white dark:bg-slate-900/90 p-5 rounded-2xl border border-gray-200/80 dark:border-slate-800 shadow-sm space-y-3">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <PieChart size={18} className="text-indigo-500" />
                <span>Order Status Pipeline ({ordersList.length} Total)</span>
              </h3>

              <div className="grid grid-cols-2 gap-2.5 pt-1 text-xs">
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 space-y-1">
                  <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase">Delivered ✅</p>
                  <p className="text-xl font-black text-emerald-700 dark:text-emerald-300">{orderStatusCounts.delivered}</p>
                </div>

                <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/60 space-y-1">
                  <p className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase">Out for Delivery 🚚</p>
                  <p className="text-xl font-black text-blue-700 dark:text-blue-300">{orderStatusCounts.outForDelivery}</p>
                </div>

                <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 space-y-1">
                  <p className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase">Pending / Assigning ⏳</p>
                  <p className="text-xl font-black text-amber-700 dark:text-amber-300">{orderStatusCounts.pending}</p>
                </div>

                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/60 space-y-1">
                  <p className="text-[10px] font-bold text-rose-600 dark:text-rose-400 uppercase">Cancelled 🔴</p>
                  <p className="text-xl font-black text-rose-700 dark:text-rose-300">{orderStatusCounts.cancelled}</p>
                </div>
              </div>
            </div>

          </div>

          {/* Top & Low Selling Products (High Contrast) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            
            {/* Top Selling Products Card */}
            <div className="bg-white dark:bg-slate-900/90 p-5 rounded-2xl border border-gray-200/80 dark:border-slate-800 shadow-sm space-y-3">
              <h3 className="text-sm sm:text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <TrendingUp className="text-emerald-500" size={18} />
                <span>Top Selling Products</span>
              </h3>
              {topSellingProducts.length > 0 ? (
                <div className="space-y-2">
                  {topSellingProducts.map((p, idx) => (
                    <div 
                      key={p.id} 
                      className="flex justify-between items-center bg-slate-50 dark:bg-slate-800/80 p-3 rounded-xl border border-gray-200/90 dark:border-slate-700/80 gap-3 hover:bg-slate-100 dark:hover:bg-slate-750 transition-colors shadow-sm"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="font-black text-xs text-emerald-600 dark:text-emerald-400">#{idx + 1}</span>
                        <div className="w-11 h-11 bg-white rounded-xl p-1 shrink-0 border border-gray-200 dark:border-slate-700 flex items-center justify-center overflow-hidden shadow-inner">
                          <img src={p.thumbnail} alt={p.title} className="w-full h-full object-contain" />
                        </div>
                        <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100 truncate">{p.title}</span>
                      </div>
                      <span className="bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 font-black px-3 py-1 rounded-lg text-xs shrink-0">
                        {p.totalSold} Sold
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 text-xs py-4 text-center">No sales recorded yet.</p>
              )}
            </div>

            {/* Lowest Selling Products Card */}
            <div className="bg-white dark:bg-slate-900/90 p-5 rounded-2xl border border-gray-200/80 dark:border-slate-800 shadow-sm space-y-3">
              <h3 className="text-sm sm:text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <TrendingDown className="text-rose-500" size={18} />
                <span>Lowest Selling Products</span>
              </h3>
              {lowSellingProducts.length > 0 ? (
                <div className="space-y-2">
                  {lowSellingProducts.map((p) => (
                    <div 
                      key={p.id} 
                      className="flex justify-between items-center bg-slate-50 dark:bg-slate-800/80 p-3 rounded-xl border border-gray-200/90 dark:border-slate-700/80 gap-3 hover:bg-slate-100 dark:hover:bg-slate-750 transition-colors shadow-sm"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-11 h-11 bg-white rounded-xl p-1 shrink-0 border border-gray-200 dark:border-slate-700 flex items-center justify-center overflow-hidden shadow-inner">
                          <img src={p.thumbnail} alt={p.title} className="w-full h-full object-contain" />
                        </div>
                        <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100 truncate">{p.title}</span>
                      </div>
                      <span className="bg-rose-500/10 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-500/30 font-black px-3 py-1 rounded-lg text-xs shrink-0">
                        {p.totalSold || 0} Sold
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 text-xs py-4 text-center">No low sales recorded.</p>
              )}
            </div>

          </div>
        </div>
      )}

      {/* ================= TAB 2: ADVANCED INVENTORY MANAGEMENT (FIXED CONTRAST & SELECT BUG) ================= */}
      {activeTab === "inventory" && (
        <div className="space-y-4 animate-fade-in">
          
          {/* Inventory Filters & Search */}
          <div className="bg-white dark:bg-slate-900/90 border border-gray-200/80 dark:border-slate-800 p-4 sm:p-5 rounded-2xl shadow-sm space-y-3.5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Boxes className="text-emerald-500" size={18} />
                  <span>Real-Time Inventory Stock Control</span>
                </h3>
                <p className="text-xs text-gray-500 dark:text-slate-400">Manage stock quantities and buying costs with 1-click adjusters.</p>
              </div>

              {/* Category Selector with Solid Dark Styling */}
              <select 
                value={inventoryCategory} 
                onChange={(e) => { setInventoryCategory(e.target.value); setInventoryPage(1); }} 
                className="px-3.5 py-2 rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-gray-900 dark:text-gray-100 outline-none focus:border-emerald-500 shadow-sm cursor-pointer"
              >
                <option value="" className="bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100">All Categories</option>
                {categoriesList.map(c => (
                  <option key={c.id} value={c.value} className="bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100">
                    {c.icon} {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter Tabs & Search Row */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 pt-1">
              
              {/* Stock Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto no-scrollbar">
                {[
                  { id: "all", label: "All Items" },
                  { id: "in-stock", label: "In Stock (>10)" },
                  { id: "low-stock", label: "Low Stock (<=10) ⚠️" },
                  { id: "out-of-stock", label: "Out of Stock (0) 🔴" }
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => { setInventoryStockFilter(f.id); setInventoryPage(1); }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                      inventoryStockFilter === f.id
                        ? "bg-emerald-500 text-white shadow-sm font-black"
                        : "bg-slate-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-750"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              {/* Search Bar with Solid Dark Styling */}
              <div className="w-full sm:w-64 flex items-center bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 px-3.5 py-2 rounded-xl text-xs shadow-sm focus-within:border-emerald-500">
                <Search size={14} className="text-gray-400 dark:text-slate-400 mr-2 shrink-0" />
                <input 
                  type="text" 
                  value={inventorySearchQuery} 
                  onChange={(e) => { setInventorySearchQuery(e.target.value); setInventoryPage(1); }} 
                  placeholder="Filter inventory..." 
                  className="w-full bg-transparent text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-slate-400 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Inventory Items Grid */}
          {filteredInventory.length === 0 ? (
            <div className="p-10 text-center text-gray-400 bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800">
              No inventory records matched your filters.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {paginatedInventory.map((p) => {
                const stockQty = Number(p.stock || 0);
                const isOutOfStock = stockQty <= 0;
                const isLowStock = stockQty > 0 && stockQty <= 10;

                return (
                  <div key={p.id} className="bg-white dark:bg-slate-900/90 border border-gray-200/80 dark:border-slate-800 p-4 rounded-2xl shadow-sm flex flex-col justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-14 h-14 bg-white dark:bg-slate-850 rounded-xl p-1 shrink-0 border border-gray-200 dark:border-slate-700 flex items-center justify-center overflow-hidden shadow-inner">
                        <img src={p.thumbnail} alt={p.title} className="w-full h-full object-contain" />
                      </div>
                      <div className="min-w-0 space-y-0.5">
                        <h4 className="font-bold text-xs sm:text-sm text-gray-900 dark:text-white truncate">{p.title}</h4>
                        <p className="text-[11px] text-gray-500 dark:text-slate-400">
                          Selling: <span className="font-bold text-emerald-600 dark:text-emerald-400">₹{formatPrice(p.price)}</span> | Buying: ₹{p.costPrice || 0}
                        </p>
                        <div className="flex items-center gap-1.5">
                          <span className={`px-2 py-0.2 rounded text-[10px] font-black uppercase ${
                            isOutOfStock ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200' :
                            isLowStock ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200' :
                            'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400'
                          }`}>
                            {isOutOfStock ? 'Out of Stock (0)' : isLowStock ? `Low Stock (${stockQty})` : `In Stock: ${stockQty}`}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Quick Adjusters + Full Edit Button */}
                    <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-slate-800 text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold text-gray-400 uppercase">Quick Add:</span>
                        <button
                          onClick={() => handleQuickStockAdjust(p.id, 5)}
                          className="px-2 py-1 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-500 hover:text-white text-emerald-700 dark:text-emerald-300 rounded-lg font-bold text-[11px] transition-colors border border-emerald-200 dark:border-emerald-800 cursor-pointer"
                        >
                          +5
                        </button>
                        <button
                          onClick={() => handleQuickStockAdjust(p.id, 10)}
                          className="px-2 py-1 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-500 hover:text-white text-emerald-700 dark:text-emerald-300 rounded-lg font-bold text-[11px] transition-colors border border-emerald-200 dark:border-emerald-800 cursor-pointer"
                        >
                          +10
                        </button>
                        <button
                          onClick={() => handleQuickStockAdjust(p.id, -1)}
                          disabled={stockQty <= 0}
                          className="px-2 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-rose-500 hover:text-white text-gray-700 dark:text-slate-300 rounded-lg font-bold text-[11px] transition-colors disabled:opacity-30 cursor-pointer"
                        >
                          -1
                        </button>
                      </div>

                      <button 
                        onClick={() => setStockModal({ show: true, product: p, stock: p.stock ?? 0, costPrice: p.costPrice || 0, price: p.price || 0 })} 
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-xs shadow-sm cursor-pointer"
                      >
                        Edit Details ⚙️
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {totalInventoryPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800">
              <span className="text-xs font-medium text-gray-600 dark:text-slate-400">Page {inventoryPage} of {totalInventoryPages}</span>
              <div className="flex gap-2">
                <button 
                  onClick={() => setInventoryPage(p => Math.max(p - 1, 1))} 
                  disabled={inventoryPage === 1} 
                  className="px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-gray-800 dark:text-white font-bold text-xs disabled:opacity-30 cursor-pointer"
                >
                  Prev
                </button>
                <button 
                  onClick={() => setInventoryPage(p => Math.min(p + 1, totalInventoryPages))} 
                  disabled={inventoryPage === totalInventoryPages} 
                  className="px-3 py-1 rounded-lg bg-emerald-500 text-white font-bold text-xs disabled:opacity-30 cursor-pointer"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ================= TAB 3: PRODUCTS CATALOG ================= */}
      {activeTab === "products" && (
        <div className="space-y-6 animate-fade-in">
          <form 
            onSubmit={handleProductSubmit} 
            className={`p-5 md:p-6 rounded-2xl border transition-all ${
              editingId 
                ? 'bg-indigo-50/70 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800 shadow-sm' 
                : 'bg-white dark:bg-slate-900/90 border-gray-200/80 dark:border-slate-800 shadow-sm'
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-base sm:text-lg font-black flex items-center gap-2 ${
                editingId ? 'text-indigo-600 dark:text-indigo-400' : 'text-emerald-600 dark:text-emerald-400'
              }`}>
                {editingId ? <Edit3 size={18} /> : <Plus size={18} />}
                <span>{editingId ? "Update Product Details" : "Add New Product"}</span>
              </h3>
              {editingId && (
                <button 
                  type="button" 
                  onClick={() => {
                    setEditingId(null); 
                    setProduct({ title: "", mrp: "", costPrice: "", price: "", discount: "", stock: "", category: "", thumbnail: "", description: "" });
                  }} 
                  className="text-xs text-rose-600 dark:text-rose-400 font-bold hover:underline cursor-pointer"
                >
                  Cancel Edit
                </button>
              )}
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-600 dark:text-slate-400 uppercase">Product Title</label>
                <input 
                  type="text" 
                  value={product.title} 
                  onChange={(e) => setProduct({...product, title: e.target.value})} 
                  required 
                  placeholder="e.g. Wireless Earbuds" 
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-850 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500 outline-none focus:border-emerald-500 text-xs sm:text-sm" 
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-600 dark:text-slate-400 uppercase">MRP Price (₹)</label>
                <input 
                  type="number" 
                  value={product.mrp} 
                  onChange={(e) => handlePricingChange('mrp', e.target.value)} 
                  required 
                  placeholder="e.g. 1999" 
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-850 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500 outline-none focus:border-emerald-500 text-xs sm:text-sm" 
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase">Buying Cost (₹)</label>
                <input 
                  type="number" 
                  value={product.costPrice} 
                  onChange={(e) => setProduct({...product, costPrice: e.target.value})} 
                  required 
                  placeholder="e.g. 800" 
                  className="w-full px-3.5 py-2.5 rounded-xl border border-amber-300 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-300 font-bold outline-none text-xs sm:text-sm" 
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-600 dark:text-slate-400 uppercase">Discount (%)</label>
                <input 
                  type="number" 
                  value={product.discount} 
                  onChange={(e) => handlePricingChange('discount', e.target.value)} 
                  placeholder="e.g. 20" 
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-850 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500 outline-none focus:border-emerald-500 text-xs sm:text-sm" 
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase">Selling Price (₹)</label>
                <input 
                  type="number" 
                  value={product.price} 
                  onChange={(e) => setProduct({...product, price: e.target.value})} 
                  required 
                  placeholder="e.g. 1599" 
                  className="w-full px-3.5 py-2.5 rounded-xl border border-emerald-300 dark:border-emerald-900/50 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-300 font-bold outline-none text-xs sm:text-sm" 
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-600 dark:text-slate-400 uppercase">Stock Quantity</label>
                <input 
                  type="number" 
                  value={product.stock} 
                  onChange={(e) => setProduct({...product, stock: e.target.value})} 
                  required 
                  placeholder="e.g. 50" 
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-850 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500 outline-none focus:border-emerald-500 text-xs sm:text-sm" 
                />
              </div>
              
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-600 dark:text-slate-400 uppercase">Category</label>
                <select 
                  value={product.category} 
                  onChange={(e) => setProduct({...product, category: e.target.value})} 
                  required 
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-850 text-gray-900 dark:text-white outline-none focus:border-emerald-500 text-xs sm:text-sm cursor-pointer"
                >
                  <option value="" disabled className="bg-white dark:bg-slate-850 text-gray-900 dark:text-white">Select Category...</option>
                  {categoriesList.map((cat) => (
                    <option key={cat.id} value={cat.value} className="bg-white dark:bg-slate-850 text-gray-900 dark:text-white">
                      {cat.icon} {cat.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-600 dark:text-slate-400 uppercase">Image URL</label>
                <input 
                  type="text" 
                  value={product.thumbnail} 
                  onChange={(e) => setProduct({...product, thumbnail: e.target.value})} 
                  required 
                  placeholder="https://..." 
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-850 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500 outline-none focus:border-emerald-500 text-xs sm:text-sm" 
                />
              </div>

              <div className="space-y-1 sm:col-span-full">
                <label className="text-xs font-bold text-gray-600 dark:text-slate-400 uppercase">Description</label>
                <textarea 
                  value={product.description} 
                  onChange={(e) => setProduct({...product, description: e.target.value})} 
                  required 
                  rows="2" 
                  placeholder="Product specifications and features..." 
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-850 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500 outline-none focus:border-emerald-500 text-xs sm:text-sm resize-none"
                ></textarea>
              </div>
            </div>
            
            <button 
              type="submit" 
              disabled={loading}
              className="mt-4 w-full font-black py-3 rounded-xl text-white uppercase tracking-wider bg-emerald-500 hover:bg-emerald-600 shadow-md shadow-emerald-500/20 text-xs sm:text-sm transition-all cursor-pointer"
            >
              {loading ? "Saving Product... ⏳" : (editingId ? "Update Product Now 🚀" : "Publish Product to Store 🚀")}
            </button>
          </form>

          {/* Catalog Listing */}
          <div className="space-y-3">
            <h3 className="text-base font-bold text-gray-900 dark:text-white">Product Catalog ({productsList.length})</h3>
            {productsList.length === 0 ? (
               <div className="p-8 text-center text-gray-400 bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800">
                 No products found.
               </div>
            ) : (
              <>
                <div className="space-y-2.5">
                  {paginatedProducts.map((item) => {
                    const sellingPrice = Number(item.price) || 0;
                    const costPrice = Number(item.costPrice ?? (sellingPrice * 0.5)); 
                    const profitPerItem = sellingPrice - costPrice;
                    const profitMargin = costPrice > 0 ? ((profitPerItem / costPrice) * 100).toFixed(1) : 0;

                    return (
                      <div key={item.id} className="bg-white dark:bg-slate-900/90 border border-gray-200/80 dark:border-slate-800 p-3.5 sm:p-4 rounded-2xl flex flex-col sm:flex-row justify-between gap-3 items-start sm:items-center shadow-sm">
                        <div className="flex gap-3 items-center flex-1 min-w-0">
                          <div className="w-14 h-14 bg-white dark:bg-slate-850 rounded-xl p-1.5 flex items-center justify-center shrink-0 border border-gray-200 dark:border-slate-700 shadow-inner overflow-hidden">
                            <img src={item.thumbnail} alt={item.title} className="w-full h-full object-contain" />
                          </div>
                          <div className="space-y-0.5 min-w-0">
                            <h4 className="font-bold text-xs sm:text-sm text-gray-900 dark:text-white truncate">{item.title}</h4>
                            <div className="flex flex-wrap gap-1.5 text-[10px]">
                              <span className="bg-slate-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 px-1.5 py-0.2 rounded font-mono">MRP: ₹{item.mrp || item.price}</span>
                              <span className="bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 px-1.5 py-0.2 rounded font-semibold">Cost: ₹{item.costPrice || 0}</span>
                              <span className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.2 rounded font-bold">Selling: ₹{formatPrice(sellingPrice)}</span>
                            </div>
                            <p className="text-[10px] text-gray-400 dark:text-slate-500">Stock: <span className="font-bold text-gray-700 dark:text-slate-300">{item.stock || 0}</span></p>
                          </div>
                        </div>

                        <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 px-3 py-1.5 rounded-xl text-left sm:text-center shrink-0 w-full sm:w-auto">
                          <p className="text-[9px] uppercase font-bold text-emerald-600 dark:text-emerald-400">Profit / Unit</p>
                          <p className="text-xs sm:text-sm font-black text-emerald-600 dark:text-emerald-400">₹{formatPrice(profitPerItem)} <span className="text-[10px] text-gray-500 font-normal">({profitMargin}%)</span></p>
                        </div>

                        <div className="flex gap-2 w-full sm:w-auto shrink-0">
                          <button 
                            onClick={() => handleEdit(item)} 
                            className="flex-1 sm:flex-none px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-gray-800 dark:text-white rounded-lg font-bold text-xs cursor-pointer"
                          >
                            Edit
                          </button>
                          <button 
                            onClick={() => setConfirmDialog({show: true, id: item.id, actionType: "DELETE_PRODUCT", message: `Delete "${item.title}"?`})} 
                            className="flex-1 sm:flex-none px-3 py-1.5 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-lg font-bold text-xs cursor-pointer"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {totalProductPages > 1 && (
                  <div className="flex items-center justify-between px-4 py-3 bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800">
                    <span className="text-xs font-medium text-gray-600 dark:text-slate-400">Page {productsPage} of {totalProductPages}</span>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => setProductsPage(p => Math.max(p - 1, 1))} 
                        disabled={productsPage === 1} 
                        className="px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-gray-800 dark:text-white font-bold text-xs disabled:opacity-30 cursor-pointer"
                      >
                        Prev
                      </button>
                      <button 
                        onClick={() => setProductsPage(p => Math.min(p + 1, totalProductPages))} 
                        disabled={productsPage === totalProductPages} 
                        className="px-3 py-1 rounded-lg bg-emerald-500 text-white font-bold text-xs disabled:opacity-30 cursor-pointer"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* ================= TAB 4: ORDERS ================= */}
      {activeTab === "orders" && (
        <div className="space-y-4 animate-fade-in">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <h3 className="text-base font-bold text-gray-900 dark:text-white">Customer Orders ({ordersList.length})</h3>
            <div className="w-full sm:w-72 flex items-center bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 px-3 py-2 rounded-xl text-xs shadow-sm focus-within:border-emerald-500">
              <Search size={14} className="text-gray-400 dark:text-slate-400 mr-2 shrink-0" />
              <input 
                type="text" 
                value={orderSearchQuery} 
                onChange={(e) => { setOrderSearchQuery(e.target.value); setOrdersPage(1); }} 
                placeholder="Search Order ID, Customer..." 
                className="w-full bg-transparent text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-slate-400 outline-none"
              />
            </div>
          </div>

          {filteredOrders.length === 0 ? (
            <div className="p-10 text-center text-gray-400 bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800">
              No orders found.
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {paginatedOrders.map((order) => (
                  <div key={order.id} className="bg-white dark:bg-slate-900/90 border border-gray-200/80 dark:border-slate-800 p-4 sm:p-5 rounded-2xl shadow-sm flex flex-col sm:flex-row justify-between gap-3 items-start sm:items-center">
                    <div className="space-y-1">
                      <p className="font-bold text-sm text-gray-900 dark:text-white">{order.shipping?.name || order.userEmail || "Customer"}</p>
                      <p className="text-[11px] text-gray-400 dark:text-slate-500 font-mono">ID: {order.id}</p>
                      <p className="text-[11px] text-gray-500 dark:text-slate-400">Date: {new Date(order.date).toLocaleString('en-IN')}</p>
                      
                      {order.paymentMethod === 'split' && order.paymentBreakdown ? (
                        <div className="flex flex-wrap gap-1 text-[10px] pt-1">
                          <span className="font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-200">
                            ⚡ Split Payment:
                          </span>
                          {order.paymentBreakdown.wallet > 0 && <span className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">Wallet: ₹{order.paymentBreakdown.wallet}</span>}
                          {order.paymentBreakdown.upi > 0 && <span className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">UPI: ₹{order.paymentBreakdown.upi}</span>}
                          {order.paymentBreakdown.card > 0 && <span className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">Card: ₹{order.paymentBreakdown.card}</span>}
                        </div>
                      ) : (
                        <p className="text-[10px] text-gray-400 font-bold uppercase">Method: {order.paymentMethod}</p>
                      )}

                      <p className="text-emerald-600 dark:text-emerald-400 font-black text-base mt-1">₹{formatPrice(order.totalAmount)}</p>
                    </div>

                    <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-2">
                      <span className="text-[10px] font-bold uppercase bg-slate-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 px-2.5 py-1 rounded-md border border-gray-200 dark:border-slate-700">
                        {order.status}
                      </span>
                      <div className="flex gap-2">
                        {!order.status?.includes("Cancelled") && (
                          <button 
                            onClick={() => setConfirmDialog({show: true, id: order.id, actionType: "CANCEL_ORDER", message: "Cancel this order and refund prepaid amount to customer wallet?"})} 
                            className="bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 py-1.5 px-3 rounded-lg font-bold text-xs hover:bg-amber-500 hover:text-white transition-colors cursor-pointer"
                          >
                            Cancel & Refund 💰
                          </button>
                        )}
                        <button 
                          onClick={() => setConfirmDialog({show: true, id: order.id, actionType: "DELETE_ORDER", message: "Delete this order record permanently?"})} 
                          className="bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-500/30 py-1.5 px-3 rounded-lg font-bold text-xs hover:bg-rose-500 hover:text-white transition-colors cursor-pointer"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {totalOrderPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800">
                  <span className="text-xs font-medium text-gray-600 dark:text-slate-400">Page {ordersPage} of {totalOrderPages}</span>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setOrdersPage(p => Math.max(p - 1, 1))} 
                      disabled={ordersPage === 1} 
                      className="px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-gray-800 dark:text-white font-bold text-xs disabled:opacity-30 cursor-pointer"
                    >
                      Prev
                    </button>
                    <button 
                      onClick={() => setOrdersPage(p => Math.min(p + 1, totalOrderPages))} 
                      disabled={ordersPage === totalOrderPages} 
                      className="px-3 py-1 rounded-lg bg-emerald-500 text-white font-bold text-xs disabled:opacity-30 cursor-pointer"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ================= TAB 5: USERS & WALLET GIFTING ================= */}
      {activeTab === "users" && (
        <div className="space-y-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900/90 rounded-2xl border border-gray-200/80 dark:border-slate-800 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs sm:text-sm">
                <thead className="bg-slate-50 dark:bg-slate-800 text-gray-500 dark:text-slate-400 uppercase text-[10px] font-black border-b border-gray-200 dark:border-slate-700">
                  <tr>
                    <th className="p-4">User</th>
                    <th className="p-4">Role</th>
                    <th className="p-4 text-right">Gift Bonus</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                  {usersList.length === 0 ? (
                    <tr><td colSpan="3" className="p-8 text-center text-gray-400">No users found.</td></tr>
                  ) : (
                    paginatedUsers.map((u) => (
                      <tr key={u.id} className="hover:bg-gray-50/50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="p-4">
                          <p className="font-bold text-gray-900 dark:text-white">{u.fullName || "User"}</p>
                          <p className="text-[11px] text-gray-400 dark:text-slate-500">{u.email}</p>
                        </td>
                        <td className="p-4">
                          <span className="px-2 py-0.5 text-[10px] font-black uppercase rounded bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20">
                            {u.role || "customer"}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <button 
                            onClick={() => setGiftModal({ show: true, userId: u.id, userEmail: u.email, amount: "" })}
                            className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-3.5 py-1.5 rounded-lg text-xs shadow-sm transition-all cursor-pointer"
                          >
                            🎁 Gift
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {totalUserPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800">
              <span className="text-xs font-medium text-gray-600 dark:text-slate-400">Page {usersPage} of {totalUserPages}</span>
              <div className="flex gap-2">
                <button 
                  onClick={() => setUsersPage(p => Math.max(p - 1, 1))} 
                  disabled={usersPage === 1} 
                  className="px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-gray-800 dark:text-white font-bold text-xs disabled:opacity-30 cursor-pointer"
                >
                  Prev
                </button>
                <button 
                  onClick={() => setUsersPage(p => Math.min(p + 1, totalUserPages))} 
                  disabled={usersPage === totalUserPages} 
                  className="px-3 py-1 rounded-lg bg-emerald-500 text-white font-bold text-xs disabled:opacity-30 cursor-pointer"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Admin;