import {useState} from "react";
import {createRoot} from "react-dom/client";
import {FiltrosMapa,PantallaCompletaMapa} from "../../src/componentes/dashboard/ControlesMapa";
import "../../src/componentes/dashboard/MapaPantallaCompleta.css";

function PruebaControles() {
  const [desde,setDesde]=useState("2026-11-01");
  return <main className="mapa-pantalla-completa" style={{height:"100dvh"}}><div className="mapa-herramientas"><FiltrosMapa><label className="marketing-campo">Desde<input type="date" value={desde} onChange={(e)=>setDesde(e.target.value)}/></label><label className="marketing-campo">Hasta<input type="date" defaultValue="2026-11-25"/></label></FiltrosMapa></div><button style={{position:"absolute",right:20,bottom:200}} type="button">Fuera del filtro</button><PantallaCompletaMapa/></main>;
}
createRoot(document.getElementById("root")).render(<PruebaControles/>);
