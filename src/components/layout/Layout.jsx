import { Outlet } from "react-router-dom";
import NAvbar from './Navbar'
import Footer from "./Footer";

const Layout = () =>{
    return(
        <div className="min-h-screen">
            <NAvbar />

            <main className="px-6 mt-8">
                <Outlet />
            </main>
            <Footer />
        </div>
    )
}

export default Layout 