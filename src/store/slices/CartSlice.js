import {createSlice} from '@reduxjs/toolkit'
import { formatPrice } from '../../services/productservices';

const cartSlice = createSlice({
    name: 'cart',
    initialstate: {
        item: [],
        totalQuantity: 0,
    },

    reducers: {
        addTocart(state,action){
            const newItem = action.payload;
            const existingItem = state.item.find((item) => item.id === newItem.id)

            state.totalQuantity++;

            if(!existingItem){
                state.item.push({
                    id: newItem.id,
                    price: newItem.price,
                    quantity: 1,
                    totalprice: newItem.price,
                    title: newItem.title,
                    image: newItem.thumbnail,
                })
            }
            else{
                existingItem.totalQuantity++
                existingItem.totalprice = existingItem.totalprice + newItem.price;
            }
        }
    },
})

export const cartActions = cartSlice.actions
export default cartSlice;