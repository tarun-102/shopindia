export const formatPrice = (usd) => {
  const rate = 90; // approx USD to INR
  return Math.round(usd * rate).toLocaleString("en-IN");
};
