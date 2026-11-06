/**
 * Tax & GST Calculation Utilities for Indian E-Commerce
 * Standard Indian GST Breakdown (Inclusive Model):
 * Total Price = Taxable Amount + CGST + SGST
 */

export const DEFAULT_GST_RATE = 18;

export const GST_RATE_OPTIONS = [
  { 
    label: "0% - Daily Essentials & Fresh Farm Food (Exempt, HSN 0701)", 
    shortLabel: "0% Exempt (Daily Essentials)", 
    value: 0,
    hsn: "0701",
    category: "Fresh Food & Daily Essentials"
  },
  { 
    label: "5% - Packaged Food, Groceries, Spices & Tea (5% GST, HSN 0901/1905)", 
    shortLabel: "5% (Food & Groceries)", 
    value: 5,
    hsn: "1905",
    category: "Groceries & Packaged Food"
  },
  { 
    label: "12% - Processed Food, Dairy, Ghee & Apparel (12% GST, HSN 0405/2106)", 
    shortLabel: "12% (Processed Food & Apparel)", 
    value: 12,
    hsn: "2106",
    category: "Processed Food & Apparel"
  },
  { 
    label: "18% - Electronics, Mobiles, Computers & Audio (Standard 18% GST, HSN 8517/8471)", 
    shortLabel: "18% Standard (Electronics & Mobiles)", 
    value: 18,
    hsn: "8517",
    category: "Electronics & Tech"
  },
  { 
    label: "28% - Luxury Electronics, Consoles & Premium Tech (28% GST, HSN 8528/8415)", 
    shortLabel: "28% (Luxury & Premium Tech)", 
    value: 28,
    hsn: "8528",
    category: "Luxury Electronics"
  },
];

export const CATEGORY_GST_MAP = {
  groceries: 5,
  food: 5,
  "food-groceries": 5,
  smartphones: 18,
  laptops: 18,
  tablets: 18,
  audio: 18,
  wearables: 18,
  cameras: 18,
  gaming: 18,
  "home-appliances": 18,
  "mens-clothing": 12,
  "womens-clothing": 12,
  fashion: 12,
  apparel: 12,
  luxury: 28,
  daily: 0
};

export const getSuggestedGstRate = (categorySlug = "") => {
  if (!categorySlug) return 18;
  const slug = String(categorySlug).toLowerCase().trim();
  for (const [key, rate] of Object.entries(CATEGORY_GST_MAP)) {
    if (slug.includes(key)) return rate;
  }
  return 18;
};

export const getSuggestedHsn = (rate = 18) => {
  const match = GST_RATE_OPTIONS.find(opt => opt.value === Number(rate));
  return match?.hsn || "8517";
};

/**
 * Calculates taxable value, CGST, SGST, and total GST for a single line item.
 */
export const calculateItemTax = (price, gstRate = DEFAULT_GST_RATE, quantity = 1) => {
  const unitPrice = Number(price) || 0;
  const qty = Number(quantity) || 1;
  const lineTotal = Math.round(unitPrice * qty * 100) / 100;

  const rate = Number(gstRate !== undefined && gstRate !== null && gstRate !== "" ? gstRate : DEFAULT_GST_RATE);
  
  if (rate <= 0) {
    return {
      unitPrice,
      quantity: qty,
      lineTotal,
      gstRate: 0,
      taxableAmount: lineTotal,
      totalGst: 0,
      cgstRate: 0,
      cgstAmount: 0,
      sgstRate: 0,
      sgstAmount: 0,
    };
  }

  // Taxable Value = Line Total / (1 + (GST% / 100))
  const taxableAmount = Math.round((lineTotal / (1 + rate / 100)) * 100) / 100;
  const totalGst = Math.round((lineTotal - taxableAmount) * 100) / 100;
  
  // Standard Intra-State split: 50% CGST + 50% SGST
  const cgstRate = rate / 2;
  const sgstRate = rate / 2;
  const cgstAmount = Math.round((totalGst / 2) * 100) / 100;
  const sgstAmount = Math.round((totalGst - cgstAmount) * 100) / 100;

  return {
    unitPrice,
    quantity: qty,
    lineTotal,
    gstRate: rate,
    taxableAmount,
    totalGst,
    cgstRate,
    cgstAmount,
    sgstRate,
    sgstAmount,
  };
};

/**
 * Calculates complete order tax summary from cart items or order items.
 */
export const calculateOrderTax = (items = [], orderTotal = null) => {
  if (!items || items.length === 0) {
    const total = Number(orderTotal) || 0;
    const fallback = calculateItemTax(total, DEFAULT_GST_RATE, 1);
    return {
      taxableAmount: fallback.taxableAmount,
      totalGst: fallback.totalGst,
      cgstAmount: fallback.cgstAmount,
      sgstAmount: fallback.sgstAmount,
      grandTotal: total,
      itemBreakdown: [],
    };
  }

  let totalTaxable = 0;
  let totalCGST = 0;
  let totalSGST = 0;
  let totalGST = 0;
  let calculatedGrandTotal = 0;

  const itemBreakdown = items.map((item) => {
    const price = Number(item.price || item.totalPrice || 0);
    const qty = Number(item.quantity) || 1;
    const rate = Number(item.gstRate !== undefined && item.gstRate !== null ? item.gstRate : DEFAULT_GST_RATE);
    
    // If item.totalPrice already exists and differs, use it
    const itemTotal = item.totalPrice ? Number(item.totalPrice) : price * qty;
    const tax = calculateItemTax(itemTotal / qty, rate, qty);

    totalTaxable += tax.taxableAmount;
    totalCGST += tax.cgstAmount;
    totalSGST += tax.sgstAmount;
    totalGST += tax.totalGst;
    calculatedGrandTotal += tax.lineTotal;

    return {
      ...item,
      taxDetails: tax,
    };
  });

  const finalTotal = orderTotal !== null ? Number(orderTotal) : Math.round(calculatedGrandTotal * 100) / 100;

  return {
    taxableAmount: Math.round(totalTaxable * 100) / 100,
    totalGst: Math.round(totalGST * 100) / 100,
    cgstAmount: Math.round(totalCGST * 100) / 100,
    sgstAmount: Math.round(totalSGST * 100) / 100,
    grandTotal: finalTotal,
    itemBreakdown,
  };
};

/**
 * Converts Indian Rupee number into official invoice words
 * e.g. 1599 -> "One Thousand Five Hundred Ninety-Nine Rupees Only"
 */
export const numberToWordsINR = (num) => {
  const n = Math.floor(Number(num) || 0);
  if (n === 0) return "Zero Rupees Only";

  const a = [
    "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten",
    "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"
  ];
  const b = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

  const inWords = (val) => {
    let str = "";
    if (val >= 10000000) {
      str += inWords(Math.floor(val / 10000000)) + " Crore ";
      val %= 10000000;
    }
    if (val >= 100000) {
      str += inWords(Math.floor(val / 100000)) + " Lakh ";
      val %= 100000;
    }
    if (val >= 1000) {
      str += inWords(Math.floor(val / 1000)) + " Thousand ";
      val %= 1000;
    }
    if (val >= 100) {
      str += inWords(Math.floor(val / 100)) + " Hundred ";
      val %= 100;
    }
    if (val > 0) {
      if (str !== "") str += "and ";
      if (val < 20) str += a[val] + " ";
      else {
        str += b[Math.floor(val / 10)] + " ";
        if (val % 10 > 0) str += a[val % 10] + " ";
      }
    }
    return str.trim();
  };

  return `${inWords(n)} Rupees Only`;
};

