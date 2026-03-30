import {createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut,updateProfile} from 'firebase/auth'
import {doc, setDoc,getDoc} from 'firebase/firestore'
import {auth,db} from '../firebase'

//signup
export const registerUser = async (fullName, email,password) =>{
        try{
            const userCredential = await createUserWithEmailAndPassword(auth, email,password)
        const user = userCredential.user;
            await updateProfile(user,{
                displayName: fullName
            })
        await setDoc(doc(db, "users", user.uid), {
            uid: user.uid,
            fullName: fullName,
            email: email,
            role: "customer",
            createdAt: new Date().toISOString()
        
        });
        return {success: true, user}; 
        } catch(error) {
            return {success: false, error: error.message}
        }
}

// Login 

export const loginUser = async (email, password) => {
    try{
        const userCredential = await signInWithEmailAndPassword(auth,email, password)
        const user = userCredential.user;

        const userDocRef = doc(db, "users", user.uid);
        const userDocSnap = await getDoc(userDocRef);

        let userRole = "customer";

        if (userDocSnap.exists()) {
            userRole = userDocSnap.data().role; 
        }
        return {success: true, user: user, role: userRole}
    } catch (error){
        return {success: false, error: "Invalid Email or Password"}

    }
}

//Logout

export const logoutUser = async () => {
    try{
        await signOut(auth)
        return{success: true}
    }catch (error) {
        return {success: false,  error: error.message}
    }
} 