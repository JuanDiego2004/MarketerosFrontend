import { descargarCrm } from "./servicioCrm";
import {
  crearCsvPortal,
  COLUMNAS_REPORTE,
  descripcionFiltros,
  numero,
  resumir,
} from "../utils/analiticaPortal";

export async function exportarPortal(formato, datos, filtros, filas, signal) {
  if (signal?.aborted) return;
  const nombre = `resultados-demo-${filtros.desde}-${filtros.hasta}.${formato}`;
  if (formato === "csv") {
    descargarCrm(
      new Blob([crearCsvPortal(datos, filtros, filas)], {
        type: "text/csv;charset=utf-8",
      }),
      nombre,
    );
    return;
  }
  const [{ jsPDF }, { autoTable }] = await Promise.all([
    import("jspdf"),
    import("jspdf-autotable"),
  ]);
  if (signal?.aborted) return;
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  doc.setFontSize(18);
  doc.text("Resultados publicitarios", 14, 18);
  doc.setFontSize(11);
  doc.text(doc.splitTextToSize(datos.empresa.nombre, 265), 14, 26);
  doc.setTextColor(30, 90, 150);
  doc.text("Datos simulados · Mockaroo", 14, 34);
  doc.setTextColor(50);
  const contexto = doc.splitTextToSize(descripcionFiltros(filtros, datos), 265);
  doc.setFontSize(9);
  doc.text(contexto, 14, 42);
  const resumen = resumir(datos.registros);
  let y = 46 + contexto.length * 4;
  doc.text(
    `Impresiones: ${numero(resumen.impresiones)}    Clics: ${numero(resumen.clics)}    Conversiones publicitarias: ${numero(resumen.conversiones)}    CTR: ${numero(resumen.ctr, 2)}%`,
    14,
    y,
  );
  y += 6;
  for (const [moneda, m] of Object.entries(resumen.monedas)) {
    doc.text(
      `${moneda} · Inversión: ${numero(m.inversion, 2)} · Ingresos estimados: ${numero(m.ingresos_estimados, 2)} · CPC: ${numero(m.cpc, 2)} · CPM: ${numero(m.cpm, 2)}`,
      14,
      y,
    );
    y += 5;
  }
  const nota = doc.splitTextToSize(
    "Conversiones publicitarias no equivalen a ventas confirmadas. Alcance, ROAS e ROI no disponibles: faltan datos verificados. Importes separados por moneda.",
    265,
  );
  doc.text(nota, 14, y + 2);
  autoTable(doc, {
    startY: y + 6 + nota.length * 4,
    margin: { top: 16, bottom: 18 },
    head: [COLUMNAS_REPORTE.map(([, t]) => t)],
    body: filas.map((r) =>
      COLUMNAS_REPORTE.map(([k]) =>
        typeof r[k] === "number"
          ? numero(
              r[k],
              ["ctr", "cpc", "cpm", "inversion", "ingresos_estimados"].includes(
                k,
              )
                ? 2
                : 0,
            )
          : r[k],
      ),
    ),
    styles: { fontSize: 8, cellPadding: 2, overflow: "linebreak" },
    headStyles: { fillColor: [30, 82, 146] },
    didDrawPage: () => {
      doc.setFontSize(8);
      doc.setTextColor(85);
      doc.text(
        `Datos simulados · Mockaroo | ${doc.getNumberOfPages()}`,
        14,
        202,
      );
    },
  });
  if (!signal?.aborted) descargarCrm(doc.output("blob"), nombre);
}
