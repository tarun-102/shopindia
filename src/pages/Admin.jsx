import { useState, useEffect } from "react";
import { 
  addProductToDB, getAllProducts, deleteProductFromDB, updateProductInDB,
  getAllOrders, cancelOrderInDB, deleteOrderFromDB 
} from "../services/productservices";
import { formatPrice } from "../utils/priceFormatter";

// 🔥 AAPKI POORI 25 CATEGORIES LIST
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
  const [activeTab, setActiveTab] = useState("products"); 

  const [product, setProduct] = useState({ title: "", price: "", category: "", thumbnail: "", description: "", });
  const [productsList, setProductsList] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [ordersList, setOrdersList] = useState([]);
  const [loading, setLoading] = useState(false);

  const [alertData, setAlertData] = useState({ show: false, message: "", icon: "" });
  const [confirmDialog, setConfirmDialog] = useState({ show: false, id: null, actionType: "", message: "" });

  const showCustomAlert = (message, icon) => {
    setAlertData({ show: true, message, icon });
    setTimeout(() => setAlertData({ show: false, message: "", icon: "" }), 5000); 
  };

  useEffect(() => {
    fetchProducts();
    fetchOrders(); 
  }, []);

  const fetchProducts = async () => setProductsList(await getAllProducts());
  const fetchOrders = async () => setOrdersList(await getAllOrders());

  const handleChange = (e) => setProduct({ ...product, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);  
    const productData = { ...product, price: Number(product.price) };
    
    if (editingId) {
      if (await updateProductInDB(editingId, productData)) {
        showCustomAlert("Product Updated Successfully!", "🛠️");
        setEditingId(null); 
      }
    } else {
      if (await addProductToDB(productData)) showCustomAlert("New Product Added Successfully!", "🔥");
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

  const triggerCancelOrder = (id) => setConfirmDialog({ show: true, id, actionType: "CANCEL_ORDER", message: "Are you sure you want to CANCEL this order?" });
  const triggerDeleteOrder = (id) => setConfirmDialog({ show: true, id, actionType: "DELETE_ORDER", message: "Delete this order record permanently? This cannot be undone!" });
  const triggerDeleteProduct = (id) => setConfirmDialog({ show: true, id, actionType: "DELETE_PRODUCT", message: "Are you sure you want to delete this Product? 🚀" });

  const executeConfirmAction = async () => {
    const { id, actionType } = confirmDialog;
    setConfirmDialog({ show: false, id: null, actionType: "", message: "" });

    if (actionType === "CANCEL_ORDER") {
      if (await cancelOrderInDB(id)) {
        showCustomAlert("Order Cancelled by Admin!", "🚫");
        fetchOrders(); 
      }
    } else if (actionType === "DELETE_ORDER") {
      if (await deleteOrderFromDB(id)) {
        showCustomAlert("Order Record Deleted!", "🗑️");
        fetchOrders();
      }
    } else if (actionType === "DELETE_PRODUCT") {
      await deleteProductFromDB(id);
      fetchProducts();
      showCustomAlert("Product Deleted Successfully!", "🗑️");
    }
  };

  return (
    <div className="max-w-6xl mx-auto mt-10 p-4 md:p-6 bg-white/10 backdrop-blur-md rounded-2xl shadow-xl text-white relative">
      
      {/* CUSTOM GLASS ALERT */}
      {alertData.show && (
        <div className="fixed top-24 right-5 md:right-10 z-[100] animate-bounce">
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl px-6 py-4 rounded-2xl flex items-center gap-3 text-white">
            <span className="text-2xl">{alertData.icon}</span>
            <p className="font-bold tracking-wide">{alertData.message}</p>
          </div>
        </div>
      )}

      {/* CUSTOM CONFIRMATION POPUP */}
      {confirmDialog.show && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-gray-900/90 border border-white/20 shadow-[0_0_50px_rgba(0,0,0,0.5)] p-8 rounded-3xl max-w-md w-full text-center scale-up">
            <div className="text-5xl mb-4">⚠️</div>
            <h3 className="text-2xl font-black text-white mb-2">Are you sure?</h3>
            <p className="text-gray-400 mb-8 leading-relaxed">{confirmDialog.message}</p>
            <div className="flex gap-4 justify-center">
              <button onClick={() => setConfirmDialog({ show: false, id: null, actionType: "", message: "" })} className="flex-1 bg-white/10 hover:bg-white/20 text-white font-bold py-3 rounded-xl transition">No, Go Back</button>
              <button onClick={executeConfirmAction} className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-3 rounded-xl shadow-lg shadow-red-500/30 transition">Yes, Do it!</button>
            </div>
          </div>
        </div>
      )}

      <h2 className="text-4xl font-black mb-8 text-center text-yellow-400 uppercase tracking-widest">Admin Dashboard 👑</h2>

      {/* TABS BUTTONS */}
      <div className="flex justify-center gap-4 mb-10 border-b border-white/10 pb-4">
        <button onClick={() => setActiveTab("products")} className={`px-8 py-3 rounded-xl font-bold transition-all ${activeTab === "products" ? "bg-yellow-400 text-black scale-105" : "bg-white/10 text-white hover:bg-white/20"}`}>📦 Manage Products</button>
        <button onClick={() => setActiveTab("orders")} className={`px-8 py-3 rounded-xl font-bold transition-all ${activeTab === "orders" ? "bg-yellow-400 text-black scale-105" : "bg-white/10 text-white hover:bg-white/20"}`}>🛒 Manage Orders</button>
      </div>

      {/* TAB 1: PRODUCTS */}
      {activeTab === "products" && (
        <div className="animate-fade-in">
          <form onSubmit={handleSubmit} className={`flex flex-col gap-4 mb-10 p-6 rounded-lg border ${editingId ? 'bg-blue-900/40 border-blue-500' : 'bg-black/40 border-gray-600'}`}>
            <h3 className={`text-xl font-bold ${editingId ? 'text-blue-400' : 'text-green-400'}`}>
              {editingId ? "Update Product 🛠️" : "Add New Product ➕"}
              {editingId && <button type="button" onClick={() => {setEditingId(null); setProduct({ title: "", price: "", category: "", thumbnail: "", description: "" });}} className="ml-4 text-sm text-red-400 underline">Cancel Edit</button>}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input type="text" name="title" value={product.title} onChange={handleChange} required placeholder="Product Title" className="px-4 py-2 rounded-lg bg-black/30 border border-gray-600 focus:border-yellow-400 focus:outline-none" />
              <input type="number" name="price" value={product.price} onChange={handleChange} required placeholder="Price (₹)" className="px-4 py-2 rounded-lg bg-black/30 border border-gray-600 focus:border-yellow-400 focus:outline-none" />
              
              {/* 🔥 POORI 25 CATEGORIES AUTOMATICALLY LOADED HERE */}
              <select name="category" value={product.category} onChange={handleChange} required className="px-4 py-2 rounded-lg bg-black/30 border border-gray-600 focus:border-yellow-400 focus:outline-none text-white">
                <option value="" disabled className="text-gray-800">Select Category 🔽</option>
                {categoriesList.map((cat) => (
                  <option key={cat.id} value={cat.value} className="text-gray-800">
                    {cat.icon} {cat.name}
                  </option>
                ))}
              </select>

              <input type="text" name="thumbnail" value={product.thumbnail} onChange={handleChange} required placeholder="Image URL (Transparent PNG)" className="px-4 py-2 rounded-lg bg-black/30 border border-gray-600 focus:border-yellow-400 focus:outline-none" />
              <textarea name="description" value={product.description} onChange={handleChange} required rows="2" placeholder="Description..." className="px-4 py-2 rounded-lg bg-black/30 border border-gray-600 focus:border-yellow-400 focus:outline-none md:col-span-2"></textarea>
            </div>
            <button type="submit" disabled={loading} className={`mt-4 text-black font-bold py-3 rounded-lg transition ${editingId ? 'bg-blue-400 hover:bg-blue-500' : 'bg-yellow-400 hover:bg-yellow-500'}`}>
              {loading ? "Processing... ⏳" : (editingId ? "Update Product 🚀" : "Add Product 🚀")}
            </button>
          </form>

          {/* PRODUCT LIST UI SAME REHEGA */}
          <div className="bg-black/40 rounded-lg border border-gray-600 overflow-hidden">
            {productsList.map((item) => (
              <div key={item.id} className="p-4 flex justify-between items-center hover:bg-white/5 border-b border-gray-700">
                <div className="flex gap-4 items-center">
                  <img src={item.thumbnail} alt="" className="w-12 h-12 object-contain bg-white/5 rounded" />
                  <div>
                    <h4 className="font-bold">{item.title}</h4>
                    <p className="text-yellow-400">₹{item.price}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleEdit(item)} className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-1.5 rounded font-bold">Edit</button>
                  <button onClick={() => triggerDeleteProduct(item.id)} className="bg-red-500 hover:bg-red-600 text-white px-4 py-1.5 rounded font-bold">Delete</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ORDERS TAB UI SAME REHEGA */}
      {activeTab === "orders" && (
        <div className="space-y-6 animate-fade-in">
          {ordersList.length === 0 ? (
            <p className="text-center text-gray-400 py-10">Koi order nahi aaya abhi tak! 😢</p>
          ) : (
            ordersList.map((order) => (
              <div key={order.id} className="bg-black/40 border border-gray-600 p-6 rounded-xl flex flex-col md:flex-row justify-between gap-6 hover:border-yellow-400/50 transition">
                <div className="flex-1">
                  <p className="text-sm text-gray-400">Order ID: <span className="text-white font-mono">{order.id}</span></p>
                  <p className="text-sm text-gray-400">User ID: <span className="text-blue-400">{order.userId}</span></p>
                  <p className="text-sm text-gray-400">Date: <span className="text-white">{new Date(order.date).toLocaleString('en-IN')}</span></p>
                  <div className="mt-3">
                    <p className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase ${order.status === "Cancelled 🔴" ? "bg-red-500/20 text-red-400" : "bg-green-500/20 text-green-400"}`}>
                      {order.status}
                    </p>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="bg-white/10 px-3 py-1 rounded text-xs">{item.quantity}x {item.title.substring(0, 15)}...</div>
                    ))}
                  </div>
                </div>
                <div className="flex flex-col items-start md:items-end justify-between">
                  <p className="text-2xl font-black text-yellow-400">₹ {formatPrice(order.totalAmount)}</p>
                  <div className="flex gap-2 mt-4">
                    {order.status !== "Cancelled 🔴" && (
                      <button onClick={() => triggerCancelOrder(order.id)} className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg font-bold text-sm transition">Cancel Order</button>
                    )}
                    <button onClick={() => triggerDeleteOrder(order.id)} className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-bold text-sm transition">Delete</button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default Admin;