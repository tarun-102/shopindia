import { Outlet } from "react-router-dom";
import NAvbar from './Navbar'

const Layout = () =>{
    return(
        <div className="min-h-screen">
            <NAvbar />

            <main className="px-6 mt8">
                <Outlet />
            </main>
        </div>
    )
}

export default Layout 