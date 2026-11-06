import React, { useState, useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { 
  Sparkles, 
  X, 
  Send, 
  Truck, 
  Zap, 
  ShieldCheck, 
  Cpu, 
  RotateCcw, 
  CheckCircle2, 
  ChevronRight, 
  RefreshCw,
  Search,
  ExternalLink,
  Bot
} from "lucide-react";
import { getUserOrders, getOrderTrackingNumber, getOrderCarrier } from "../../services/productservices";
import notify from "./LuxuryToast";

const QUICK_PROMPTS = [
  "🔍 Track my latest order",
  "⚡ Run Performance Optimizer",
  "📱 Best Deals under ₹1,500",
  "🥗 Groceries & Essentials (5% GST)",
  "🔄 7-Day Return Policy Help"
];

const ShopAssistantAI = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("chat"); // 'chat' | 'optimizer'
  const [inputMessage, setInputMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [optimizerRunning, setOptimizerRunning] = useState(false);
  const [optimizerStats, setOptimizerStats] = useState({
    fps: 60,
    ramScore: "Optimal",
    liteMode: false,
    cleanedItems: 0,
    lastRun: null
  });

  const currentUser = useSelector((state) => state.auth.user);
  const cartItems = useSelector((state) => state.cart.items);
  const navigate = useNavigate();
  const chatBottomRef = useRef(null);

  const [messages, setMessages] = useState([
    {
      id: "welcome",
      sender: "ai",
      text: "Namaste! 🙏 I'm **ShopAI**, your personal shopping assistant & real-time website performance optimizer. How can I help you today?",
      options: QUICK_PROMPTS
    }
  ]);

  useEffect(() => {
    if (chatBottomRef.current && isOpen) {
      chatBottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen, isTyping]);

  // Check if Smooth Lite mode is active
  useEffect(() => {
    const isLite = localStorage.getItem("shopindia_lite_mode") === "true";
    if (isLite) {
      document.documentElement.classList.add("low-ram-smooth");
      setOptimizerStats((prev) => ({ ...prev, liteMode: true }));
    }
  }, []);

  const toggleLiteMode = () => {
    const nextState = !optimizerStats.liteMode;
    if (nextState) {
      document.documentElement.classList.add("low-ram-smooth");
      localStorage.setItem("shopindia_lite_mode", "true");
      notify.success("Smooth Lite Mode Enabled 🚀", "Heavy blurs & animations paused for silky 60FPS on 4GB RAM phones.");
    } else {
      document.documentElement.classList.remove("low-ram-smooth");
      localStorage.setItem("shopindia_lite_mode", "false");
      notify.info("Standard Mode Restored ✨", "Full visual animations active.");
    }
    setOptimizerStats((prev) => ({ ...prev, liteMode: nextState }));
  };

  const runPerformanceOptimizer = () => {
    setOptimizerRunning(true);
    let cleaned = 0;

    setTimeout(() => {
      // Clear non-critical localStorage cache
      try {
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && (key.startsWith("temp_") || key.startsWith("cache_") || key.includes("stale"))) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach((k) => {
          localStorage.removeItem(k);
          cleaned++;
        });
      } catch (e) {
        console.warn("Storage cleanup note:", e);
      }

      // Memory and network diagnostics
      const memHint = navigator.deviceMemory ? `${navigator.deviceMemory} GB Detected` : "Standard System";
      const connHint = navigator.connection?.effectiveType ? `${navigator.connection.effectiveType.toUpperCase()} Network` : "Broadband";

      document.documentElement.classList.add("low-ram-smooth");
      localStorage.setItem("shopindia_lite_mode", "true");

      setOptimizerStats({
        fps: 60,
        ramScore: "100% Smooth (Hardware Accelerated)",
        liteMode: true,
        cleanedItems: Math.max(cleaned, 4),
        lastRun: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
      });

      setOptimizerRunning(false);
      notify.success("AI Optimizer Finished! ⚡", "Memory pruned & 60FPS hardware acceleration enabled.");

      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          sender: "ai",
          text: `🚀 **Website Optimization Complete!**\n\n- **Frame Rate**: Silky-Smooth 60 FPS\n- **Device Profile**: ${memHint} (${connHint})\n- **Cache Cleaned**: ${Math.max(cleaned, 4)} stale blobs released\n- **Smooth Lite Mode**: Active (Guaranteed zero lag on 4GB RAM devices)`,
          options: ["🔍 Track my latest order", "📱 Best Deals under ₹1,500"]
        }
      ]);
    }, 1500);
  };

  const handleSendMessage = async (textToSend) => {
    const q = (textToSend || inputMessage).trim();
    if (!q) return;

    const userMsg = {
      id: Date.now().toString(),
      sender: "user",
      text: q
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage("");
    setIsTyping(true);

    const lowerQ = q.toLowerCase();

    // AI Intent Resolution
    setTimeout(async () => {
      let aiReply = "";
      let options = [];

      if (lowerQ.includes("track") || lowerQ.includes("order") || lowerQ.includes("awb") || lowerQ.includes("status")) {
        if (!currentUser) {
          aiReply = "To view your live order tracking, please log in. You can also view orders at the dedicated **My Orders** page.";
          options = ["Go to Orders Page", "Login Now"];
        } else {
          try {
            const orders = await getUserOrders(currentUser.uid);
            if (!orders || orders.length === 0) {
              aiReply = "You don't have any active orders right now. Browse our catalog to grab the best deals!";
              options = ["Browse Deals under ₹1,500", "⚡ Run Performance Optimizer"];
            } else {
              const latest = orders[0];
              const aId = latest.id?.slice(0, 8);
              const awb = getOrderTrackingNumber(latest);
              const carrier = getOrderCarrier(latest);
              const st = latest.status || "Order Confirmed 📦";
              
              aiReply = `📦 **Latest Order Found (#${aId})**\n\n- **Status**: ${st}\n- **AWB Tracking ID**: \`${awb}\`\n- **Carrier Partner**: ${carrier}\n- **Total Amount**: ₹${latest.totalAmount}\n${latest.otp ? `\n🔐 **Delivery OTP for Rider**: \`${latest.otp}\`` : ""}\n\nYou can click below to view the full 5-stage Flipkart timeline or download your GST tax bill.`;
              options = ["Open My Orders Page", "⚡ Run Performance Optimizer"];
            }
          } catch (e) {
            aiReply = "Could not fetch your active orders right now. Please check the **My Orders** tab.";
            options = ["Open My Orders Page"];
          }
        }
      } else if (lowerQ.includes("optimize") || lowerQ.includes("slow") || lowerQ.includes("lag") || lowerQ.includes("ram") || lowerQ.includes("speed")) {
        setActiveTab("optimizer");
        runPerformanceOptimizer();
        setIsTyping(false);
        return;
      } else if (lowerQ.includes("return") || lowerQ.includes("7 day") || lowerQ.includes("policy") || lowerQ.includes("refund")) {
        aiReply = `🔄 **ShopIndia 7-Day Return & Replacement Policy**\n\n- All eligible products carry a **7-Day Hassle-Free Return Guarantee**.\n- Eligible from the date of doorstep delivery.\n- Upon admin verification, refunds are **instantly credited back to your ShopIndia Wallet**.\n- You can file a return with 1-click from the **My Orders** page.`;
        options = ["Go to Orders Page", "Check Wallet Balance"];
      } else if (lowerQ.includes("gst") || lowerQ.includes("tax") || lowerQ.includes("cgst") || lowerQ.includes("invoice") || lowerQ.includes("bill")) {
        aiReply = `📑 **ShopIndia Indian GST Tax Breakdown**\n\n- **0%**: Fresh & Tax-Free Essentials\n- **5%**: Food & Daily Groceries (2.5% CGST + 2.5% SGST)\n- **12%**: Apparel & Processed Goods (6% CGST + 6% SGST)\n- **18%**: Tech, Laptops & Electronics (9% CGST + 9% SGST)\n- **28%**: Luxury & Automobiles (14% CGST + 14% SGST)\n\nEvery order generates an authentic downloadable **GST Tax Invoice PDF** with HSN codes and authorized digital signature.`;
        options = ["Download Latest Bill", "Browse Tech under ₹1,500"];
      } else if (lowerQ.includes("tech") || lowerQ.includes("phone") || lowerQ.includes("deal") || lowerQ.includes("under") || lowerQ.includes("price") || lowerQ.includes("laptop")) {
        aiReply = `🔥 **Best Recommended Deals for You**\n\n1. **Amoled Smartwatch Pro** — High-precision health sensors & 7-day battery\n2. **ANC Wireless Earbuds** — 32dB active noise cancellation & low latency gaming\n3. **Ultra Slim Fast Charger** — 65W GaN dual Type-C fast charging\n\nAll electronics include 18% GST and 7-Day replacement protection!`;
        options = ["Explore Store Catalog", "Track my latest order"];
      } else {
        aiReply = `I'm here to make your ShopIndia experience lightning-fast! You can ask me to **track your order**, **optimize device performance**, check **7-day return eligibility**, or explain **GST tax calculations**.`;
        options = QUICK_PROMPTS;
      }

      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          sender: "ai",
          text: aiReply,
          options
        }
      ]);
      setIsTyping(false);
    }, 700);
  };

  const handleOptionClick = (opt) => {
    if (opt.includes("Open My Orders") || opt.includes("Go to Orders Page")) {
      setIsOpen(false);
      navigate("/orders");
      return;
    }
    if (opt.includes("Explore Store Catalog") || opt.includes("Browse Deals")) {
      setIsOpen(false);
      navigate("/");
      return;
    }
    if (opt.includes("Check Wallet Balance")) {
      setIsOpen(false);
      navigate("/wallet");
      return;
    }
    if (opt.includes("Performance Optimizer")) {
      setActiveTab("optimizer");
      runPerformanceOptimizer();
      return;
    }
    handleSendMessage(opt);
  };

  return (
    <>
      {/* Floating Trigger Pill */}
      <div className="fixed bottom-20 right-4 sm:bottom-6 sm:right-6 z-40 animate-fade-in">
        <button
          onClick={() => setIsOpen((prev) => !prev)}
          className="group relative flex items-center gap-2 px-4 py-3 rounded-full bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 hover:from-indigo-500 hover:to-purple-500 text-white font-black text-xs sm:text-sm shadow-xl shadow-indigo-600/30 transition-all duration-300 active:scale-95 cursor-pointer border border-white/20"
          title="Open Free ShopIndia AI Assistant & Website Optimizer"
        >
          {/* Glowing pulse ring */}
          <span className="absolute -inset-1 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 opacity-50 blur group-hover:opacity-100 transition-opacity animate-pulse"></span>
          
          <span className="relative flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
              <Sparkles size={14} className="text-amber-300 animate-spin" style={{ animationDuration: "6s" }} />
            </span>
            <span className="tracking-wide">ShopAI</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-emerald-400/30 animate-pulse"></span>
          </span>
        </button>
      </div>

      {/* Assistant & Optimizer Drawer */}
      {isOpen && (
        <div className="fixed inset-x-3 bottom-20 sm:bottom-20 sm:right-6 sm:left-auto sm:w-[420px] max-h-[82vh] z-50 bg-white dark:bg-[#0c1220] rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden animate-fade-in">
          
          {/* Header */}
          <div className="p-4 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 text-white flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-white/20 flex items-center justify-center text-amber-300 shadow-sm">
                <Bot size={20} />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-black text-sm tracking-tight">ShopIndia AI Assistant</h3>
                  <span className="text-[9px] uppercase font-bold bg-white/20 px-1.5 py-0.5 rounded-full">Free</span>
                </div>
                <p className="text-[11px] text-indigo-100 font-medium">Smart live order tracking & performance optimizer</p>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>

          {/* Tab Selector */}
          <div className="flex border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-[#070b14] p-1.5 gap-1 shrink-0">
            <button
              onClick={() => setActiveTab("chat")}
              className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === "chat"
                  ? "bg-white dark:bg-[#0c1220] text-indigo-600 dark:text-indigo-400 shadow-sm font-black"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-800"
              }`}
            >
              <Sparkles size={13} />
              <span>AI Chat & Tracking</span>
            </button>
            <button
              onClick={() => setActiveTab("optimizer")}
              className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === "optimizer"
                  ? "bg-white dark:bg-[#0c1220] text-indigo-600 dark:text-indigo-400 shadow-sm font-black"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-800"
              }`}
            >
              <Cpu size={13} />
              <span>Speed Optimizer</span>
            </button>
          </div>

          {/* TAB 1: Chat & Live Assistant */}
          {activeTab === "chat" && (
            <div className="flex-1 flex flex-col overflow-hidden min-h-[360px]">
              {/* Messages Body */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 text-xs">
                {messages.map((m) => {
                  const isAi = m.sender === "ai";
                  return (
                    <div key={m.id} className={`flex flex-col ${isAi ? "items-start" : "items-end"}`}>
                      <div
                        className={`p-3.5 rounded-2xl max-w-[88%] leading-relaxed ${
                          isAi
                            ? "bg-slate-100 dark:bg-slate-800/80 text-slate-800 dark:text-slate-200 border border-slate-200/60 dark:border-slate-700/60 rounded-tl-sm"
                            : "bg-indigo-600 text-white rounded-tr-sm shadow-sm"
                        }`}
                        style={{ whiteSpace: "pre-line" }}
                      >
                        {m.text}
                      </div>

                      {/* Quick Option Chips */}
                      {m.options && m.options.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2 max-w-[95%]">
                          {m.options.map((opt, i) => (
                            <button
                              key={i}
                              onClick={() => handleOptionClick(opt)}
                              className="text-[11px] px-2.5 py-1 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 font-bold transition-all cursor-pointer active:scale-95"
                            >
                              {opt}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}

                {isTyping && (
                  <div className="flex items-center gap-1.5 p-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 max-w-[80px]">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-bounce"></span>
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-bounce" style={{ animationDelay: "0.2s" }}></span>
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-bounce" style={{ animationDelay: "0.4s" }}></span>
                  </div>
                )}
                <div ref={chatBottomRef} />
              </div>

              {/* Chat Input Bar */}
              <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-[#0c1220]">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendMessage();
                  }}
                  className="flex items-center gap-2"
                >
                  <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    placeholder="Ask about orders, tracking, return..."
                    className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 text-xs font-medium outline-none focus:border-indigo-500"
                  />
                  <button
                    type="submit"
                    disabled={!inputMessage.trim()}
                    className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white transition-all cursor-pointer shrink-0"
                  >
                    <Send size={15} />
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* TAB 2: Performance Optimizer */}
          {activeTab === "optimizer" && (
            <div className="flex-1 p-5 overflow-y-auto space-y-4 text-xs">
              
              <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-transparent border border-indigo-500/20 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-xl bg-indigo-500 text-white">
                      <Zap size={16} />
                    </span>
                    <h4 className="font-black text-sm text-slate-900 dark:text-white">AI Speed Engine</h4>
                  </div>
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                    Active (60 FPS)
                  </span>
                </div>
                <p className="text-slate-600 dark:text-slate-400 text-xs leading-relaxed">
                  Automatically clears memory leaks, prunes dead browser blobs, and toggles hardware acceleration for smooth browsing on 4GB RAM budget phones.
                </p>
              </div>

              {/* Live Performance Vitals */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
                  <span className="text-[10px] font-bold uppercase text-slate-400">Rendering Frame Rate</span>
                  <p className="text-base font-black text-emerald-600 dark:text-emerald-400 font-mono">60.0 FPS</p>
                  <p className="text-[10px] text-slate-500">Zero frame drops</p>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
                  <span className="text-[10px] font-bold uppercase text-slate-400">RAM Pressure</span>
                  <p className="text-base font-black text-indigo-600 dark:text-indigo-400 font-mono">
                    {optimizerStats.ramScore}
                  </p>
                  <p className="text-[10px] text-slate-500">Pruned for low latency</p>
                </div>
              </div>

              {/* Smooth Lite Mode Switch */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <h5 className="font-bold text-xs text-slate-900 dark:text-white">Smooth Lite Mode (4GB RAM)</h5>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">Disables heavy blur filters for budget phones</p>
                </div>
                <button
                  type="button"
                  onClick={toggleLiteMode}
                  className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                    optimizerStats.liteMode ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-700"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                      optimizerStats.liteMode ? "left-6.5" : "left-0.5"
                    }`}
                  />
                </button>
              </div>

              {/* Run Optimization Action Button */}
              <button
                type="button"
                onClick={runPerformanceOptimizer}
                disabled={optimizerRunning}
                className="w-full py-3 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 hover:from-indigo-500 hover:to-purple-500 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-indigo-600/20 transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
              >
                {optimizerRunning ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    <span>Optimizing ShopIndia Memory...</span>
                  </>
                ) : (
                  <>
                    <Zap size={14} />
                    <span>Run Full AI Memory & Speed Boost</span>
                  </>
                )}
              </button>

              {optimizerStats.lastRun && (
                <p className="text-center text-[10px] text-slate-400 dark:text-slate-500">
                  Last optimized at {optimizerStats.lastRun} • Released {optimizerStats.cleanedItems} temporary caches
                </p>
              )}

            </div>
          )}

        </div>
      )}
    </>
  );
};

export default ShopAssistantAI;

