import Header from "../componentes/header.jsx";
import {Outlet} from "react-router-dom";
import Sidebar from "../componentes/sidebar/Sidebar.jsx";

export default function LayoutPrivado() {
    return (
      <div className={"w-full h-screen flex "}>
          <Sidebar />

          <div className={"flex flex-1 bg-white"}>
              <Header />
              <Outlet />
          </div>
      </div>
    )
}