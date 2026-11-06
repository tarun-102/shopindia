import { useState, useEffect, useMemo } from "react";
import notify from "../components/ui/LuxuryToast";
import { useSelector } from "react-redux";
import { 
  addProductToDB, getAllProducts, deleteProductFromDB, updateProductInDB, updateProductStock,
  getAllOrders, cancelOrderInDB, deleteOrderFromDB, updateOrderStatusInDB,
  approveReturnInDB, rejectReturnInDB, applyDefaultGstToProducts,
  markOrderPacked, markOrderDispatched, getOrderTrackingNumber, getOrderCarrier,
  subscribeAllOrders, formatOrderDate
} from "../services/productservices";
import { getAllUsers } from "../services/auth/authService"; 
import { formatPrice } from "../utils/priceFormatter";
import { GST_RATE_OPTIONS, getSuggestedGstRate } from "../utils/taxUtils";
import InvoiceModal from "../components/ui/InvoiceModal";
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
  Split,
  FileText,
  RefreshCw,
  RotateCcw,
  Download,
  Sparkles,
  Copy,
  Calendar,
  Activity,
  Layers,
  FileSpreadsheet,
  ArrowUpRight,
  CheckCircle,
  ShieldAlert
} from "lucide-react";
import { downloadInvoicePDF } from "../utils/invoicePdfGenerator";

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
    description: "",
    gstRate: "18",
    isReturnable: true
  });

  const [productsList, setProductsList] = useState([]);
  const [ordersList, setOrdersList] = useState([]);
  const [usersList, setUsersList] = useState([]); 
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [gstSyncLoading, setGstSyncLoading] = useState(false);
  
  // Search & Filters
  const [orderSearchQuery, setOrderSearchQuery] = useState("");
  const [orderStatusFilter, setOrderStatusFilter] = useState("all"); // 'all' | 'needs-packing' | 'packed' | 'dispatched' | 'delivered' | 'cancelled'
  const [inventorySearchQuery, setInventorySearchQuery] = useState("");
  const [inventoryStockFilter, setInventoryStockFilter] = useState("all"); 
  const [inventoryCategory, setInventoryCategory] = useState("");
  const [analyticsPeriod, setAnalyticsPeriod] = useState("all"); // 'all' | 'today' | '7days' | '30days'

  const [giftModal, setGiftModal] = useState({ show: false, userId: null, userEmail: "", amount: "" });
  const [stockModal, setStockModal] = useState({ show: false, product: null, stock: "", costPrice: "", price: "", gstRate: 18, isReturnable: true });
  const [confirmDialog, setConfirmDialog] = useState({ show: false, id: null, actionType: "", message: "" });
  const [invoiceModal, setInvoiceModal] = useState({ show: false, order: null });

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

  // Period-Filtered Analytics (All Time, Today, 7 Days, 30 Days)
  const periodOrders = useMemo(() => {
    if (analyticsPeriod === "all") return ordersList;
    const now = Date.now();
    return ordersList.filter(o => {
      const time = new Date(o.date).getTime();
      if (isNaN(time)) return false;
      const diff = now - time;
      if (analyticsPeriod === "today") return diff <= 24 * 60 * 60 * 1000;
      if (analyticsPeriod === "7days") return diff <= 7 * 24 * 60 * 60 * 1000;
      if (analyticsPeriod === "30days") return diff <= 30 * 24 * 60 * 60 * 1000;
      return true;
    });
  }, [ordersList, analyticsPeriod]);

  const periodDeliveredOrders = useMemo(() => {
    return periodOrders.filter((o) => o.status === "Delivered ✅" || o.status === "Delivered" || (o.status?.includes("Deliver") && !o.status?.includes("Out") && !o.status?.includes("Assigning")));
  }, [periodOrders]);

  const periodRevenue = useMemo(() => {
    return periodDeliveredOrders.reduce((sum, order) => sum + (Number(order.totalAmount) || 0), 0);
  }, [periodDeliveredOrders]);

  const periodUnitsSold = useMemo(() => {
    let units = 0;
    periodDeliveredOrders.forEach(order => {
      const items = order.items || order.cartItems || [];
      items.forEach(i => {
        units += (Number(i.quantity) || 1);
      });
    });
    return units;
  }, [periodDeliveredOrders]);

  const periodAOV = useMemo(() => {
    if (periodDeliveredOrders.length === 0) return 0;
    return Math.round(periodRevenue / periodDeliveredOrders.length);
  }, [periodDeliveredOrders, periodRevenue]);

  const periodOwnerProfit = useMemo(() => {
    let profit = 0;
    periodDeliveredOrders.forEach(order => {
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
  }, [periodDeliveredOrders, productsList]);

  const periodProfitMargin = useMemo(() => {
    if (periodRevenue === 0) return 0;
    return ((periodOwnerProfit / periodRevenue) * 100).toFixed(1);
  }, [periodOwnerProfit, periodRevenue]);

  // Operational conversion rates & health ratios
  const fulfillmentRate = useMemo(() => {
    const valid = ordersList.filter(o => !String(o.status || '').toLowerCase().includes('cancel'));
    if (valid.length === 0) return 100;
    return Math.round((deliveredOrders.length / valid.length) * 100);
  }, [ordersList, deliveredOrders]);

  const cancellationRate = useMemo(() => {
    if (ordersList.length === 0) return 0;
    const cancelled = ordersList.filter(o => String(o.status || '').toLowerCase().includes('cancel') || Number(o.orderStage) === -1);
    return Math.round((cancelled.length / ordersList.length) * 100);
  }, [ordersList]);

  const returnRate = useMemo(() => {
    if (deliveredOrders.length === 0) return 0;
    const returned = ordersList.filter(o => String(o.status || '').toLowerCase().includes('return'));
    return Math.round((returned.length / deliveredOrders.length) * 100);
  }, [ordersList, deliveredOrders]);

  // 7-Day Daily Revenue & Orders Trend
  const last7DaysTrend = useMemo(() => {
    const days = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dayLabel = d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric" });
      const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0).getTime();
      const dayEnd = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999).getTime();

      const dayOrders = ordersList.filter(o => {
        const ot = new Date(o.date).getTime();
        return ot >= dayStart && ot <= dayEnd;
      });

      const dayDelivered = dayOrders.filter(o => String(o.status || '').toLowerCase().includes('deliver'));
      const dayRevenue = dayDelivered.reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0);

      days.push({
        label: dayLabel,
        orders: dayOrders.length,
        delivered: dayDelivered.length,
        revenue: dayRevenue
      });
    }
    return days;
  }, [ordersList]);

  const max7DayRevenue = useMemo(() => {
    const max = Math.max(...last7DaysTrend.map(d => d.revenue), 1000);
    return max;
  }, [last7DaysTrend]);

  // Category Sales Performance Breakdown
  const categorySalesBreakdown = useMemo(() => {
    const catMap = {};
    deliveredOrders.forEach(order => {
      const items = order.items || order.cartItems || [];
      items.forEach(it => {
        const prod = productsList.find(p => p.id === it.id || p.id === it.productId);
        const cat = prod?.category || it.category || "Uncategorized";
        if (!catMap[cat]) {
          catMap[cat] = { category: cat, revenue: 0, units: 0, ordersCount: 0 };
        }
        const pr = Number(it.price || prod?.price || 0);
        const qty = Number(it.quantity || 1);
        catMap[cat].revenue += pr * qty;
        catMap[cat].units += qty;
        catMap[cat].ordersCount += 1;
      });
    });

    return Object.values(catMap).sort((a, b) => b.revenue - a.revenue);
  }, [deliveredOrders, productsList]);

  // Top VIP Customer Spenders (Customer Lifetime Value)
  const topCustomerSpenders = useMemo(() => {
    const spendersMap = {};
    ordersList.forEach(order => {
      const uid = order.userId || order.userEmail || "anonymous";
      if (!spendersMap[uid]) {
        spendersMap[uid] = {
          userId: order.userId,
          email: order.userEmail || order.shipping?.email || "Unknown",
          name: order.shipping?.name || order.userEmail?.split("@")[0] || "Customer",
          totalOrders: 0,
          deliveredOrders: 0,
          totalSpent: 0
        };
      }
      spendersMap[uid].totalOrders += 1;
      if (String(order.status || '').toLowerCase().includes('deliver')) {
        spendersMap[uid].deliveredOrders += 1;
        spendersMap[uid].totalSpent += Number(order.totalAmount || 0);
      }
    });

    return Object.values(spendersMap)
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 5)
      .map(cust => {
        const matchedUser = usersList.find(u => u.id === cust.userId || u.email === cust.email);
        return {
          ...cust,
          walletBalance: matchedUser?.wallet?.balance || 0
        };
      });
  }, [ordersList, usersList]);

  // Store Inventory Capital Valuation
  const inventoryValuation = useMemo(() => {
    let totalCost = 0;
    let totalRetail = 0;
    let outOfStock = 0;
    let lowStock = 0;
    let healthyStock = 0;

    productsList.forEach(p => {
      const stock = Number(p.stock || 0);
      const retail = Number(p.price || 0);
      const cost = Number(p.costPrice !== undefined && p.costPrice !== "" ? p.costPrice : retail * 0.5);

      totalCost += cost * stock;
      totalRetail += retail * stock;

      if (stock === 0) outOfStock += 1;
      else if (stock <= 5) lowStock += 1;
      else healthyStock += 1;
    });

    return {
      totalCost,
      totalRetail,
      potentialProfit: Math.max(0, totalRetail - totalCost),
      outOfStock,
      lowStock,
      healthyStock
    };
  }, [productsList]);

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

  const isOrderNeedingPacking = (o) => {
    const s = String(o?.status || "").toLowerCase();
    const stage = Number(o?.orderStage);
    if (
      s.includes("cancel") || 
      s.includes("delivered") || 
      s.includes("packed") || 
      s.includes("shipping") || 
      s.includes("dispatched") || 
      s.includes("out for delivery") || 
      s.includes("partner assigned") || 
      s.includes("picked up") || 
      s.includes("on the way") || 
      s.includes("return") ||
      stage >= 2 ||
      stage === -1
    ) {
      return false;
    }
    return true;
  };

  const needsPackingOrders = useMemo(() => {
    return ordersList.filter(o => isOrderNeedingPacking(o));
  }, [ordersList]);

  const packedOrders = useMemo(() => {
    return ordersList.filter(o => {
      const s = String(o.status || "").toLowerCase();
      const stage = Number(o.orderStage);
      return (s.includes("packed") || s.includes("shipping") || stage === 2) && 
        !s.includes("cancel") && 
        !s.includes("delivered") && 
        !s.includes("on the way") && 
        !s.includes("dispatched") &&
        !s.includes("out for delivery");
    });
  }, [ordersList]);

  const inTransitOrders = useMemo(() => {
    return ordersList.filter(o => {
      const s = String(o.status || "").toLowerCase();
      return s.includes("dispatched") || s.includes("out for delivery") || s.includes("partner assigned") || s.includes("picked up") || s.includes("on the way");
    });
  }, [ordersList]);

  const cancelledOrders = useMemo(() => {
    return ordersList.filter(o => {
      const s = String(o.status || "").toLowerCase();
      return s.includes("cancel") || s.includes("return") || Number(o.orderStage) === -1;
    });
  }, [ordersList]);

  const filteredOrders = useMemo(() => {
    let list = [...ordersList];

    if (orderStatusFilter === "needs-packing") {
      list = list.filter(o => isOrderNeedingPacking(o));
    } else if (orderStatusFilter === "packed") {
      list = list.filter(o => {
        const s = String(o.status || "").toLowerCase();
        const stage = Number(o.orderStage);
        return (s.includes("packed") || s.includes("shipping") || stage === 2) && 
          !s.includes("cancel") && 
          !s.includes("delivered") && 
          !s.includes("on the way") && 
          !s.includes("dispatched") &&
          !s.includes("out for delivery");
      });
    } else if (orderStatusFilter === "dispatched") {
      list = list.filter(o => {
        const s = String(o.status || "").toLowerCase();
        return s.includes("dispatched") || s.includes("out for delivery") || s.includes("partner assigned") || s.includes("picked up") || s.includes("on the way");
      });
    } else if (orderStatusFilter === "delivered") {
      list = list.filter(o => {
        const s = String(o.status || "").toLowerCase();
        return s.includes("delivered") || o.status === "Delivered ✅";
      });
    } else if (orderStatusFilter === "cancelled") {
      list = list.filter(o => {
        const s = String(o.status || "").toLowerCase();
        return s.includes("cancel") || s.includes("return");
      });
    }

    if (orderSearchQuery.trim()) {
      const query = orderSearchQuery.toLowerCase();
      list = list.filter(o => 
        o.id?.toLowerCase().includes(query) || 
        o.shipping?.name?.toLowerCase().includes(query) ||
        o.userEmail?.toLowerCase().includes(query) ||
        o.trackingNumber?.toLowerCase().includes(query)
      );
    }

    return list;
  }, [ordersList, orderStatusFilter, orderSearchQuery]);

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
    fetchUsers();

    const unsubOrders = subscribeAllOrders(
      (orders) => {
        setOrdersList(orders || []);
      },
      (err) => {
        console.error("Orders subscribe err:", err);
      }
    );

    return () => {
      if (typeof unsubOrders === "function") unsubOrders();
    };
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
    const { product, stock, costPrice, price, gstRate, isReturnable } = stockModal;
    if (!product) return;

    try {
      await updateProductInDB(product.id, {
        stock: Math.max(0, Number(stock)),
        costPrice: Number(costPrice),
        price: Number(price),
        gstRate: Number(gstRate !== undefined ? gstRate : 18),
        isReturnable: isReturnable !== false
      });
      notify.success("Inventory Saved", `${product.title} updated successfully`);
      setStockModal({ show: false, product: null, stock: "", costPrice: "", price: "", gstRate: 18, isReturnable: true });
      fetchProducts();
    } catch (err) {
      console.error("Inventory update error:", err);
      notify.error("Failed to update inventory.");
    }
  };

  const handleToggleReturn = async (productId, currentIsReturnable) => {
    const nextVal = !currentIsReturnable;
    setProductsList(prev => prev.map(p => p.id === productId ? { ...p, isReturnable: nextVal } : p));
    const res = await updateProductInDB(productId, { isReturnable: nextVal });
    if (res.success) {
      notify.success("Return Policy Updated", `Product is now ${nextVal ? '7-Day Returnable 🔄' : 'Non-Returnable 🚫'}`);
    } else {
      notify.error("Failed to update return policy");
      fetchProducts();
    }
  };

  const handleQuickSetGst = async (productId, rate = 18) => {
    setProductsList(prev => prev.map(p => p.id === productId ? { ...p, gstRate: rate } : p));
    const res = await updateProductInDB(productId, { gstRate: rate });
    if (res.success) {
      notify.success("GST Assigned", `Set to ${rate}% GST successfully`);
    } else {
      notify.error("Failed to update GST rate");
      fetchProducts();
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
      stock: Number(product.stock || 0),
      gstRate: Number(product.gstRate !== undefined && product.gstRate !== "" ? product.gstRate : 18),
      isReturnable: Boolean(product.isReturnable !== false)
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
    setProduct({ 
      title: "", 
      mrp: "", 
      costPrice: "", 
      price: "", 
      discount: "", 
      stock: "", 
      category: "", 
      thumbnail: "", 
      description: "",
      gstRate: "18",
      isReturnable: true
    });
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
      stock: item.stock || "",
      gstRate: item.gstRate !== undefined ? String(item.gstRate) : "18",
      isReturnable: item.isReturnable !== undefined ? Boolean(item.isReturnable) : true
    });
    setEditingId(item.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleApproveReturn = async (orderId) => {
    const res = await approveReturnInDB(orderId);
    if (res.success) {
      notify.success("Return Approved & Refunded! 🔄", `Refund of ₹${formatPrice(res.refundAmount)} credited to customer wallet.`);
      fetchOrders();
      fetchProducts();
    } else {
      notify.error("Action Failed", res.error || "Could not approve return.");
    }
  };

  const handleRejectReturn = async (orderId) => {
    const res = await rejectReturnInDB(orderId);
    if (res.success) {
      notify.info("Return Rejected", "Order status updated.");
      fetchOrders();
    } else {
      notify.error("Action Failed", res.error || "Could not reject return.");
    }
  };

  const handleSyncAllGst = async (forceCategorySync = false) => {
    setGstSyncLoading(true);
    const res = await applyDefaultGstToProducts(forceCategorySync);
    setGstSyncLoading(false);
    if (res.success) {
      notify.success("GST Synced! 📜", `Successfully updated ${res.updatedCount} products with categorized GST rates (Food 5%, Tech 18%, Fashion 12%).`);
      fetchProducts();
    } else {
      notify.error("Sync Failed", res.error || "Unable to sync GST.");
    }
  };

  const handlePackOrder = async (orderId) => {
    const res = await markOrderPacked(orderId);
    if (res.success) {
      notify.success("Shipping Order 📦", "Order marked for shipping. AWB tracking active.");
      fetchOrders();
    } else {
      notify.error("Update Failed", res.error || "Could not update order.");
    }
  };

  const handleDispatchOrder = async (orderId) => {
    const res = await markOrderDispatched(orderId);
    if (res.success) {
      notify.success("Order Dispatched 🚚", "Consignment handed over to ShopIndia Prime Express / Delivery Partner.");
      fetchOrders();
    } else {
      notify.error("Dispatch Failed", res.error || "Could not dispatch order.");
    }
  };

  const handleAdminStatusChange = async (orderId, newStatus) => {
    if (!orderId || !newStatus) return;
    const res = await updateOrderStatusInDB(orderId, newStatus);
    if (res) {
      setOrdersList(prev => prev.map(o => o.id === orderId ? {
        ...o,
        status: newStatus,
        orderStage: newStatus.includes("Delivered") ? 5 :
                    newStatus.includes("Out for Delivery") ? 4 :
                    newStatus.includes("Way") ? 3 :
                    newStatus.includes("Shipping") ? 2 :
                    newStatus.includes("Cancel") ? -1 : 1
      } : o));
      notify.success("Status Updated! ⚡", `Order #${orderId.slice(0, 6)} updated to ${newStatus}`);
      fetchOrders();
    } else {
      notify.error("Update Failed", "Could not update order status.");
    }
  };

  const handleAdminDirectDeliver = async (orderId) => {
    const res = await updateOrderStatusInDB(orderId, "Delivered ✅");
    if (res) {
      setOrdersList(prev => prev.map(o => o.id === orderId ? {
        ...o,
        status: "Delivered ✅",
        orderStage: 5,
        otpVerified: true,
        otp: null,
        deliveredAt: new Date().toISOString()
      } : o));
      notify.success("Order Delivered Successfully! 🎉", `Order #${orderId.slice(0, 6)} marked delivered without OTP.`);
      fetchOrders();
    } else {
      notify.error("Delivery Update Failed", "Could not mark order delivered.");
    }
  };

  const exportOrdersCSV = () => {
    try {
      const headers = ["Order ID", "Date", "Customer Name", "Customer Email", "Address", "PIN", "Total Amount (INR)", "Payment Method", "Status", "AWB Tracking"];
      const rows = ordersList.map(o => [
        `"${o.id || ''}"`,
        `"${o.date ? new Date(o.date).toLocaleString('en-IN') : ''}"`,
        `"${(o.shipping?.name || '').replace(/"/g, '""')}"`,
        `"${(o.userEmail || o.shipping?.email || '').replace(/"/g, '""')}"`,
        `"${(o.shipping?.address || '').replace(/"/g, '""')}"`,
        `"${o.shipping?.pincode || ''}"`,
        o.totalAmount || 0,
        `"${o.paymentMethod || 'cod'}"`,
        `"${(o.status || '').replace(/"/g, '""')}"`,
        `"${getOrderTrackingNumber(o)}"`
      ]);

      const csvContent = "\uFEFF" + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `ShopIndia_Orders_Analytics_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      notify.success("Orders CSV Exported! 📊", `${ordersList.length} records exported`);
    } catch (err) {
      console.error("CSV export err:", err);
      notify.error("Export Failed", "Could not generate CSV file.");
    }
  };

  const executeConfirmAction = async () => {
    const { id, actionType } = confirmDialog;
    setConfirmDialog({ show: false, id: null, actionType: "", message: "" });

    if (actionType === "CANCEL_ORDER") {
      const res = await cancelOrderInDB(id, { isAdmin: true });
      setOrdersList(prev => prev.map(o => o.id === id ? { ...o, status: "Cancelled 🔴", orderStage: -1 } : o));
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
    } else if (actionType === "APPROVE_RETURN") {
      await handleApproveReturn(id);
    } else if (actionType === "REJECT_RETURN") {
      await handleRejectReturn(id);
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

              {/* GST Rate & 7-Day Return Policy */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase">GST Rate & Category</label>
                  <select
                    value={stockModal.gstRate !== undefined ? stockModal.gstRate : 18}
                    onChange={(e) => setStockModal({ ...stockModal, gstRate: Number(e.target.value) })}
                    className="w-full mt-1 px-3 py-2.5 rounded-xl border border-blue-300 dark:border-blue-900 bg-blue-50 dark:bg-blue-950/40 text-blue-900 dark:text-blue-300 font-bold outline-none text-xs"
                  >
                    {GST_RATE_OPTIONS.map((g) => (
                      <option key={g.value} value={g.value}>
                        {g.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col justify-end">
                  <label className="flex items-center gap-2 p-2.5 rounded-xl bg-cyan-50 dark:bg-cyan-950/40 border border-cyan-200 dark:border-cyan-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={stockModal.isReturnable !== false}
                      onChange={(e) => setStockModal({ ...stockModal, isReturnable: e.target.checked })}
                      className="w-4 h-4 text-cyan-600 rounded"
                    />
                    <span className="text-[11px] font-bold text-cyan-900 dark:text-cyan-200">7-Day Return</span>
                  </label>
                </div>
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
          
          {/* Executive Header & Control Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white dark:bg-slate-900/90 border border-gray-200/80 dark:border-slate-800 p-4 sm:p-5 rounded-2xl shadow-sm">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-gray-900 dark:text-white flex items-center gap-2">
                  <Activity size={20} className="text-emerald-500" />
                  <span>Store Performance Intelligence & Analytics</span>
                </h2>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              </div>
              <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                Real-time sales tracking, 7-day revenue trend, customer lifetime value & inventory valuation.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Period Filter Pills */}
              <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-gray-200 dark:border-slate-700 text-xs">
                {[
                  { id: "all", label: "All Time" },
                  { id: "today", label: "Today" },
                  { id: "7days", label: "Last 7 Days" },
                  { id: "30days", label: "Last 30 Days" }
                ].map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setAnalyticsPeriod(p.id)}
                    className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                      analyticsPeriod === p.id 
                        ? "bg-emerald-500 text-white shadow-sm font-black" 
                        : "text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white"
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              {/* Export CSV Tool */}
              <button
                type="button"
                onClick={exportOrdersCSV}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-md shadow-emerald-600/20 active:scale-95 transition-all cursor-pointer"
                title="Download complete orders spreadsheet (.csv)"
              >
                <FileSpreadsheet size={15} />
                <span>Export CSV 📊</span>
              </button>
            </div>
          </div>

          {/* Top 6 Primary KPI Metric Cards (Driven by Selected Period) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
            <div className="bg-white dark:bg-slate-900/90 p-4 rounded-2xl border border-gray-200/80 dark:border-slate-800 shadow-sm hover:border-emerald-500/40 transition-colors">
              <p className="text-gray-500 dark:text-slate-400 font-bold text-[10px] uppercase tracking-wider flex items-center justify-between">
                <span>Revenue</span>
                <span className="text-[9px] text-emerald-500 font-black">Delivered</span>
              </p>
              <h3 className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">₹{formatPrice(periodRevenue)}</h3>
              <p className="text-[10px] text-gray-400 dark:text-slate-500 mt-0.5">{analyticsPeriod === 'all' ? 'Lifetime Sales' : `${analyticsPeriod.toUpperCase()} Sales`}</p>
            </div>
            
            <div className="bg-white dark:bg-slate-900/90 p-4 rounded-2xl border border-gray-200/80 dark:border-slate-800 shadow-sm hover:border-indigo-500/40 transition-colors">
              <p className="text-gray-500 dark:text-slate-400 font-bold text-[10px] uppercase tracking-wider flex items-center justify-between">
                <span>Net Profit 💰</span>
                <span className="text-[9px] text-indigo-500 font-black">{periodProfitMargin}% Margin</span>
              </p>
              <h3 className="text-xl sm:text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-1">₹{formatPrice(periodOwnerProfit)}</h3>
              <p className="text-[10px] text-gray-400 dark:text-slate-500 mt-0.5">Estimated Net Margin</p>
            </div>

            <div className="bg-white dark:bg-slate-900/90 p-4 rounded-2xl border border-gray-200/80 dark:border-slate-800 shadow-sm hover:border-blue-500/40 transition-colors">
              <p className="text-gray-500 dark:text-slate-400 font-bold text-[10px] uppercase tracking-wider">Delivered Orders</p>
              <h3 className="text-xl sm:text-2xl font-black text-blue-600 dark:text-blue-400 mt-1">{periodDeliveredOrders.length}</h3>
              <p className="text-[10px] text-gray-400 dark:text-slate-500 mt-0.5">Completed Handover</p>
            </div>

            <div className="bg-white dark:bg-slate-900/90 p-4 rounded-2xl border border-gray-200/80 dark:border-slate-800 shadow-sm hover:border-purple-500/40 transition-colors">
              <p className="text-gray-500 dark:text-slate-400 font-bold text-[10px] uppercase tracking-wider">Units Sold 📦</p>
              <h3 className="text-xl sm:text-2xl font-black text-purple-600 dark:text-purple-400 mt-1">{periodUnitsSold}</h3>
              <p className="text-[10px] text-gray-400 dark:text-slate-500 mt-0.5">Total Quantity</p>
            </div>

            <div className="bg-white dark:bg-slate-900/90 p-4 rounded-2xl border border-gray-200/80 dark:border-slate-800 shadow-sm hover:border-amber-500/40 transition-colors">
              <p className="text-gray-500 dark:text-slate-400 font-bold text-[10px] uppercase tracking-wider">Avg Order Value</p>
              <h3 className="text-xl sm:text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">₹{formatPrice(periodAOV)}</h3>
              <p className="text-[10px] text-gray-400 dark:text-slate-500 mt-0.5">AOV per Order</p>
            </div>

            <div className="bg-white dark:bg-slate-900/90 p-4 rounded-2xl border border-gray-200/80 dark:border-slate-800 shadow-sm hover:border-teal-500/40 transition-colors">
              <p className="text-gray-500 dark:text-slate-400 font-bold text-[10px] uppercase tracking-wider">Store Users</p>
              <h3 className="text-xl sm:text-2xl font-black text-teal-600 dark:text-teal-400 mt-1">{usersList.length}</h3>
              <p className="text-[10px] text-gray-400 dark:text-slate-500 mt-0.5">Registered Accounts</p>
            </div>
          </div>

          {/* Operational Conversion & Store Health Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/90 border border-gray-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-gray-500 dark:text-slate-400 font-bold text-[10px] uppercase">Fulfillment Success Rate</p>
                <h4 className="text-lg font-black text-emerald-600 dark:text-emerald-400 mt-0.5">{fulfillmentRate}%</h4>
                <p className="text-[10px] text-gray-400">Delivered vs Active Orders</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                🚚
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/90 border border-gray-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-gray-500 dark:text-slate-400 font-bold text-[10px] uppercase">Order Cancellation Rate</p>
                <h4 className="text-lg font-black text-rose-600 dark:text-rose-400 mt-0.5">{cancellationRate}%</h4>
                <p className="text-[10px] text-gray-400">Cancelled / Total Orders</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold">
                🔴
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/90 border border-gray-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-gray-500 dark:text-slate-400 font-bold text-[10px] uppercase">7-Day Return Rate</p>
                <h4 className="text-lg font-black text-cyan-600 dark:text-cyan-400 mt-0.5">{returnRate}%</h4>
                <p className="text-[10px] text-gray-400">Returns / Completed Orders</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-cyan-50 dark:bg-cyan-950/40 text-cyan-600 dark:text-cyan-400 flex items-center justify-center font-bold">
                🔄
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/90 border border-gray-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-gray-500 dark:text-slate-400 font-bold text-[10px] uppercase">Active Catalog Stock</p>
                <h4 className="text-lg font-black text-purple-600 dark:text-purple-400 mt-0.5">{productsList.length} SKUs</h4>
                <p className="text-[10px] text-gray-400">Products live on store</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
                🏷️
              </div>
            </div>
          </div>

          {/* Interactive 7-Day Revenue & Orders Trend Bar Chart */}
          <div className="bg-white dark:bg-slate-900/90 p-5 rounded-2xl border border-gray-200/80 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-sm sm:text-base font-black text-gray-900 dark:text-white flex items-center gap-2">
                  <TrendingUp size={18} className="text-emerald-500" />
                  <span>7-Day Daily Revenue & Orders Velocity</span>
                </h3>
                <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                  Day-by-day revenue generation and volume throughput over the past week.
                </p>
              </div>
              <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                Peak Day: ₹{formatPrice(max7DayRevenue)}
              </span>
            </div>

            {/* Visual Bar Chart */}
            <div className="grid grid-cols-7 gap-2 sm:gap-4 items-end h-48 pt-4 pb-2 px-1">
              {last7DaysTrend.map((day, idx) => {
                const heightPercent = max7DayRevenue > 0 ? Math.max(12, Math.round((day.revenue / max7DayRevenue) * 100)) : 12;
                return (
                  <div key={idx} className="flex flex-col items-center h-full justify-end group">
                    <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 mb-1 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      ₹{formatPrice(day.revenue)}
                    </span>
                    <div className="w-full max-w-[36px] bg-slate-100 dark:bg-slate-800 rounded-xl overflow-hidden flex flex-col justify-end h-32 relative shadow-inner">
                      <div 
                        className="w-full bg-gradient-to-t from-emerald-600 to-teal-400 rounded-xl transition-all duration-700 group-hover:from-emerald-500 group-hover:to-teal-300 shadow-sm flex items-center justify-center"
                        style={{ height: `${heightPercent}%` }}
                      >
                      </div>
                    </div>
                    <span className="text-[11px] font-bold text-gray-700 dark:text-slate-300 mt-2 truncate">
                      {day.label}
                    </span>
                    <span className="text-[9px] text-gray-400 dark:text-slate-500 font-mono">
                      {day.orders} ord.
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Two-Column Analytics Grid: Category Performance + Payment Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            
            {/* Category Revenue & Volume Performance */}
            <div className="bg-white dark:bg-slate-900/90 p-5 rounded-2xl border border-gray-200/80 dark:border-slate-800 shadow-sm space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-slate-800">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Layers size={18} className="text-indigo-500" />
                  <span>Category Revenue & Share ({categorySalesBreakdown.length})</span>
                </h3>
                <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase">Ranked by Sales</span>
              </div>

              {categorySalesBreakdown.length === 0 ? (
                <p className="text-gray-400 text-xs py-8 text-center">No category sales recorded yet.</p>
              ) : (
                <div className="space-y-3 pt-1 text-xs">
                  {categorySalesBreakdown.slice(0, 5).map((cat, idx) => {
                    const sharePercent = totalRevenue > 0 ? Math.round((cat.revenue / totalRevenue) * 100) : 0;
                    return (
                      <div key={idx} className="space-y-1">
                        <div className="flex justify-between items-center font-bold">
                          <span className="text-gray-800 dark:text-slate-200 capitalize flex items-center gap-1.5">
                            <span className="text-indigo-500 font-mono text-[10px]">#{idx + 1}</span>
                            <span>{cat.category}</span>
                            <span className="text-[10px] text-gray-400 font-normal">({cat.units} sold)</span>
                          </span>
                          <span className="text-gray-900 dark:text-white font-mono font-black">
                            ₹{formatPrice(cat.revenue)} ({sharePercent}%)
                          </span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-gray-100 dark:bg-slate-800 overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-500" 
                            style={{ width: `${Math.min(100, Math.max(8, sharePercent))}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Payment Methods Breakdown */}
            <div className="bg-white dark:bg-slate-900/90 p-5 rounded-2xl border border-gray-200/80 dark:border-slate-800 shadow-sm space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-slate-800">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <CreditCard size={18} className="text-emerald-500" />
                  <span>Revenue by Payment Method (Single & Split)</span>
                </h3>
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase">100% Verified</span>
              </div>
              
              <div className="space-y-3 pt-1 text-xs">
                {[
                  { label: "Credit / Debit Card", amount: paymentMethodStats.card, color: "bg-blue-500" },
                  { label: "UPI & Instant QR Scan", amount: paymentMethodStats.upi, color: "bg-emerald-500" },
                  { label: "ShopIndia Digital Wallet", amount: paymentMethodStats.wallet, color: "bg-indigo-500" },
                  { label: "Cash on Delivery (COD)", amount: paymentMethodStats.cod, color: "bg-amber-500" }
                ].map((m, idx) => {
                  const percent = totalRevenue > 0 ? Math.round((m.amount / totalRevenue) * 100) : 0;
                  return (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between font-bold">
                        <span className="text-gray-700 dark:text-slate-300">{m.label}</span>
                        <span className="text-gray-900 dark:text-white font-mono">₹{formatPrice(m.amount)} ({percent}%)</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-gray-100 dark:bg-slate-800 overflow-hidden">
                        <div className={`h-full ${m.color} rounded-full transition-all duration-500`} style={{ width: `${percent}%` }}></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

          {/* Two-Column Grid: VIP Customer Spenders + Inventory Valuation */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            
            {/* Top VIP Customer Spenders Leaderboard */}
            <div className="bg-white dark:bg-slate-900/90 p-5 rounded-2xl border border-gray-200/80 dark:border-slate-800 shadow-sm space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-slate-800">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Users size={18} className="text-teal-500" />
                  <span>Top VIP Customer Spenders (Customer LTV)</span>
                </h3>
                <span className="text-[10px] font-bold text-teal-600 dark:text-teal-400 uppercase">Top Buyers</span>
              </div>

              {topCustomerSpenders.length === 0 ? (
                <p className="text-gray-400 text-xs py-8 text-center">No customer spend recorded.</p>
              ) : (
                <div className="space-y-2 text-xs">
                  {topCustomerSpenders.map((cust, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-gray-200/80 dark:border-slate-700/80">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="w-6 h-6 rounded-full bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 border border-teal-200 dark:border-teal-800 flex items-center justify-center font-black text-[11px] shrink-0">
                          #{idx + 1}
                        </span>
                        <div className="min-w-0">
                          <p className="font-bold text-gray-900 dark:text-white truncate">{cust.name}</p>
                          <p className="text-[10px] text-gray-500 dark:text-slate-400 truncate">{cust.email} • {cust.totalOrders} Orders</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <div className="text-right">
                          <p className="font-black text-emerald-600 dark:text-emerald-400 text-xs sm:text-sm">₹{formatPrice(cust.totalSpent)}</p>
                          <p className="text-[10px] text-gray-400">Wallet: ₹{formatPrice(cust.walletBalance)}</p>
                        </div>
                        {cust.userId && (
                          <button
                            type="button"
                            onClick={() => setGiftModal({ show: true, userId: cust.userId, userEmail: cust.email, amount: "500" })}
                            className="p-1.5 rounded-lg bg-teal-50 hover:bg-teal-100 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 border border-teal-200 dark:border-teal-800 cursor-pointer"
                            title="Gift Store Credits"
                          >
                            <Gift size={13} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Store Inventory Capital Valuation & Risk Analyzer */}
            <div className="bg-white dark:bg-slate-900/90 p-5 rounded-2xl border border-gray-200/80 dark:border-slate-800 shadow-sm space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-slate-800">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Boxes size={18} className="text-amber-500" />
                  <span>Store Inventory Capital & Valuation</span>
                </h3>
                <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase">Stock Intelligence</span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-xs pt-1">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-gray-200 dark:border-slate-700 space-y-0.5">
                  <p className="text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase">Capital Locked</p>
                  <p className="text-sm sm:text-base font-black text-gray-900 dark:text-white">₹{formatPrice(inventoryValuation.totalCost)}</p>
                  <p className="text-[9px] text-gray-400">At Cost Value</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-gray-200 dark:border-slate-700 space-y-0.5">
                  <p className="text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase">Retail Value</p>
                  <p className="text-sm sm:text-base font-black text-emerald-600 dark:text-emerald-400">₹{formatPrice(inventoryValuation.totalRetail)}</p>
                  <p className="text-[9px] text-gray-400">Potential Gross</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-gray-200 dark:border-slate-700 space-y-0.5">
                  <p className="text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase">Unrealized Profit</p>
                  <p className="text-sm sm:text-base font-black text-indigo-600 dark:text-indigo-400">₹{formatPrice(inventoryValuation.potentialProfit)}</p>
                  <p className="text-[9px] text-gray-400">Projected Margin</p>
                </div>
              </div>

              {/* Stock Health Badges */}
              <div className="space-y-1.5 pt-2 text-xs">
                <p className="text-[11px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Inventory Health Distribution</p>
                <div className="flex flex-wrap gap-2 text-[11px] font-bold">
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                    🟢 Healthy Stock: {inventoryValuation.healthyStock} SKUs
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 flex items-center gap-1">
                    ⚠️ Low Stock (1-5): {inventoryValuation.lowStock} SKUs
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 flex items-center gap-1">
                    🔴 Out of Stock: {inventoryValuation.outOfStock} SKUs
                  </span>
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

          {/* GST & 7-Day Return Quick Status Banner */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-900 dark:text-indigo-200 text-xs font-bold">
            <div className="flex items-center gap-2">
              <Sparkles size={18} className="text-indigo-500 shrink-0" />
              <span>Categorized GST Ready: Auto-assign Food & Groceries (5%), Apparel (12%), Tech (18%) and 7-Day Return to products.</span>
            </div>
            <button
              onClick={() => handleSyncAllGst(true)}
              disabled={gstSyncLoading}
              className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs shrink-0 shadow-sm transition-all cursor-pointer disabled:opacity-50"
            >
              {gstSyncLoading ? "Syncing..." : "⚡ Auto-Assign Category GST to All"}
            </button>
          </div>

          {/* Inventory Items Grid */}
          {filteredInventory.length === 0 ? (
            <div className="p-10 text-center text-gray-400 bg-white dark:bg-[#070b14] rounded-2xl border border-gray-200 dark:border-slate-800">
              No inventory records matched your filters.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {paginatedInventory.map((p) => {
                const stockQty = Number(p.stock || 0);
                const isOutOfStock = stockQty <= 0;
                const isLowStock = stockQty > 0 && stockQty <= 10;
                const isReturnable = p.isReturnable !== false;
                const hasGst = p.gstRate !== undefined && p.gstRate !== null;

                return (
                  <div key={p.id} className="bg-white dark:bg-[#070b14] border border-gray-200/80 dark:border-slate-800 p-4 rounded-2xl shadow-sm flex flex-col justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-14 h-14 bg-white dark:bg-white rounded-xl p-1 shrink-0 border border-gray-200 dark:border-slate-700 flex items-center justify-center overflow-hidden shadow-sm">
                        <img src={p.thumbnail} alt={p.title} className="w-full h-full object-contain" />
                      </div>
                      <div className="min-w-0 space-y-1">
                        <h4 className="font-bold text-xs sm:text-sm text-gray-900 dark:text-white truncate">{p.title}</h4>
                        <p className="text-[11px] text-gray-500 dark:text-slate-400">
                          Selling: <span className="font-bold text-emerald-600 dark:text-emerald-400">₹{formatPrice(p.price)}</span> | Buying: ₹{p.costPrice || 0}
                        </p>
                        
                        {/* Status Badges: Stock, GST, and 7-Day Return */}
                        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                          {/* Stock Status */}
                          <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                            isOutOfStock ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800' :
                            isLowStock ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800' :
                            'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                          }`}>
                            {isOutOfStock ? 'Out of Stock' : isLowStock ? `Low (${stockQty})` : `Stock: ${stockQty}`}
                          </span>

                          {/* GST Rate Badge */}
                          {hasGst ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                              GST: {p.gstRate}%
                            </span>
                          ) : (
                            <button
                              onClick={() => handleQuickSetGst(p.id, 18)}
                              className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800 hover:bg-amber-500 hover:text-white transition-colors cursor-pointer"
                              title="Click to quickly assign 18% GST"
                            >
                              ⚠️ No GST (Set 18%)
                            </button>
                          )}

                          {/* 7-Day Return Badge & 1-Click Toggle */}
                          <button
                            onClick={() => handleToggleReturn(p.id, isReturnable)}
                            className={`px-2 py-0.5 rounded text-[10px] font-black uppercase border transition-colors cursor-pointer ${
                              isReturnable
                                ? 'bg-cyan-50 dark:bg-cyan-950/40 text-cyan-700 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800 hover:bg-rose-50 hover:text-rose-600'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-300 dark:border-slate-700 hover:bg-cyan-50 hover:text-cyan-700'
                            }`}
                            title="Click to toggle 7-Day return policy"
                          >
                            {isReturnable ? '🔄 7-Day Return' : '🚫 Non-Returnable'}
                          </button>
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
                        onClick={() => setStockModal({ 
                          show: true, 
                          product: p, 
                          stock: p.stock ?? 0, 
                          costPrice: p.costPrice || 0, 
                          price: p.price || 0,
                          gstRate: p.gstRate !== undefined ? p.gstRate : 18,
                          isReturnable: p.isReturnable !== false
                        })} 
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
                <label className="text-xs font-bold text-gray-700 dark:text-slate-300 uppercase">Product Title</label>
                <input 
                  type="text" 
                  value={product.title} 
                  onChange={(e) => setProduct({...product, title: e.target.value})} 
                  required 
                  placeholder="e.g. Wireless Earbuds" 
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:border-emerald-500 text-xs sm:text-sm" 
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700 dark:text-slate-300 uppercase">MRP Price (₹)</label>
                <input 
                  type="number" 
                  value={product.mrp} 
                  onChange={(e) => handlePricingChange('mrp', e.target.value)} 
                  required 
                  placeholder="e.g. 1999" 
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:border-emerald-500 text-xs sm:text-sm" 
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
                <label className="text-xs font-bold text-gray-700 dark:text-slate-300 uppercase">Discount (%)</label>
                <input 
                  type="number" 
                  value={product.discount} 
                  onChange={(e) => handlePricingChange('discount', e.target.value)} 
                  placeholder="e.g. 20" 
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:border-emerald-500 text-xs sm:text-sm" 
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
                <label className="text-xs font-bold text-gray-700 dark:text-slate-300 uppercase">Stock Quantity</label>
                <input 
                  type="number" 
                  value={product.stock} 
                  onChange={(e) => setProduct({...product, stock: e.target.value})} 
                  required 
                  placeholder="e.g. 50" 
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:border-emerald-500 text-xs sm:text-sm" 
                />
              </div>

              {/* GST Rate Field */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase flex items-center gap-1">
                  <span>GST Rate (%)</span>
                  <span className="text-[10px] text-slate-400 font-normal">Tax Slab</span>
                </label>
                <select 
                  value={product.gstRate} 
                  onChange={(e) => setProduct({...product, gstRate: e.target.value})} 
                  className="w-full px-3.5 py-2.5 rounded-xl border border-indigo-200 dark:border-indigo-900/50 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:border-indigo-500 text-xs sm:text-sm cursor-pointer font-bold"
                >
                  {GST_RATE_OPTIONS.map((g) => (
                    <option key={g.value} value={g.value} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">
                      {g.label}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700 dark:text-slate-300 uppercase">Category</label>
                <select 
                  value={product.category} 
                  onChange={(e) => {
                    const newCat = e.target.value;
                    const suggestedGst = getSuggestedGstRate(newCat);
                    setProduct({ ...product, category: newCat, gstRate: String(suggestedGst) });
                  }} 
                  required 
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:border-emerald-500 text-xs sm:text-sm cursor-pointer"
                >
                  <option value="" disabled className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">Select Category...</option>
                  {categoriesList.map((cat) => (
                    <option key={cat.id} value={cat.value} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">
                      {cat.icon} {cat.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="space-y-1 sm:col-span-2">
                <label className="text-xs font-bold text-gray-700 dark:text-slate-300 uppercase">Image URL</label>
                <input 
                  type="text" 
                  value={product.thumbnail} 
                  onChange={(e) => setProduct({...product, thumbnail: e.target.value})} 
                  required 
                  placeholder="https://..." 
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:border-emerald-500 text-xs sm:text-sm" 
                />
              </div>

              {/* 7-Day Product Return Policy Toggle */}
              <div className="space-y-1 sm:col-span-2 flex items-center justify-between p-3 rounded-xl border border-cyan-200 dark:border-cyan-900/50 bg-cyan-50/60 dark:bg-cyan-950/20">
                <div className="pr-3">
                  <span className="text-xs font-bold text-cyan-900 dark:text-cyan-300 flex items-center gap-1.5">
                    <RefreshCw size={14} className="text-cyan-500" />
                    <span>7-Day Easy Return Policy</span>
                  </span>
                  <p className="text-[10px] text-slate-600 dark:text-slate-400 mt-0.5">
                    Enable to allow customers 7 days replacement or instant wallet refund after delivery.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input 
                    type="checkbox" 
                    checked={product.isReturnable} 
                    onChange={(e) => setProduct({...product, isReturnable: e.target.checked})}
                    className="sr-only peer" 
                  />
                  <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-cyan-500"></div>
                </label>
              </div>

              <div className="space-y-1 sm:col-span-full">
                <label className="text-xs font-bold text-gray-700 dark:text-slate-300 uppercase">Description</label>
                <textarea 
                  value={product.description} 
                  onChange={(e) => setProduct({...product, description: e.target.value})} 
                  required 
                  rows="2" 
                  placeholder="Product specifications and features..." 
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:border-emerald-500 text-xs sm:text-sm resize-none"
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
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <h3 className="text-base font-bold text-gray-900 dark:text-white">Product Catalog ({productsList.length})</h3>
              
              <button
                type="button"
                onClick={() => handleSyncAllGst(true)}
                disabled={gstSyncLoading}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 rounded-xl text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
              >
                <FileText size={14} />
                <span>{gstSyncLoading ? "Syncing..." : "Auto-Assign Category GST (Food 5%, Tech 18%)"}</span>
              </button>
            </div>

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
                    const gstRate = item.gstRate !== undefined ? item.gstRate : 18;
                    const isReturnable = item.isReturnable !== false;

                    return (
                      <div key={item.id} className="bg-white dark:bg-[#070b14] border border-gray-200/80 dark:border-slate-800 p-3.5 sm:p-4 rounded-2xl flex flex-col sm:flex-row justify-between gap-3 items-start sm:items-center shadow-sm">
                        <div className="flex gap-3 items-center flex-1 min-w-0">
                          <div className="w-14 h-14 bg-white dark:bg-white rounded-xl p-1.5 flex items-center justify-center shrink-0 border border-gray-200 dark:border-slate-700 shadow-sm overflow-hidden">
                            <img src={item.thumbnail} alt={item.title} className="w-full h-full object-contain" />
                          </div>
                          <div className="space-y-0.5 min-w-0">
                            <h4 className="font-bold text-xs sm:text-sm text-gray-900 dark:text-white truncate">{item.title}</h4>
                            <div className="flex flex-wrap gap-1.5 text-[10px]">
                              <span className="bg-slate-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 px-1.5 py-0.2 rounded font-mono">MRP: ₹{item.mrp || item.price}</span>
                              <span className="bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 px-1.5 py-0.2 rounded font-semibold">Cost: ₹{item.costPrice || 0}</span>
                              <span className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.2 rounded font-bold">Selling: ₹{formatPrice(sellingPrice)}</span>
                              <span className="bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 px-1.5 py-0.2 rounded font-bold">
                                {gstRate}% GST
                              </span>
                              <span className={`px-1.5 py-0.2 rounded font-bold border ${
                                isReturnable 
                                  ? "bg-cyan-50 dark:bg-cyan-950/40 text-cyan-600 dark:text-cyan-400 border-cyan-200 dark:border-cyan-800" 
                                  : "bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700"
                              }`}>
                                {isReturnable ? "🔄 7-Day Return" : "🚫 Non-Returnable"}
                              </span>
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
          
          {/* Action Required Alert Banner for Pending/Confirmed Orders */}
          {needsPackingOrders.length > 0 && (
            <div className="p-4 rounded-2xl bg-amber-500/10 border-2 border-amber-500/40 text-amber-950 dark:text-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm animate-pulse-subtle">
              <div className="flex items-center gap-3">
                <span className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-black text-lg shadow-sm shrink-0">
                  📦
                </span>
                <div>
                  <h4 className="font-black text-sm sm:text-base">
                    {needsPackingOrders.length} New Order{needsPackingOrders.length > 1 ? "s" : ""} Waiting for Warehouse Shipping!
                  </h4>
                  <p className="text-xs text-amber-700 dark:text-amber-300">
                    Click <strong>"Ship Order 📦"</strong> below to generate ShopIndia Prime AWB label and prepare courier handover.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => { setOrderStatusFilter("needs-packing"); setOrdersPage(1); }}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-xl shadow-sm cursor-pointer whitespace-nowrap shrink-0"
              >
                Show {needsPackingOrders.length} New Orders ⚡
              </button>
            </div>
          )}

          {/* Top Bar with Search & Status Tabs */}
          <div className="flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-gray-900 dark:text-white">Customer Orders</h3>
                <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                  {ordersList.length} Total
                </span>
              </div>
              
              <div className="w-full sm:w-72 flex items-center bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 px-3 py-2 rounded-xl text-xs shadow-sm focus-within:border-emerald-500">
                <Search size={14} className="text-gray-400 dark:text-slate-400 mr-2 shrink-0" />
                <input 
                  type="text" 
                  value={orderSearchQuery} 
                  onChange={(e) => { setOrderSearchQuery(e.target.value); setOrdersPage(1); }} 
                  placeholder="Search Order ID, Customer, AWB..." 
                  className="w-full bg-transparent text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-slate-400 outline-none"
                />
              </div>
            </div>

            {/* Quick Status Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1">
              {[
                { id: "all", label: `All (${ordersList.length})` },
                { id: "needs-packing", label: `🔥 Needs Shipping (${needsPackingOrders.length})`, highlight: needsPackingOrders.length > 0 },
                { id: "packed", label: `📦 Shipping Orders (${packedOrders.length})` },
                { id: "dispatched", label: `🛵 In Transit (${inTransitOrders.length})` },
                { id: "delivered", label: `✅ Delivered (${deliveredOrders.length})` },
                { id: "cancelled", label: `🔴 Cancelled (${cancelledOrders.length})` },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => { setOrderStatusFilter(tab.id); setOrdersPage(1); }}
                  className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                    orderStatusFilter === tab.id
                      ? tab.highlight 
                        ? "bg-amber-500 text-slate-950 font-black shadow-md shadow-amber-500/20" 
                        : "bg-indigo-600 text-white font-black shadow-md shadow-indigo-600/20"
                      : tab.highlight
                      ? "bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800 font-black animate-pulse"
                      : "bg-white dark:bg-slate-900 text-gray-700 dark:text-slate-300 border border-gray-200 dark:border-slate-800 hover:bg-gray-100"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {filteredOrders.length === 0 ? (
            <div className="p-10 text-center text-gray-400 bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800">
              No orders found.
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {paginatedOrders.map((order) => {
                  const isReturnRequested = String(order.status || "").includes("Return Requested");
                  const trackingId = getOrderTrackingNumber(order);
                  const statusLower = String(order.status || "").toLowerCase();
                  const isNeedsPacking = isOrderNeedingPacking(order);
                  const isPacked = (statusLower.includes("packed") || statusLower.includes("shipping") || Number(order.orderStage) === 2) && 
                    !statusLower.includes("cancel") && 
                    !statusLower.includes("delivered") && 
                    !statusLower.includes("on the way") && 
                    !statusLower.includes("dispatched") &&
                    !statusLower.includes("out for delivery");
                  const isDispatched = statusLower.includes("dispatched") || statusLower.includes("partner assigned") || statusLower.includes("on the way") || statusLower.includes("picked up");
                  const isOutForDelivery = statusLower.includes("out for delivery");
                  const isDelivered = statusLower.includes("delivered");

                  return (
                    <div key={order.id} className={`bg-white dark:bg-slate-900/90 border p-4 sm:p-5 rounded-2xl shadow-sm flex flex-col justify-between gap-3 transition-all ${
                      isNeedsPacking ? "border-amber-400/70 dark:border-amber-500/50 ring-1 ring-amber-400/30" : "border-gray-200/80 dark:border-slate-800"
                    }`}>
                      <div className="flex flex-col sm:flex-row justify-between gap-3 items-start sm:items-center">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <p className="font-bold text-sm text-gray-900 dark:text-white">{order.shipping?.name || order.userEmail || "Customer"}</p>
                            {isNeedsPacking && (
                              <span className="px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 font-black text-[10px] uppercase tracking-wider animate-pulse">
                                Needs Packing 🔥
                              </span>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-[11px] text-gray-400 dark:text-slate-500 font-mono">ID: #{order.id?.slice(0, 8)}</p>
                            <span className="text-gray-300 dark:text-slate-700">•</span>
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(trackingId);
                                notify.info("Tracking ID Copied! 📋", trackingId);
                              }}
                              className="inline-flex items-center gap-1 text-[11px] font-mono font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded border border-indigo-200 dark:border-indigo-800 cursor-pointer"
                              title="Click to copy AWB Tracking ID"
                            >
                              <Truck size={12} />
                              <span>AWB: {trackingId}</span>
                              <Copy size={10} />
                            </button>
                          </div>
                          <p className="text-[11px] text-gray-500 dark:text-slate-400">Date: {formatOrderDate(order.date)}</p>
                          
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
                          <div className="flex flex-wrap items-center gap-1.5">
                            {order.otp && (
                              <span className="bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border border-blue-300 dark:border-blue-800 px-2 py-0.5 rounded-md font-mono text-[10px] font-black tracking-wider">
                                🔐 OTP: {order.otp}
                              </span>
                            )}
                            <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-md border ${
                              isReturnRequested 
                                ? "bg-cyan-50 dark:bg-cyan-950/40 text-cyan-700 dark:text-cyan-300 border-cyan-300 dark:border-cyan-800 animate-pulse" 
                                : isDelivered
                                ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800"
                                : isOutForDelivery
                                ? "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-800 animate-pulse"
                                : isDispatched
                                ? "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border-indigo-300 dark:border-indigo-800"
                                : isPacked
                                ? "bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border-sky-300 dark:border-sky-800"
                                : isNeedsPacking
                                ? "bg-amber-500 text-slate-950 font-black border-amber-600 shadow-sm"
                                : "bg-slate-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 border-gray-200 dark:border-slate-700"
                            }`}>
                              {order.status}
                            </span>
                          </div>
                          
                          <div className="flex flex-wrap items-center gap-1.5">
                            {/* Admin Instant Status Selector Dropdown */}
                            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg px-2 py-1 shadow-inner">
                              <span className="text-[10px] font-black uppercase text-gray-500 dark:text-slate-400">Status:</span>
                              <select
                                value={order.status}
                                onChange={(e) => handleAdminStatusChange(order.id, e.target.value)}
                                className="text-xs font-bold bg-transparent text-gray-900 dark:text-white outline-none cursor-pointer"
                                title="Admin Direct Status Override"
                              >
                                <option value="Order Confirmed 📦" className="bg-white dark:bg-slate-900 text-gray-900 dark:text-white">1. Order Confirmed 📦</option>
                                <option value="Shipping Order 📦" className="bg-white dark:bg-slate-900 text-gray-900 dark:text-white">2. Shipping Order 📦</option>
                                <option value="Your Order is on the Way 🚚" className="bg-white dark:bg-slate-900 text-gray-900 dark:text-white">3. On the Way 🚚</option>
                                <option value="Out for Delivery 🛵" className="bg-white dark:bg-slate-900 text-gray-900 dark:text-white">4. Out for Delivery 🛵</option>
                                <option value="Delivered ✅" className="bg-white dark:bg-slate-900 text-gray-900 dark:text-white">5. Delivered ✅ (No OTP)</option>
                                <option value="Cancelled 🔴" className="bg-white dark:bg-slate-900 text-gray-900 dark:text-white">Cancelled 🔴</option>
                              </select>
                            </div>

                            {/* Prominent Direct Delivery Override Button (Without OTP) */}
                            {!isDelivered && !order.status?.includes("Cancelled") && (
                              <button
                                onClick={() => handleAdminDirectDeliver(order.id)}
                                className="flex items-center gap-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white py-1.5 px-3 rounded-lg font-black text-xs transition-transform active:scale-95 shadow-md shadow-emerald-600/20 cursor-pointer"
                                title="Admin Direct Delivery Override (Without OTP required)"
                              >
                                <CheckCircle size={14} />
                                <span>Mark Delivered ✅ (No OTP)</span>
                              </button>
                            )}

                            {/* Order Stage Controls - Ship Order clearly visible */}
                            {isNeedsPacking && !order.status?.includes("Cancelled") && (
                              <button
                                onClick={() => handlePackOrder(order.id)}
                                className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 py-1.5 px-3 rounded-lg font-black text-xs transition-transform active:scale-95 shadow-md shadow-amber-500/20 cursor-pointer"
                                title="Stage 2: Ship Item & Generate Official AWB Shipping Label"
                              >
                                <Package size={14} />
                                <span>Ship Order 📦</span>
                              </button>
                            )}

                            {isPacked && !order.status?.includes("Cancelled") && (
                              <button
                                onClick={() => handleDispatchOrder(order.id)}
                                className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white py-1.5 px-3 rounded-lg font-black text-xs transition-transform active:scale-95 shadow-md shadow-blue-600/20 cursor-pointer"
                                title="Stage 3: Handover to Courier / Dispatch"
                              >
                                <Truck size={14} />
                                <span>Handover Courier 🚚</span>
                              </button>
                            )}

                            <button
                              onClick={() => {
                                downloadInvoicePDF(order);
                                notify.success("Tax Invoice PDF downloaded! 📥");
                              }}
                              className="flex items-center gap-1 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 py-1.5 px-2.5 rounded-lg font-bold text-xs hover:bg-emerald-600 hover:text-white transition-colors cursor-pointer"
                              title="Instant Download Official GST Tax Invoice (.pdf)"
                            >
                              <Download size={13} />
                              <span>Download PDF 📥</span>
                            </button>

                            <button
                              onClick={() => setInvoiceModal({ show: true, order })}
                              className="flex items-center gap-1 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60 py-1.5 px-2.5 rounded-lg font-bold text-xs hover:bg-indigo-600 hover:text-white transition-colors cursor-pointer"
                            >
                              <FileText size={13} />
                              <span>View Bill 📄</span>
                            </button>

                            {!order.status?.includes("Cancelled") && !isReturnRequested && !isDelivered && (
                              <button 
                                onClick={() => setConfirmDialog({show: true, id: order.id, actionType: "CANCEL_ORDER", message: "Cancel this order and refund prepaid amount to customer wallet?"})} 
                                className="bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 py-1.5 px-2.5 rounded-lg font-bold text-xs hover:bg-amber-500 hover:text-white transition-colors cursor-pointer"
                              >
                                Cancel 💰
                              </button>
                            )}
                            
                            <button 
                              onClick={() => setConfirmDialog({show: true, id: order.id, actionType: "DELETE_ORDER", message: "Delete this order record permanently?"})} 
                              className="bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-500/30 py-1.5 px-2.5 rounded-lg font-bold text-xs hover:bg-rose-500 hover:text-white transition-colors cursor-pointer"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Item Visual Previews for Store Admin / Packer */}
                      {order.items && Array.isArray(order.items) && order.items.length > 0 && (
                        <div className="pt-2 border-t border-gray-100 dark:border-slate-800/80 flex flex-wrap items-center gap-2">
                          {order.items.map((it, idx) => (
                            <div key={idx} className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/60 px-2.5 py-1.5 rounded-xl border border-gray-200/60 dark:border-slate-700/60">
                              <img 
                                src={it.image || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100"} 
                                alt={it.name || it.title} 
                                className="w-8 h-8 rounded-lg object-cover bg-white shrink-0 border border-gray-200 dark:border-slate-700" 
                              />
                              <div className="max-w-[180px] text-[11px]">
                                <p className="font-bold text-gray-800 dark:text-slate-200 truncate">{it.name || it.title}</p>
                                <p className="text-[10px] text-gray-500 dark:text-slate-400">Qty: <span className="font-bold text-indigo-600 dark:text-indigo-400">{it.quantity || 1}</span> • ₹{formatPrice(it.price)}</p>
                              </div>
                            </div>
                          ))}
                          {order.shipping?.address && (
                            <span className="text-[11px] text-gray-500 dark:text-slate-400 ml-auto flex items-center gap-1">
                              📍 {order.shipping.address}, PIN: {order.shipping.pincode || "380001"}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Return Request Action Bar for Store Owner */}
                      {isReturnRequested && (
                        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 bg-cyan-50/50 dark:bg-cyan-950/20 p-2.5 rounded-xl border border-cyan-100 dark:border-cyan-900/40">
                          <div>
                            <span className="text-xs font-bold text-cyan-900 dark:text-cyan-300 flex items-center gap-1.5">
                              <RotateCcw size={14} className="text-cyan-500" />
                              <span>Customer Requested 7-Day Return:</span>
                              <span className="font-black text-slate-800 dark:text-white">"{order.returnRequest?.reason || "Product Return"}"</span>
                            </span>
                            {order.returnRequest?.comment && (
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                                Note: {order.returnRequest.comment}
                              </p>
                            )}
                          </div>

                          <div className="flex gap-2">
                            <button
                              onClick={() => setConfirmDialog({ show: true, id: order.id, actionType: "APPROVE_RETURN", message: `Approve return and refund ₹${formatPrice(order.totalAmount)} to customer wallet?` })}
                              className="px-3 py-1 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-xs font-black shadow-sm cursor-pointer"
                            >
                              Approve & Refund 💰
                            </button>
                            <button
                              onClick={() => setConfirmDialog({ show: true, id: order.id, actionType: "REJECT_RETURN", message: "Reject this return request?" })}
                              className="px-3 py-1 bg-slate-200 dark:bg-slate-700 hover:bg-rose-500 hover:text-white text-slate-700 dark:text-slate-300 rounded-lg text-xs font-bold cursor-pointer"
                            >
                              Reject ✖️
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
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

      {/* Official Tax Invoice Modal */}
      <InvoiceModal
        show={invoiceModal.show}
        onClose={() => setInvoiceModal({ show: false, order: null })}
        order={invoiceModal.order}
      />

    </div>
  );
};

export default Admin;