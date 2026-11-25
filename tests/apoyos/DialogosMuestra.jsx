// Harness exclusivo de pruebas. No importa servicios ni envía mensajes.
import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import DialogoCrm from "../../src/componentes/crm/DialogoCrm";
import "../../src/App.css";
import "../../src/screens/crm/Crm.css";
import "../../src/componentes/ui/SistemaUI.css";
import "../../src/componentes/crm/DialogoCrm.css";

function Muestra() {
  const [modal,setModal] = useState(null);
  const [detalle,setDetalle] = useState(false);
  const [ocupado,setOcupado] = useState(false);
  const [intentos,setIntentos] = useState(0);
  const cerrar = () => setModal(null);
  async function confirmar() {
    setOcupado(true);
    setIntentos((v)=>v+1);
    await new Promise((resolver)=>{window.resolverConfirmacionDePrueba=resolver;});
    setOcupado(false);
    setModal(null);
  }
  return <main className="app-contenido" style={{minHeight:"100vh",background:"#f7f9fd",padding:"40px"}}><section className="crm"><h1>Confirmaciones del sistema</h1><p className="crm-ayuda">Vista aislada para comprobar diseño, foco y estados.</p><div className="crm-acciones" style={{marginTop:"24px"}}><button className="crm-boton" onClick={()=>setModal("correo")}>Abrir confirmación de correo</button><button className="crm-boton" onClick={()=>setModal("eliminar")}>Eliminar registro de prueba</button><button className="crm-boton" onClick={()=>setDetalle(true)}>Abrir detalle</button></div><output aria-label="Confirmaciones de prueba">{intentos}</output>
    {detalle && <DialogoCrm titulo="Detalle de resultados" confirmacion={false} cerrar={()=>setDetalle(false)}><p>El detalle conserva su propio tamaño y puede abrir una confirmación.</p><button className="crm-boton" onClick={()=>setModal("correo")}>Confirmación anidada</button></DialogoCrm>}
    {modal && <DialogoCrm titulo={modal==="correo" ? "Confirmar envío de correo" : "Eliminar registro"} ilustracion={modal==="correo" ? "correo" : "peligro"} variante={modal==="eliminar" ? "peligro" : "normal"} aviso="Esta acción no se puede deshacer." ocupado={ocupado} cerrar={cerrar}>
      <><p>{modal==="correo" ? <>Vas a enviar <strong>«Resultados de noviembre»</strong> a <strong>Camila Torres</strong>.</> : <>Se eliminará <strong>«Registro de prueba»</strong> y su historial.</>}</p>{modal==="correo" && <p>Solo recibirán el correo los contactos con consentimiento vigente.</p>}<div className="crm-acciones"><button className="crm-boton" onClick={cerrar}>Cancelar</button><button className="crm-boton crm-primario" onClick={confirmar}>{modal==="correo" ? "Confirmar y enviar" : "Eliminar"}</button></div></>
    </DialogoCrm>}
  </section></main>;
}
createRoot(document.getElementById("root")).render(<Muestra />);
