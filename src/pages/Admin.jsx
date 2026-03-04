import GlassCard from "../components/ui/GlassCard";
import { formatPrice } from "../utils/priceFormatter";

const Admin = () => {
  
  const recentOrders = [
    { id: "ORD-9821", customer: "Rahul Sharma", date: "28 Feb 2026", amount: 4500, status: "Delivered" },
    { id: "ORD-9822", customer: "Priya Patel", date: "27 Feb 2026", amount: 1250, status: "Processing" },
    { id: "ORD-9823", customer: "Amit Singh", date: "26 Feb 2026", amount: 8900, status: "Shipped" },
    { id: "ORD-9824", customer: "Neha Gupta", date: "25 Feb 2026", amount: 3200, status: "Delivered" },
    { id: "ORD-9825", customer: "Vikram Verma", date: "24 Feb 2026", amount: 750, status: "Cancelled" },
  ];

  // Status ke hisaab se color change karne ka logic
  const getStatusColor = (status) => {
    switch (status) {
      case "Delivered": return "bg-green-500/20 text-green-400 border-green-500/30";
      case "Processing": return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "Shipped": return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      case "Cancelled": return "bg-red-500/20 text-red-400 border-red-500/30";
      default: return "bg-white/10 text-white border-white/20";
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-10">
      
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">
            Admin Dashboard 🛠️
          </h1>
          <p className="text-white/50 mt-1">ShopIndia ke saare operations yahan manage karein.</p>
        </div>
        <button className="bg-white/10 border border-white/20 text-white px-6 py-2 rounded-xl hover:bg-red-500 hover:text-white hover:border-red-500 transition-all font-bold">
          Logout
        </button>
      </div>

      {/* Stats Cards Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <GlassCard className="p-6 border-l-4 border-l-yellow-400">
          <p className="text-white/60 text-sm font-bold uppercase tracking-wider mb-2">Total Revenue</p>
          <h2 className="text-4xl font-black text-white">₹ {formatPrice(125400)}</h2>
          <p className="text-green-400 text-sm font-bold mt-2">↑ 12% from last month</p>
        </GlassCard>

        <GlassCard className="p-6 border-l-4 border-l-blue-400">
          <p className="text-white/60 text-sm font-bold uppercase tracking-wider mb-2">Total Orders</p>
          <h2 className="text-4xl font-black text-white">342</h2>
          <p className="text-green-400 text-sm font-bold mt-2">↑ 5 new today</p>
        </GlassCard>

        <GlassCard className="p-6 border-l-4 border-l-purple-400">
          <p className="text-white/60 text-sm font-bold uppercase tracking-wider mb-2">Active Users</p>
          <h2 className="text-4xl font-black text-white">1,204</h2>
          <p className="text-white/40 text-sm font-bold mt-2">Currently online: 45</p>
        </GlassCard>
      </div>

      {/* Recent Orders Table */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-white">Recent Orders 📦</h2>
        
        <GlassCard className="overflow-x-auto border-white/10 p-0">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/5 border-b border-white/10 text-white/60 text-sm uppercase tracking-wider">
                <th className="p-4 font-bold">Order ID</th>
                <th className="p-4 font-bold">Customer</th>
                <th className="p-4 font-bold">Date</th>
                <th className="p-4 font-bold">Total Amount</th>
                <th className="p-4 font-bold">Status</th>
                <th className="p-4 font-bold text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {recentOrders.map((order, index) => (
                <tr key={index} className="hover:bg-white/5 transition-colors">
                  <td className="p-4 text-white font-bold">{order.id}</td>
                  <td className="p-4 text-white/90">{order.customer}</td>
                  <td className="p-4 text-white/60 text-sm">{order.date}</td>
                  <td className="p-4 text-yellow-400 font-bold">₹ {formatPrice(order.amount)}</td>
                  <td className="p-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    <button className="text-white/50 hover:text-yellow-400 transition-colors font-bold text-sm underline underline-offset-4">
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </GlassCard>
      </div>

    </div>
  );
};

export default Admin;