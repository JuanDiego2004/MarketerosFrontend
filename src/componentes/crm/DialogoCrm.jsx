import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import DrawerFormulario from "../DrawerFormulario";

// Adaptador de la API CRM: todos los registros pertenecen al drawer compartido.
export default function DialogoCrm({ formulario = false, ...props }) {
  if (formulario) return <DrawerFormulario abierto alCerrar={props.cerrar} titulo={props.titulo} descripcion={props.descripcion} ocupado={props.ocupado} ancho={props.ancho} className="crm">{props.children}</DrawerFormulario>;
  return <DialogoConfirmacion {...props} />;
}

function DialogoConfirmacion({
  titulo,
  cerrar,
  ocupado = false,
  children,
}) {
  const ref = useRef(null);
  useEffect(() => {
    const previo = document.activeElement;
    const dialogo = ref.current;
    dialogo.showModal();
    dialogo.querySelector("input, textarea, select")?.focus();
    return () => {
      dialogo.close();
      previo?.focus();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      aria-labelledby="crm-dialogo-titulo"
      className="crm crm-dialogo"
      onCancel={(e) => {
        e.preventDefault();
        if (!ocupado) cerrar();
      }}
    >
      <header className="crm-dialogo-cabecera">
        <h2 id="crm-dialogo-titulo">{titulo}</h2>
        <button
          type="button"
          className="crm-boton crm-icono"
          onClick={cerrar}
          disabled={ocupado}
          aria-label="Cerrar"
        >
          <X size={18} />
        </button>
      </header>
      {children}
    </dialog>
  );
}
