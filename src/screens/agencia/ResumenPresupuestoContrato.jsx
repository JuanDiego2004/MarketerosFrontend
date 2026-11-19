import { Banknote } from "lucide-react";
import { mostrarPauta } from "../../utils/presupuestoContrato";

export default function ResumenPresupuestoContrato({ resumen, moneda, paso, usarTotal, ocupado = false }) {
  if (!resumen.valido) return <p role="status" className="crm-ayuda">Completa los importes de pauta con un máximo de dos decimales para calcular el presupuesto.</p>;
  const { filas, autorizado, distribuido, exceso } = resumen;
  return <section className="crm-panel" aria-label="Resumen de presupuesto de pauta">
    <h3 className="crm-acciones"><Banknote size={18} aria-hidden="true"/>Presupuesto de pauta</h3>
    <dl className="crm-resumen">
      <div><dt>Distribuido por canales</dt><dd>{mostrarPauta(distribuido, moneda)}</dd></div>
      <div><dt>Máximo autorizado del contrato</dt><dd>{mostrarPauta(autorizado, moneda)}</dd></div>
      <div><dt>{exceso > 0n ? "Exceso por corregir" : "Sin distribuir"}</dt><dd>{mostrarPauta(exceso > 0n ? exceso : autorizado - distribuido, moneda)}</dd></div>
    </dl>
    {filas.length > 0 && <ul className="crm-ayuda">{filas.map((fila, i) => <li key={i}>{fila.material} · {fila.plataforma}: {mostrarPauta(fila.centavos, moneda)}</li>)}</ul>}
    <p className="crm-ayuda">La pauta corresponde a la suma de los presupuestos de todos los materiales y canales. Honorarios y producción se registran por separado.</p>
    {paso === 2 && <p className="crm-ayuda">En el paso 4, indica el presupuesto máximo de pauta autorizado por el cliente.</p>}
    {paso !== 2 && exceso > 0n && <p className="crm-error" role="status">La distribución supera el máximo autorizado en {mostrarPauta(exceso, moneda)}. Reduce los importes por canal o ajusta el máximo autorizado por el cliente.</p>}
    {paso === 3 && usarTotal && distribuido > 0n && autorizado !== distribuido && <button type="button" className="crm-boton" onClick={usarTotal} disabled={ocupado}>Usar total distribuido como máximo autorizado ({mostrarPauta(distribuido, moneda)})</button>}
  </section>;
}
