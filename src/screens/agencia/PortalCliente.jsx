import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";
import { useAuth } from "../../contexto/ContextoAuth";
import { solicitarCrm } from "../../servicios/servicioCrm";
import AnaliticaCliente from "../../componentes/portal/AnaliticaCliente";
import EntregasContratoCliente from "./EntregasContratoCliente";
import "../crm/Crm.css";
import "../../componentes/portal/PortalAnalitica.css";

export default function PortalCliente() {
  const { token, cerrarSesion } = useAuth();
  const navegar = useNavigate();
  const [datos, setDatos] = useState(null);
  const [id, setId] = useState("");
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    document.title = "Resultados · Portal de clientes";
    const control = new AbortController();
    solicitarCrm("/entregas/portal", token, { signal: control.signal })
      .then((d) => {
        if (!control.signal.aborted) {
          setDatos(d);
          setError("");
        }
      })
      .catch((e) => {
        if (!control.signal.aborted) setError(e.message);
      });
    return () => control.abort();
  }, [token, revision]);
  const contrato = datos?.contratos.find((c) => String(c.id) === id);
  return (
    <main className="crm portal-analitica dashboard-inmersivo">
      <header className="portal-cabecera">
        <div>
          <span className="portal-eyebrow">PORTAL DEL CLIENTE</span>
          <h1>{datos?.empresa?.nombre || "Resultados de mi empresa"}</h1>
          <p>El rendimiento de tus campañas, en perspectiva.</p>
        </div>
        <div className="portal-cabecera-acciones">
          <span className="portal-demo">Datos simulados · Mockaroo</span>
          <button
            className="crm-boton"
            onClick={() => {
              cerrarSesion();
              navegar("/login", { replace: true });
            }}
          >
            <LogOut size={16} />
            Cerrar sesión
          </button>
        </div>
      </header>
      <AnaliticaCliente
        token={token}
        portal={datos}
        contrato={id}
        seleccionarContrato={setId}
        alCargarContexto={setDatos}
        revision={revision}
        actualizar={() => setRevision((v) => v + 1)}
      />
      <section
        className="portal-entregas"
        aria-label="Servicios y entregas de mi contrato"
      >
        {error && !datos && (
          <p className="crm-error" role="alert">
            {error}
          </p>
        )}
        {contrato ? (
          <EntregasContratoCliente
            key={`${id}-${revision}`}
            contrato={contrato}
          />
        ) : (
          <div className="crm-panel">
            <h2>Servicios e informes de tu contrato</h2>
            <p>
              Selecciona un contrato para consultar sus entregables, materiales
              incluidos e informes publicados.
            </p>
          </div>
        )}
      </section>
    </main>
  );
}
