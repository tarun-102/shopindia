import React, { useRef } from "react";
import { formatPrice } from "../../utils/priceFormatter";
import { calculateOrderTax, numberToWordsINR } from "../../utils/taxUtils";
import { Download, X, Zap, ShieldCheck, CheckCircle2, Truck } from "lucide-react";
import { downloadInvoicePDF } from "../../utils/invoicePdfGenerator";
import { getOrderTrackingNumber, getOrderCarrier } from "../../services/productservices";

const InvoiceModal = ({ show, onClose, order }) => {
  const invoiceRef = useRef(null);

  if (!show || !order) return null;

  const items = order.items || order.cartItems || [];
  const taxSummary = calculateOrderTax(items, order.totalAmount);
  const invoiceDate = new Date(order.date || order.createdAt || Date.now()).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const invoiceNumber = `INV-${new Date().getFullYear()}-${(order.id || "0000").slice(0, 8).toUpperCase()}`;

  const handleDownload = () => {
    downloadInvoicePDF(order);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-2 sm:p-4 overflow-y-auto animate-fade-in">
      <div className="relative w-full max-w-4xl bg-white dark:bg-[#0c1220] rounded-2xl md:rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 my-8 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-slate-50 dark:bg-[#070b14] border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <Zap size={18} />
            </span>
            <span className="font-black text-sm text-slate-900 dark:text-white uppercase tracking-wider">
              Official Tax Invoice
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-md transition-all cursor-pointer active:scale-95"
            >
              <Download size={15} />
              <span>Download PDF 📥</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Printable Invoice Container */}
        <div id="printable-invoice" ref={invoiceRef} className="p-6 sm:p-8 overflow-y-auto bg-white text-slate-900 space-y-6 text-xs">
          
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pb-6 border-b-2 border-slate-200">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-black text-sm">
                  ⚡
                </div>
                <h1 className="text-xl font-black text-slate-900 uppercase tracking-tight">ShopIndia</h1>
              </div>
              <p className="font-bold text-slate-700 mt-1">ShopIndia E-Commerce Retail Pvt. Ltd.</p>
              <p className="text-slate-500 text-[11px] leading-relaxed">
                Fulfillment Center, Khodiyar Nagar Road, Ahmedabad, Gujarat - 382350<br />
                <span className="font-bold text-slate-800">GSTIN:</span> 24AAACS1429B1Z8 | <span className="font-bold text-slate-800">State:</span> 24 - Gujarat<br />
                <span className="font-bold text-slate-800">CIN:</span> U52100GJ2026PTC109876 | <span className="font-bold text-slate-800">Care:</span> support@shopindia.in
              </p>
            </div>

            <div className="sm:text-right space-y-1">
              <span className="inline-block px-3 py-1 bg-indigo-50 border border-indigo-200 text-indigo-700 font-black rounded-lg text-xs uppercase tracking-wider">
                Tax Invoice / Bill of Supply
              </span>
              <p className="font-bold text-slate-800 text-xs">
                Invoice No: <span className="font-mono text-slate-900">{invoiceNumber}</span>
              </p>
              <p className="text-slate-500 text-[11px]">Invoice Date: {invoiceDate}</p>
              <p className="text-slate-500 text-[11px]">Order ID: <span className="font-mono font-bold">{order.id}</span></p>
              <p className="text-indigo-600 font-bold text-[11px] font-mono">AWB: {getOrderTrackingNumber(order)}</p>
              <p className="text-slate-500 text-[10px]">Carrier: {getOrderCarrier(order)}</p>
              <p className="text-slate-500 text-[11px]">Place of Supply: Gujarat (24)</p>
            </div>
          </div>

          {/* Customer & Order Metadata */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Billed & Shipped To:</p>
              <p className="font-black text-slate-900 text-sm mt-0.5">{order.shipping?.name || order.userEmail || "Valued Customer"}</p>
              <p className="text-slate-600 text-[11px] mt-0.5">{order.shipping?.address || "Address on File"}</p>
              <p className="text-slate-600 text-[11px]">PIN: <span className="font-bold text-slate-800">{order.shipping?.pincode || "380001"}</span></p>
              {order.userEmail && <p className="text-slate-500 text-[10px] mt-0.5">Email: {order.userEmail}</p>}
            </div>

            <div className="sm:text-right space-y-1">
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Payment & Delivery Status:</p>
              <p className="font-bold text-slate-800 text-xs">
                Mode: <span className="uppercase text-indigo-700 font-black">{order.paymentMethod === 'split' ? 'Multi Split' : order.paymentMethod}</span>
              </p>
              <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase">
                <CheckCircle2 size={11} />
                <span>{order.paymentMethod === 'cod' ? 'Payment on Delivery' : 'Paid / Verified'}</span>
              </div>
              <p className="text-slate-500 text-[11px]">
                Order Status: <span className="font-bold text-slate-800">{order.status || "Confirmed"}</span>
              </p>
            </div>
          </div>

          {/* Itemized GST Breakdown Table */}
          <div className="overflow-x-auto border border-slate-200 rounded-xl shadow-xs">
            <table className="w-full min-w-[640px] text-left border-collapse">
              <thead>
                <tr className="bg-slate-100 text-[10px] font-black uppercase tracking-wider text-slate-600 border-b border-slate-200">
                  <th className="p-2.5 text-center w-8">#</th>
                  <th className="p-2.5">Item Description</th>
                  <th className="p-2.5 text-center">HSN</th>
                  <th className="p-2.5 text-center">Qty</th>
                  <th className="p-2.5 text-right">Taxable (₹)</th>
                  <th className="p-2.5 text-center">GST %</th>
                  <th className="p-2.5 text-right">CGST (₹)</th>
                  <th className="p-2.5 text-right">SGST (₹)</th>
                  <th className="p-2.5 text-right">Total (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {taxSummary.itemBreakdown.map((item, idx) => {
                  const tax = item.taxDetails;
                  return (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="p-2.5 text-center font-bold text-slate-400">{idx + 1}</td>
                      <td className="p-2.5">
                        <p className="font-bold text-slate-900">{item.title}</p>
                        <p className="text-[10px] text-slate-400">Unit Price: ₹{formatPrice(item.price)}</p>
                      </td>
                      <td className="p-2.5 text-center font-mono text-[11px] text-slate-500">
                        {item.hsn || "8517"}
                      </td>
                      <td className="p-2.5 text-center font-bold text-slate-900">{item.quantity}</td>
                      <td className="p-2.5 text-right font-mono">₹{formatPrice(tax.taxableAmount)}</td>
                      <td className="p-2.5 text-center font-bold text-indigo-700">
                        {tax.gstRate}%
                      </td>
                      <td className="p-2.5 text-right font-mono text-slate-600">
                        ₹{formatPrice(tax.cgstAmount)}
                        <span className="block text-[9px] text-slate-400">({tax.cgstRate}%)</span>
                      </td>
                      <td className="p-2.5 text-right font-mono text-slate-600">
                        ₹{formatPrice(tax.sgstAmount)}
                        <span className="block text-[9px] text-slate-400">({tax.sgstRate}%)</span>
                      </td>
                      <td className="p-2.5 text-right font-black text-slate-900 font-mono">
                        ₹{formatPrice(tax.lineTotal)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Total & Summary Calculations */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 pt-2">
            
            {/* Left Note & Words */}
            <div className="sm:col-span-7 space-y-3">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <p className="text-[10px] font-black uppercase text-slate-400">Total Amount In Words:</p>
                <p className="font-bold text-slate-900 text-xs mt-0.5">{numberToWordsINR(taxSummary.grandTotal)}</p>
              </div>

              <div className="p-3 bg-indigo-50/50 border border-indigo-100 rounded-xl space-y-1 text-[10px] text-slate-600">
                <p className="font-bold text-indigo-900">Tax Compliance & Return Terms:</p>
                <p>• Reverse Charge: No. The tax is payable under Forward Charge.</p>
                <p>• 7-Day Return/Replacement applies exclusively to marked eligible items.</p>
                <p>• Instant wallet refund available upon approved returns.</p>
              </div>
            </div>

            {/* Right Summary Table */}
            <div className="sm:col-span-5 p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Total Taxable Value:</span>
                <span className="font-mono font-bold text-slate-900">₹{formatPrice(taxSummary.taxableAmount)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Central GST (CGST):</span>
                <span className="font-mono font-bold text-slate-900">₹{formatPrice(taxSummary.cgstAmount)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>State GST (SGST):</span>
                <span className="font-mono font-bold text-slate-900">₹{formatPrice(taxSummary.sgstAmount)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Total GST (CGST + SGST):</span>
                <span className="font-mono font-bold text-indigo-700">₹{formatPrice(taxSummary.totalGst)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Shipping & Delivery:</span>
                <span className="font-bold text-emerald-600 uppercase text-[10px]">FREE</span>
              </div>
              <div className="pt-2 border-t border-slate-300 flex justify-between items-baseline font-black text-sm">
                <span className="text-slate-900 uppercase">Grand Total:</span>
                <span className="text-base text-indigo-600 font-mono">₹{formatPrice(taxSummary.grandTotal)}</span>
              </div>
            </div>

          </div>

          {/* Footer & Signature */}
          <div className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4 text-center sm:text-left">
            <div className="flex items-center gap-2 text-slate-400 text-[10px]">
              <div className="p-1 rounded bg-slate-100 border border-slate-200">
                <ShieldCheck size={18} className="text-emerald-500" />
              </div>
              <span>Digitally verified invoice generated by ShopIndia Automated GST System.</span>
            </div>

            <div className="text-center sm:text-right space-y-1">
              <p className="font-bold text-slate-800 text-[11px]">For ShopIndia E-Commerce Retail Pvt. Ltd.</p>
              <div className="inline-block px-3 py-1 border border-dashed border-slate-300 rounded font-serif italic text-slate-600 text-xs">
                Authorized Signatory
              </div>
            </div>
          </div>

        </div>

        {/* Modal Bottom Action Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-6 py-4 bg-slate-50 dark:bg-[#070b14] border-t border-slate-200 dark:border-slate-800">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Downloaded PDF contains GSTIN 24AAACS1429B1Z8, item HSN breakdown & digital authorization.
          </p>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={onClose}
              className="flex-1 sm:flex-initial px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Close
            </button>
            <button
              onClick={handleDownload}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl font-bold text-xs shadow-md shadow-emerald-500/20 transition-all cursor-pointer active:scale-95"
            >
              <Download size={15} />
              <span>Download Invoice (.pdf) 📥</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default InvoiceModal;

