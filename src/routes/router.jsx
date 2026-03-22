import {
  createBrowserRouter,
  createRoutesFromElements,
  Route,
} from "react-router-dom";
import Signup from "../pages/Signup";
import Layout from "../components/layout/Layout";
import Home from "../pages/Home";
import Admin from "../pages/Admin";
import Profile from "../pages/Profile";
import Login from "../pages/Login";
import Cart from "../pages/Cart";
import ProtectedRoutes from "../components/ProtectedRoutes";
import { getAllProducts, getProductById } from "../services/productservices";
import ProductDetails from "../pages/ProductDetails";
import Loader from "../components/ui/Loader";
const router = createBrowserRouter(
  createRoutesFromElements(
    <Route path="/" element={<Layout />}>
      <Route index element={<Home />}
        loader={getAllProducts}
      />
    
      <Route element={<ProtectedRoutes />}>
        <Route path="cart" element={<Cart />} />
        <Route path="profile" element={<Profile />} />
        <Route path="admin" element={<Admin />} />
              <Route
        path="product/:id" element={<ProductDetails />}
        loader={getProductById}
      />
      </Route>
      <Route path="login" element={<Login />} />

      <Route path="signup" element={<Signup />} />
    </Route>,
  ),
  {
    hydrationFallbackElement: <Loader />,
  }
);
export default router