import { useEffect, useState } from "react";
import { Plus, Copy, Link2 } from "lucide-react";
import { useAuth } from "../../contexto/ContextoAuth";
import { solicitarCrm } from "../../servicios/servicioCrm";
import "./Crm.css";
import DialogoCrm from "../../componentes/crm/DialogoCrm";
export default function PanelCaptacion() {
  const { token } = useAuth();
  const [registrar, setRegistrar] = useState(false);
  const [desactivar, setDesactivar] = useState(null);
  const [campanas, setCampanas] = useState([]),
    [campana, setCampana] = useState("");
  const [nombre, setNombre] = useState(""),
    [formularios, setFormularios] = useState([]);
  const [nuevo, setNuevo] = useState(null),
    [error, setError] = useState(""),
    [mensaje, setMensaje] = useState("");
  const [ocupado, setOcupado] = useState(false),
    [revision, setRevision] = useState(0),
    [cargando, setCargando] = useState(false);
  const api = (ruta, args) => solicitarCrm(`/operaciones${ruta}`, token, args);
  useEffect(() => {
    const c = new AbortController();
    solicitarCrm("/operaciones/pipeline/opciones", token, { signal: c.signal })
      .then((d) => setCampanas(d.campanas))
      .catch((e) => {
        if (!c.signal.aborted) setError(e.message);
      });
    return () => c.abort();
  }, [token]);
  useEffect(() => {
    if (!campana) return;
    const c = new AbortController();
    solicitarCrm(`/operaciones/formularios?campanaId=${campana}`, token, {
      signal: c.signal,
    })
      .then((d) => {
        if (!c.signal.aborted) {
          setFormularios(d);
          setCargando(false);
        }
      })
      .catch((e) => {
        if (!c.signal.aborted) {
          setError(e.message);
          setCargando(false);
        }
      });
    return () => c.abort();
  }, [campana, revision, token]);
  async function crear(e) {
    e.preventDefault();
    if (ocupado) return;
    if (!campana || !nombre.trim()) {
      setError("Selecciona una campaña y escribe un nombre.");
      return;
    }
    setOcupado(true);
    setError("");
    try {
      setNuevo(
        await api("/formularios", {
          method: "POST",
          body: { nombre, campana_id: Number(campana) },
        }),
      );
      setNombre("");
      setRegistrar(false);
      setRevision((n) => n + 1);
    } catch (e) {
      setError(e.message);
    } finally {
      setOcupado(false);
    }
  }
  const url = nuevo ? `${import.meta.env.VITE_API_URL}${nuevo.formulario}` : "";
  const embed = `<iframe src="${url}" title="Formulario de contacto" style="width:100%;height:560px;border:0"></iframe>`;
  return (
    <section className="crm">
      <header className="crm-cabecera">
        <div>
          <p className="crm-kicker">Marketing · Captación</p>
          <h1>Formularios y webhooks</h1>
          <p className="crm-ayuda">
            Cada formulario registra campaña de origen, UTM e historial. La
            captura no actualiza fichas existentes ni revela datos de contactos.
          </p>
        </div>
      </header>
      {error && !registrar && (
        <p className="crm-error" role="alert">
          {error}
        </p>
      )}
      {mensaje && (
        <p role="status" className="crm-exito">
          {mensaje}
        </p>
      )}
      <button className="crm-boton crm-primario" onClick={()=>setRegistrar(true)}><Plus size={16}/>Nuevo formulario</button>
      <label className="crm-campo">Campaña para consultar<select value={campana} onChange={e=>{setCampana(e.target.value);setFormularios([]);setCargando(true);setNuevo(null);}}><option value="">Seleccionar campaña</option>{campanas.map(c=><option key={c.id} value={c.id}>{c.nombre}</option>)}</select></label>
      {registrar && <DialogoCrm formulario titulo="Crear formulario de captación" ocupado={ocupado} cerrar={()=>setRegistrar(false)}>
      <form noValidate className="crm-formulario" onSubmit={crear}>
        <label className="crm-campo">
          Campaña
          <select
            value={campana}
            onChange={(e) => {
              setCampana(e.target.value);
              setFormularios([]);
              setCargando(true);
              setNuevo(null);
            }}
          >
            <option value="">Seleccionar campaña</option>
            {campanas.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </select>
        </label>
        <label className="crm-campo">
          Nombre del formulario
          <input
            maxLength={160}
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
          />
        </label>
        <button className="crm-boton crm-primario" disabled={ocupado}>
          <Plus size={16} />
          Crear formulario
        </button>
        <button type="button" className="crm-boton" disabled={ocupado} onClick={()=>setRegistrar(false)}>Cancelar</button>
      {error && <p role="alert" className="crm-error crm-ancho">{error}</p>}
      </form></DialogoCrm>}
      {nuevo && (
        <div className="crm-panel">
          <h2>Formulario creado</h2>
          <a className="crm-link" href={url} target="_blank" rel="noreferrer">
            <Link2 size={16} />
            Abrir formulario
          </a>
          <label className="crm-campo">
            Insertar en tu sitio
            <textarea readOnly value={embed} />
          </label>
          <button
            className="crm-boton"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(embed);
                setMensaje("Código copiado");
              } catch {
                setError("Selecciona y copia el código manualmente.");
              }
            }}
          >
            <Copy size={16} />
            Copiar código
          </button>
          <p className="crm-ayuda">
            Webhook: POST {import.meta.env.VITE_API_URL}
            {nuevo.webhook}. Cabecera X-CRM-Key. Guarda el secreto, solo se
            muestra en esta pantalla.
          </p>
          <details>
            <summary>Mostrar secreto del webhook</summary>
            <code>{nuevo.secreto}</code>
          </details>
          <p className="crm-ayuda">
            JSON: nombre, correo, telefono (opcional), idempotencia (UUID),
            consentimiento (booleano), utm_source, utm_medium, utm_campaign.
          </p>
        </div>
      )}
      <div className="crm-panel">
        {cargando ? (
          <p role="status">Cargando formularios…</p>
        ) : !campana ? (
          <p className="crm-vacio">Selecciona una campaña.</p>
        ) : !formularios.length ? (
          <p className="crm-vacio">Esta campaña aún no tiene formularios.</p>
        ) : (
          formularios.map((f) => (
            <p className="crm-tarjeta" key={f.id}>
              {f.nombre} · {f.activo ? "Activo" : "Desactivado"}
              {f.activo && (
                <button
                  className="crm-boton crm-peligro"
                  disabled={ocupado}
                  onClick={() => setDesactivar(f)}
                >
                  Desactivar
                </button>
              )}
            </p>
          ))
        )}
      </div>
      {desactivar && (
        <DialogoCrm
          titulo="Desactivar formulario"
          ocupado={ocupado}
          cerrar={() => setDesactivar(null)}
        >
          <p>
            «{desactivar.nombre}» dejará de recibir solicitudes desde su
            formulario y webhook. Se conservan los contactos captados.
          </p>
          <div className="crm-acciones">
            <button
              className="crm-boton"
              disabled={ocupado}
              onClick={() => setDesactivar(null)}
            >
              Cancelar
            </button>
            <button
              className="crm-boton crm-peligro"
              disabled={ocupado}
              onClick={async () => {
                setOcupado(true);
                try {
                  await api(`/formularios/${desactivar.id}`, {
                    method: "DELETE",
                  });
                  setDesactivar(null);
                  setRevision((n) => n + 1);
                } catch (e) {
                  setError(e.message);
                } finally {
                  setOcupado(false);
                }
              }}
            >
              Desactivar
            </button>
          </div>
        </DialogoCrm>
      )}
    </section>
  );
}
