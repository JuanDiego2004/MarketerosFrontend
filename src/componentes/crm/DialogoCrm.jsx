import { Children, Fragment, cloneElement, isValidElement, useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import { Check, Info, LoaderCircle, Send, Trash2, X } from "lucide-react";
import DrawerFormulario from "../DrawerFormulario";
import IlustracionConfirmacion from "./IlustracionConfirmacion";

function desglosar(children, prefijo = "dialogo") {
  return Children.toArray(children).flatMap((elemento, indice) => {
    if (!isValidElement(elemento)) return elemento;
    const clave = `${prefijo}:${elemento.key ?? indice}`;
    return elemento.type === Fragment ? desglosar(elemento.props.children, clave) : cloneElement(elemento, { key: clave });
  });
}

// Los formularios conservan su drawer. Las confirmaciones y vistas previas usan el modal central.
export default function DialogoCrm({ formulario = false, ...props }) {
  if (formulario) return <DrawerFormulario abierto alCerrar={props.cerrar} titulo={props.titulo} descripcion={props.descripcion} ocupado={props.ocupado} ancho={props.ancho} className="crm">{props.children}</DrawerFormulario>;
  return <DialogoCentral {...props} />;
}

function DialogoCentral({ titulo, cerrar, ocupado = false, children, confirmacion, ilustracion, aviso, variante, ancho }) {
  const ref = useRef(null);
  const tituloId = useId();
  const descripcionId = useId();
  const elementos = desglosar(children);
  const indiceAcciones = elementos.findLastIndex((e) => isValidElement(e) && typeof e.props.className === "string" && e.props.className.split(/\s+/).includes("crm-acciones") && desglosar(e.props.children).some((c) => isValidElement(c) && c.type === "button"));
  const acciones = indiceAcciones >= 0 ? elementos[indiceAcciones] : null;
  const confirmar = confirmacion ?? Boolean(acciones);
  const botones = acciones ? desglosar(acciones.props.children) : [];
  const indicePrincipal = botones.findLastIndex((e) => isValidElement(e) && e.type === "button");
  const peligro = variante === "peligro" || (!variante && botones[indicePrincipal]?.props.className?.split(/\s+/).includes("crm-peligro"));
  const dibujo = ilustracion || (peligro ? "peligro" : "confirmacion");
  const IconoAccion = dibujo === "correo" ? Send : peligro ? Trash2 : Check;
  const contenido = elementos.filter((_, i) => i !== indiceAcciones);

  useEffect(() => {
    const previo = document.activeElement;
    const dialogo = ref.current;
    dialogo.showModal();
    const inicial = dialogo.querySelector("input:not([disabled]):not([type=hidden]), textarea:not([disabled]), select:not([disabled])") || dialogo.querySelector(".dialogo-secundario:not([disabled])") || dialogo.querySelector(".dialogo-cerrar");
    inicial?.focus({ preventScroll: true });
    return () => {
      dialogo.close();
      if (previo?.isConnected && !previo.closest("[inert]")) previo.focus({ preventScroll: true });
    };
  }, []);

  return createPortal(
    <dialog
      ref={ref}
      className={`crm crm-dialogo dialogo-sistema ${confirmar ? "dialogo-confirmacion" : "dialogo-detalle"} ${peligro ? "dialogo-peligro" : ""} ${ancho === "amplio" ? "dialogo-amplio" : ""}`}
      aria-modal="true"
      aria-labelledby={tituloId}
      aria-describedby={confirmar ? descripcionId : undefined}
      aria-busy={ocupado}
      onCancel={(e) => { e.preventDefault(); if (!ocupado) cerrar(); }}
    >
      <div className="dialogo-marco">
        <button type="button" className="dialogo-cerrar" onClick={cerrar} disabled={ocupado} aria-label="Cerrar"><X size={21} strokeWidth={1.7} /></button>
        <header className="dialogo-cabecera">
          {confirmar && <IlustracionConfirmacion tipo={dibujo} />}
          <h2 id={tituloId}>{titulo}</h2>
        </header>
        <div className="dialogo-cuerpo" id={descripcionId}>{contenido}</div>
        {aviso && <div className="dialogo-aviso"><Info size={19} aria-hidden="true" /><p>{aviso}</p></div>}
        {acciones && cloneElement(acciones, { className: "dialogo-acciones" }, botones.map((boton, indice) => {
          if (!isValidElement(boton) || boton.type !== "button") return boton;
          const principal = indice === indicePrincipal;
          const tieneIcono = Children.toArray(boton.props.children).some((c) => isValidElement(c));
          return cloneElement(boton, {
            key: boton.key ?? indice,
            type: boton.props.type || "button",
            className: `crm-boton ${principal ? "dialogo-primario" : "dialogo-secundario"}`,
            disabled: ocupado || boton.props.disabled,
            "aria-busy": principal && ocupado ? true : undefined,
          }, <>{principal && ocupado ? <LoaderCircle size={18} className="dialogo-cargando" aria-hidden="true" /> : principal && !tieneIcono ? <IconoAccion size={18} strokeWidth={1.7} aria-hidden="true" /> : null}{boton.props.children}</>);
        }))}
      </div>
    </dialog>,
    document.body,
  );
}
