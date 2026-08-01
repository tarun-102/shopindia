import { createSlice } from '@reduxjs/toolkit';



const initialState = {
    items: [],
    totalQuantity: 0,
    totalAmount: 0,
    isCartLoaded: false,
}

const cartSlice = createSlice({
    name: 'cart',
    initialState,
    reducers: {
            addToCart(state, action) {
            const newItem = action.payload;
            const price = Number(newItem.price || 0);
            const existingItem = state.items.find((item) => String(item.id) === String(newItem.id));
            const stock = Number(newItem.stock ?? existingItem?.stock ?? 0);

            // Only prevent adding a brand new item when its stock is unavailable.
            if (!existingItem && stock <= 0) {
                return;
            }

            // Prevent increasing quantity beyond known stock.
            if (existingItem && stock > 0 && existingItem.quantity >= stock) {
                return;
            }

            if (price <= 0) {
                return;
            }

            state.totalQuantity += 1;
            state.totalAmount = Number(state.totalAmount || 0) + price;

            if (!existingItem) {
                state.items.push({
                    id: String(newItem.id),
                    price: price,
                    quantity: 1,
                    totalPrice: price,
                    title: newItem.title,
                    image: newItem.thumbnail || newItem.image,
                    stock,
                });
            } else {
                existingItem.quantity += 1;
                existingItem.totalPrice = Number(existingItem.totalPrice || 0) + price;
                if (stock > 0) {
                    existingItem.stock = stock;
                }
            }

        },

        removeFromCart(state, action) {
            const id = action.payload;
            const existingItem = state.items.find(item => String(item.id) === String(id));
            
            if (!existingItem) return;

            state.totalQuantity--;
            state.totalAmount = Number(state.totalAmount || 0) - Number(existingItem.price || 0);

            if (existingItem.quantity === 1) {
                state.items = state.items.filter(item => item.id !== id);
            } else {
                existingItem.quantity--;
                existingItem.totalPrice = Number(existingItem.totalPrice || 0) - Number(existingItem.price || 0);
            }

            
        },

        clearCart(state) {
            state.items = [];
            state.totalQuantity = 0;
            state.totalAmount = 0;
            
          
        },
        setCartFromDB(state,action){
            state.items = action.payload?.items || [];
            state.totalQuantity = action.payload?.totalQuantity || 0;
            state.totalAmount = action.payload?.totalAmount || 0;
            state.isCartLoaded = true;
        },
    },
});

export const {addToCart,removeFromCart,clearCart, setCartFromDB} = cartSlice.actions;
export default cartSlice.reducer;