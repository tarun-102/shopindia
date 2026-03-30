import {doc, setDoc,getDoc} from 'firebase/firestore';
import { db } from './firebase';

export const saveCartToDB = async (uid,cartData) =>{
    try{
        await setDoc(doc(db, "cart",uid), cartData)
    }catch(error){
        console.error("cart save error", error)
    }
}

export const getCartFromDB = async (uid) => {
    try {
        const docSnap = await getDoc(doc(db, "cart", uid));
        if (docSnap.exists()) {
            return docSnap.data(); 
        }
        return { items: [], totalQuantity: 0, totalAmount: 0 }; 
    } catch (error) {
        console.error("Cart fetch error:", error);
        return { items: [], totalQuantity: 0, totalAmount: 0 };
    }
};