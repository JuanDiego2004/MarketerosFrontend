import { useState } from "react";
import tierra from "../../assets/world-land.json";

const numero = (n) => Number(n).toLocaleString("es-PE", { maximumFractionDigits: 2 });
const nombres = { impresiones: "Impresiones", clics: "Clics", inversion: "Inversión", conversiones: "Conversiones" };

export function EvolucionPublicidad({ dias, moneda }) {
  const [medida, setMedida] = useState("impresiones");
  const maximo = Math.max(1, ...dias.map((d) => Number(d[medida])));
  const x = (i) => 60 + (dias.length === 1 ? 255 : i * 510 / (dias.length - 1));
  const y = (d) => 165 - Number(d[medida]) * 140 / maximo;
  const puntos = dias.map((d, i) => `${x(i)},${y(d)}`).join(" ");
  return <section className="crm-panel" aria-label="Evolución de publicidad">
    <header className="crm-cabecera"><div><h2>Evolución por día</h2><p className="crm-ayuda">Resultados del período seleccionado.</p></div><label className="crm-campo">Métrica del gráfico<select value={medida} onChange={(e) => setMedida(e.target.value)}>{Object.entries(nombres).map(([k, n]) => <option key={k} value={k}>{n}{k === "inversion" ? ` (${moneda})` : ""}</option>)}</select></label></header>
    <div className="crm-scroll"><svg viewBox="0 0 600 205" role="img" aria-label={`${nombres[medida]} por día`} className="crm-demo-grafico">
      {[0, 0.5, 1].map((f) => <g key={f}><line x1="60" x2="570" y1={165 - f * 140} y2={165 - f * 140} className="crm-demo-rejilla"/><text x="50" y={169 - f * 140} textAnchor="end">{numero(maximo * f)}</text></g>)}
      <polyline points={puntos} className="crm-demo-linea" />
      {dias.map((d, i) => <circle key={d.fecha} cx={x(i)} cy={y(d)} r="3" className="crm-demo-punto"><title>{d.fecha}: {numero(d[medida])}</title></circle>)}
      {[...new Set([0, Math.floor((dias.length - 1) / 2), dias.length - 1])].map((i) => <text key={i} x={x(i)} y="192" textAnchor="middle">{dias[i].fecha.slice(5).split("-").reverse().join("/")}</text>)}
    </svg></div>
  </section>;
}

export function MapaPublicidad({ paises, seleccionar, ocupado = false }) {
  const maximo = Math.max(1, ...paises.map((p) => Number(p.impresiones)));
  return <section className="crm-panel" aria-label="Mapa de impresiones">
    <h2>Distribución por países</h2><p className="crm-ayuda">Cada punto representa un país. Su tamaño indica impresiones, no ubicaciones individuales.</p>
    <div className="crm-demo-mapa">
      <svg viewBox="0 0 1000 500" aria-hidden="true"><path d={tierra.path}/></svg>
      {paises.map((p) => <button disabled={ocupado} key={p.codigo} className="crm-demo-marcador" style={{ left: `${(p.longitud + 180) / 3.6}%`, top: `${(90 - p.latitud) / 1.8}%`, "--demo-tamano": `${16 + 22 * Math.sqrt(Number(p.impresiones) / maximo)}px` }} title={`${p.nombre}: ${numero(p.impresiones)} impresiones`} aria-label={`Filtrar ${p.nombre}: ${numero(p.impresiones)} impresiones`} onClick={() => seleccionar(p.codigo)} />)}
    </div>
    <p className="crm-ayuda">Mapa base: <a className="crm-link" href="https://www.naturalearthdata.com/about/terms-of-use/" target="_blank" rel="noreferrer">Natural Earth · dominio público</a>. Las coordenadas son representativas de cada país.</p>
    <div className="crm-demo-paises">{[...paises].sort((a, b) => Number(b.impresiones) - Number(a.impresiones)).map((p) => <button disabled={ocupado} className="crm-boton" key={p.codigo} onClick={() => seleccionar(p.codigo)}><span>{p.nombre}</span><strong>{numero(p.impresiones)}</strong></button>)}</div>
  </section>;
}
