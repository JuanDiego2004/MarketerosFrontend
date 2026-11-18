// Datos sintéticos para explorar la interfaz. Nunca se envían al backend.
export function crearDemostracion(desde, hasta) {
  const campanas = [
    [1, "Horizonte de verano", "Lumina Studio", "Meta Ads", "ACTIVA", 24000],
    [
      2,
      "Conecta con lo extraordinario",
      "Nómada Travel",
      "Google Ads",
      "ACTIVA",
      18000,
    ],
    [3, "El siguiente paso", "Nova Education", "Google Ads", "ACTIVA", 12500],
    [4, "Una nueva forma de vivir", "Habita", "Meta Ads", "PAUSADA", 16000],
    [5, "Diseñado para ti", "Lumina Studio", "Email", "PLANIFICADA", 8000],
    [
      6,
      "Historias que conectan",
      "Nómada Travel",
      "Meta Ads",
      "FINALIZADA",
      14000,
    ],
  ].map(([idCampana, nombre, cliente, canal, estado, presupuesto]) => ({
    idCampana,
    nombre,
    cliente,
    idCliente: cliente,
    canal,
    idCanal: canal,
    estado,
    presupuesto,
    objetivo: "Captación y conversión",
    responsable: "Equipo de marketing",
    fechaInicio: desde,
    fechaFin: hasta,
  }));
  const ciudades = [
    [1, "Perú", "PE", "Lima", -12.0464, -77.0428, [1, 3, 4]],
    [2, "Colombia", "CO", "Bogotá", 4.711, -74.0721, [1, 2]],
    [3, "México", "MX", "Ciudad de México", 19.4326, -99.1332, [2, 3]],
    [4, "Chile", "CL", "Santiago", -33.4489, -70.6693, [1, 6]],
    [5, "Argentina", "AR", "Buenos Aires", -34.6037, -58.3816, [4, 6]],
    [6, "España", "ES", "Madrid", 40.4168, -3.7038, [2, 3]],
    [7, "Estados Unidos", "US", "Miami", 25.7617, -80.1918, [1, 2]],
    [8, "Francia", "FR", "París", 48.8566, 2.3522, [2, 6]],
    [9, "Brasil", "BR", "São Paulo", -23.5505, -46.6333, [4]],
  ];
  const ubicaciones = ciudades.flatMap(
    ([idUbicacion, pais, codigoPais, ciudad, latitud, longitud, ids]) =>
      ids.flatMap((idCampana) =>
        ["COBERTURA", "RESULTADOS"].map((vista) => ({
          idUbicacion,
          pais,
          codigoPais,
          ciudad,
          latitud,
          longitud,
          idCampana,
          vista,
        })),
      ),
  );
  const metricas = [],
    resultadosGeograficos = [];
  let fecha = new Date(`${desde}T12:00:00`),
    dia = 0;
  while (fecha.toISOString().slice(0, 10) <= hasta && dia < 367) {
    const valorFecha = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, "0")}-${String(fecha.getDate()).padStart(2, "0")}`;
    for (const c of campanas.filter((c) => c.estado !== "PLANIFICADA")) {
      const factor = c.idCampana * 11 + ((dia * 13) % 31);
      const metrica = {
        idMetrica: dia * 10 + c.idCampana,
        idCampana: c.idCampana,
        fecha: valorFecha,
        impresiones: factor * 217,
        clics: factor * 6,
        conversiones: factor,
        inversion: factor * 5,
        ingresos: factor * 21,
      };
      metricas.push(metrica);
      const lugares = ubicaciones.filter(
        (u) => u.idCampana === c.idCampana && u.vista === "RESULTADOS",
      );
      for (const lugar of lugares)
        resultadosGeograficos.push({
          ...metrica,
          idUbicacion: lugar.idUbicacion,
          impresiones: Math.floor(metrica.impresiones / lugares.length),
          clics: Math.floor(metrica.clics / lugares.length),
          conversiones: Math.floor(metrica.conversiones / lugares.length),
          inversion: metrica.inversion / lugares.length,
          ingresos: metrica.ingresos / lugares.length,
        });
    }
    fecha.setDate(fecha.getDate() + 1);
    dia++;
  }
  return {
    campanas,
    metricas,
    ubicaciones,
    resultadosGeograficos,
    geografiaDisponible: true,
    moneda: "PEN",
    fuente: "Datos de demostración",
    consultadoEn: new Date().toISOString(),
  };
}
