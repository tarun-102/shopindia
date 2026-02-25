import {
  createBrowserRouter,
  createRoutesFromElements,
  Route,
} from "react-router-dom";

import Layout from "../components/layout/Layout";
import Home from "../pages/Home";
import Admin from "../pages/Admin";
import Profile from "../pages/Profile";
import Login from "../pages/Login";
import Cart from "../pages/Cart";
import { getAllProducts, getProductById } from "../services/productservices";
import ProductDetails from "../pages/ProductDetails";

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route path="/" element={<Layout />}>
      <Route index element={<Home />} 
        loader={getAllProducts}
      />
      <Route 
        path="product/:id" element={<ProductDetails/>}
          loader={getProductById}
      />
      <Route path="login" element={<Login />} />
      <Route path="cart" element={<Cart />} />
      <Route path="profile" element={<Profile />} />
      <Route path="admin" element={<Admin />} />
    </Route>,
  ),
);
export default router