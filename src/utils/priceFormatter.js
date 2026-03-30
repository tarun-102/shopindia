export const formatPrice = (price) => {
 
  return new Intl.NumberFormat('en-IN').format(price) ;
};
