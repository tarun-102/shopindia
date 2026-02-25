export const getAllProducts = async ({params}) => {
  const {id} = params;
  const response = await fetch("https://dummyjson.com/products?limit=102");

  if (!response.ok) {
    throw new Error("Failed to fetch products");
  }
  const data = await response.json();
  return data.products
};

  export const formatPrice = (usd) => {
    const rate = 90.58; // approx USD to INR
    return Math.round(usd * rate).toLocaleString("en-IN");
  };


  // Kisi ek product ki detail lane ke liye
export const getProductById = async ({ params }) => {
  const { id } = params; // Router se ID nikalne ke liye
  const response = await fetch(`https://dummyjson.com/products/${id}`);
  
  if (!response.ok) {
    throw new Error("Product ki detail nahi mil payi!");
  }
  
  return response.json();
};