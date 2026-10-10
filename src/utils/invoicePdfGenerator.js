import { jsPDF } from "jspdf";
import { calculateOrderTax, numberToWordsINR } from "./taxUtils";
import { formatPrice } from "./priceFormatter";

/**
 * Generates and triggers instant browser download of official Indian GST Tax Invoice as a PDF file.
 * Direct vector PDF generation — guarantees 0 blank pages and no dependence on window.print().
 */
export const downloadInvoicePDF = (order) => {
  if (!order) return;

  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const items = order.items || order.cartItems || [];
  const taxSummary = calculateOrderTax(items, order.totalAmount);
  const invoiceDate = new Date(order.date || order.createdAt || Date.now()).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const invoiceNumber = `INV-${new Date().getFullYear()}-${(order.id || "0000").slice(0, 8).toUpperCase()}`;

  // Page geometry
  const leftMargin = 14;
  const rightMargin = 196;
  const pageWidth = 210;
  let y = 14;

  // 1. Header Bar: Brand Logo & Title
  doc.setFillColor(79, 70, 229); // Brand Indigo #4f46e5
  doc.roundedRect(leftMargin, y, 10, 10, 2, 2, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("S", leftMargin + 3.2, y + 7.2);

  doc.setTextColor(17, 24, 39); // Slate-900
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("ShopIndia", leftMargin + 13, y + 6);

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 116, 139);
  doc.text("India's Premier E-Commerce Retail Pvt. Ltd.", leftMargin + 13, y + 10);

  // Top Right: Tax Invoice Badge
  doc.setFillColor(238, 242, 255);
  doc.roundedRect(130, y, 66, 7, 1.5, 1.5, "F");
  doc.setTextColor(79, 70, 229);
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text("TAX INVOICE / BILL OF SUPPLY", 133, y + 4.8);

  y += 16;

  // Company Details (Left) vs Invoice Details (Right)
  doc.setFontSize(7.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(71, 85, 105);
  doc.text("Fulfillment Center, Khodiyar Nagar Road, Ahmedabad, GJ - 382350", leftMargin, y);
  doc.text("GSTIN: 24AAACS1429B1Z8 | State: 24-Gujarat | CIN: U52100GJ2026PTC109876", leftMargin, y + 3.5);
  doc.text("Customer Support: support@shopindia.in | Helpline: 1800-SHOP-INDIA", leftMargin, y + 7);

  doc.setFont("helvetica", "bold");
  doc.setTextColor(17, 24, 39);
  doc.text(`Invoice No: ${invoiceNumber}`, 130, y);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(71, 85, 105);
  doc.text(`Invoice Date: ${invoiceDate}`, 130, y + 3.5);
  doc.text(`Order ID: #${order.id}`, 130, y + 7);
  doc.text(`Place of Supply: 24-Gujarat`, 130, y + 10.5);

  y += 14;

  // Divider Line
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.4);
  doc.line(leftMargin, y, rightMargin, y);
  y += 4;

  // 2. Billing & Shipping Info Box
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(leftMargin, y, rightMargin - leftMargin, 20, 2, 2, "F");
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(leftMargin, y, rightMargin - leftMargin, 20, 2, 2, "D");

  doc.setFontSize(7.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(100, 116, 139);
  doc.text("BILLED & SHIPPED TO:", leftMargin + 4, y + 4.5);
  doc.text("PAYMENT & ORDER STATUS:", 120, y + 4.5);

  doc.setFontSize(8.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(17, 24, 39);
  const customerName = order.shipping?.name || order.userEmail?.split("@")[0] || "Valued Customer";
  doc.text(customerName.slice(0, 35), leftMargin + 4, y + 9);

  doc.setFontSize(7.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(71, 85, 105);
  const addressLine = (order.shipping?.address || "Address on File").slice(0, 48);
  doc.text(addressLine, leftMargin + 4, y + 13);
  doc.text(`PIN: ${order.shipping?.pincode || "380001"} | Phone: ${order.shipping?.phone || "On record"}`, leftMargin + 4, y + 17);

  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(17, 24, 39);
  doc.text(`Mode: ${(order.paymentMethod || "Prepaid").toUpperCase()}`, 120, y + 9);
  doc.setFontSize(7.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(16, 185, 129); // Green
  doc.text(`Payment: ${order.paymentMethod === 'cod' ? 'Payment on Delivery' : 'Paid & Verified ✓'}`, 120, y + 13);
  doc.setTextColor(71, 85, 105);
  doc.text(`Status: ${order.status || "Confirmed"}`, 120, y + 17);

  y += 24;

  // 3. Itemized Tax Invoice Table
  doc.setFillColor(241, 245, 249);
  doc.rect(leftMargin, y, rightMargin - leftMargin, 7, "F");
  doc.setDrawColor(203, 213, 225);
  doc.rect(leftMargin, y, rightMargin - leftMargin, 7, "D");

  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(51, 65, 85);

  doc.text("#", leftMargin + 2, y + 4.5);
  doc.text("ITEM DESCRIPTION", leftMargin + 8, y + 4.5);
  doc.text("HSN", leftMargin + 72, y + 4.5);
  doc.text("QTY", leftMargin + 92, y + 4.5);
  doc.text("RATE (Rs.)", leftMargin + 104, y + 4.5);
  doc.text("TAXABLE (Rs.)", leftMargin + 122, y + 4.5);
  doc.text("CGST (Rs.)", leftMargin + 146, y + 4.5);
  doc.text("SGST (Rs.)", leftMargin + 164, y + 4.5);
  doc.text("TOTAL (Rs.)", leftMargin + 182, y + 4.5);

  y += 7;

  // Table Rows
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);

  items.forEach((item, index) => {
    // Page overflow safety
    if (y > 240) {
      doc.addPage();
      y = 15;
      doc.setFillColor(241, 245, 249);
      doc.rect(leftMargin, y, rightMargin - leftMargin, 7, "F");
      doc.setDrawColor(203, 213, 225);
      doc.rect(leftMargin, y, rightMargin - leftMargin, 7, "D");
      doc.setFontSize(7);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(51, 65, 85);
      doc.text("#", leftMargin + 2, y + 4.5);
      doc.text("ITEM DESCRIPTION", leftMargin + 8, y + 4.5);
      doc.text("HSN", leftMargin + 72, y + 4.5);
      doc.text("QTY", leftMargin + 92, y + 4.5);
      doc.text("RATE (Rs.)", leftMargin + 104, y + 4.5);
      doc.text("TAXABLE (Rs.)", leftMargin + 122, y + 4.5);
      doc.text("CGST (Rs.)", leftMargin + 146, y + 4.5);
      doc.text("SGST (Rs.)", leftMargin + 164, y + 4.5);
      doc.text("TOTAL (Rs.)", leftMargin + 182, y + 4.5);
      y += 7;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
    }

    const isEven = index % 2 === 0;
    if (isEven) {
      doc.setFillColor(255, 255, 255);
    } else {
      doc.setFillColor(248, 250, 252);
    }
    doc.rect(leftMargin, y, rightMargin - leftMargin, 7, "F");
    doc.setDrawColor(226, 232, 240);
    doc.rect(leftMargin, y, rightMargin - leftMargin, 7, "D");

    const rate = Number(item.gstRate !== undefined ? item.gstRate : 18);
    const lineTotal = Number(item.totalPrice || (item.price * (item.quantity || 1)));
    const taxable = Math.round((lineTotal / (1 + rate / 100)) * 100) / 100;
    const totalGst = Math.round((lineTotal - taxable) * 100) / 100;
    const halfGst = Math.round((totalGst / 2) * 100) / 100;

    doc.setTextColor(71, 85, 105);
    doc.text(String(index + 1), leftMargin + 2, y + 4.5);

    doc.setFont("helvetica", "bold");
    doc.setTextColor(17, 24, 39);
    const itemTitle = (item.title || item.name || "Product").slice(0, 32);
    doc.text(itemTitle, leftMargin + 8, y + 4.5);

    doc.setFont("helvetica", "normal");
    doc.setTextColor(71, 85, 105);
    doc.text(String(item.hsnCode || item.hsn || "8517"), leftMargin + 72, y + 4.5);
    doc.text(String(item.quantity || 1), leftMargin + 94, y + 4.5);
    doc.text(formatPrice(item.price || lineTotal), leftMargin + 104, y + 4.5);
    doc.text(formatPrice(taxable), leftMargin + 124, y + 4.5);
    doc.text(`${formatPrice(halfGst)} (${rate/2}%)`, leftMargin + 144, y + 4.5);
    doc.text(`${formatPrice(halfGst)} (${rate/2}%)`, leftMargin + 162, y + 4.5);

    doc.setFont("helvetica", "bold");
    doc.setTextColor(17, 24, 39);
    doc.text(formatPrice(lineTotal), leftMargin + 182, y + 4.5);

    y += 7;
  });

  y += 2;

  // Page overflow safety before totals box
  if (y > 230) {
    doc.addPage();
    y = 20;
  }

  // 4. Totals Summary Box
  const summaryX = 115;
  const summaryWidth = rightMargin - summaryX;

  doc.setFillColor(248, 250, 252);
  doc.roundedRect(summaryX, y, summaryWidth, 26, 1.5, 1.5, "F");
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(summaryX, y, summaryWidth, 26, 1.5, 1.5, "D");

  doc.setFontSize(7.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(71, 85, 105);

  doc.text("Taxable Value:", summaryX + 4, y + 5);
  doc.text(`Rs. ${formatPrice(taxSummary.taxableAmount)}`, rightMargin - 4, y + 5, { align: "right" });

  doc.text("Central GST (CGST):", summaryX + 4, y + 9.5);
  doc.text(`Rs. ${formatPrice(taxSummary.cgstAmount)}`, rightMargin - 4, y + 9.5, { align: "right" });

  doc.text("State GST (SGST):", summaryX + 4, y + 14);
  doc.text(`Rs. ${formatPrice(taxSummary.sgstAmount)}`, rightMargin - 4, y + 14, { align: "right" });

  doc.setDrawColor(203, 213, 225);
  doc.line(summaryX + 4, y + 17, rightMargin - 4, y + 17);

  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(79, 70, 229);
  doc.text("Grand Total (INR):", summaryX + 4, y + 22.5);
  doc.text(`Rs. ${formatPrice(order.totalAmount)}`, rightMargin - 4, y + 22.5, { align: "right" });

  // Left side of Totals: Amount in words
  const wordsY = y + 4;
  doc.setFontSize(7.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(100, 116, 139);
  doc.text("AMOUNT IN WORDS:", leftMargin, wordsY);

  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(17, 24, 39);
  const wordsText = numberToWordsINR(order.totalAmount);
  const wrappedWords = doc.splitTextToSize(wordsText, 95);
  doc.text(wrappedWords, leftMargin, wordsY + 5);

  y += 32;

  // 5. Statutory Terms & Digital Seal
  doc.setDrawColor(226, 232, 240);
  doc.line(leftMargin, y, rightMargin, y);
  y += 5;

  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(100, 116, 139);
  doc.text("TERMS & CONDITIONS:", leftMargin, y);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text("1. Eligible items are covered by ShopIndia 7-Day Return & Replacement Policy.", leftMargin, y + 3.5);
  doc.text("2. This is an electronically generated Tax Invoice under CGST/SGST Act, 2017.", leftMargin, y + 6.5);
  doc.text("3. All disputes are subject to Ahmedabad, Gujarat jurisdiction.", leftMargin, y + 9.5);

  // Digital Signature / Stamp
  const stampX = 148;
  doc.setDrawColor(79, 70, 229);
  doc.setLineWidth(0.5);
  doc.roundedRect(stampX, y - 2, 48, 14, 2, 2, "D");

  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(79, 70, 229);
  doc.text("SHOPINDIA RETAIL", stampX + 8, y + 3);
  doc.setFontSize(6);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(16, 185, 129);
  doc.text("Digitally Signed & Verified ✓", stampX + 6, y + 7);
  doc.setFontSize(6);
  doc.setTextColor(100, 116, 139);
  doc.text("Authorized Signatory", stampX + 11, y + 10.5);

  // Trigger immediate browser file download
  const cleanId = (order.id || "order").slice(0, 8);
  doc.save(`ShopIndia_Tax_Invoice_${cleanId}.pdf`);
};
