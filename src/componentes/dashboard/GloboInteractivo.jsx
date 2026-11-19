import { useEffect, useCallback, useRef, useState, useMemo } from "react";
import Globe from "react-globe.gl";
import { MeshPhongMaterial } from "three";
import Supercluster from "supercluster";
import { COLORES_ESTADO } from "./datosMarketing";

const VACIO = [];
export default function GloboInteractivo({
  puntos = VACIO,
  seleccionado,
  alSeleccionar,
  reinicio,
  regiones = VACIO,
  regionSeleccionada,
  alSeleccionarRegion,
  temaClaro = false,
}) {
  const contenedor = useRef(null),
    globo = useRef(null);
  const [tamano, setTamano] = useState({ width: 600, height: 640 });
  const [zoom, setZoom] = useState(0);
  const [listo, setListo] = useState(false);
  const conectarGlobo = useCallback((instancia) => {
    globo.current = instancia;
    if (instancia) setListo(true);
  }, []);
  const material = useMemo(
    () =>
      temaClaro
        ? new MeshPhongMaterial({ color: "#e5effa", shininess: 8 })
        : null,
    [temaClaro],
  );
  useEffect(() => () => material?.dispose(), [material]);
  const centro = regiones.find(
    (r) => r.properties.iso === regionSeleccionada,
  )?.properties;
  const latRegion = centro?.lat,
    lngRegion = centro?.lng;
  useEffect(() => {
    if (!listo || !temaClaro || !globo.current) return;
    globo.current.pointOfView(
      latRegion != null
        ? { lat: latRegion, lng: lngRegion, altitude: 1.55 }
        : { lat: 8, lng: -55, altitude: 1.9 },
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 650,
    );
  }, [latRegion, lngRegion, listo, temaClaro, reinicio]);
  const indice = useMemo(
    () =>
      new Supercluster({ radius: 35, maxZoom: 8 }).load(
        puntos.map((punto, indicePunto) => ({
          type: "Feature",
          geometry: { type: "Point", coordinates: [punto.lng, punto.lat] },
          properties: { indicePunto },
        })),
      ),
    [puntos],
  );
  const marcadores = useMemo(
    () =>
      indice.getClusters([-180, -90, 180, 90], zoom).map((feature) => {
        const hojas = feature.properties.cluster
          ? indice.getLeaves(feature.properties.cluster_id, Infinity)
          : [feature];
        const lugares = hojas.map(
          (hoja) => puntos[hoja.properties.indicePunto],
        );
        const campanas = [
          ...new Map(
            lugares
              .flatMap((p) => p.campanas)
              .map((c) => [String(c.idCampana), c]),
          ).values(),
        ];
        return {
          lat: feature.geometry.coordinates[1],
          lng: feature.geometry.coordinates[0],
          lugares,
          campanas,
          cluster: feature.properties.cluster,
          clusterId: feature.properties.cluster_id,
          impresiones: lugares.reduce((s, p) => s + p.impresiones, 0),
          color:
            campanas.length === 1
              ? COLORES_ESTADO[campanas[0].estado]
              : "#527f8b",
        };
      }),
    [indice, puntos, zoom],
  );

  useEffect(() => {
    const observer = new ResizeObserver(([entry]) =>
      setTamano({
        width: entry.contentRect.width,
        height: entry.contentRect.height,
      }),
    );
    observer.observe(contenedor.current);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    if (!listo || !globo.current) return;
    const instancia = globo.current;
    instancia.controls().autoRotate = false;
    instancia.controls().enablePan = false;
    instancia.controls().minDistance = 110;
    instancia.controls().maxDistance = 480;
    instancia.renderer().setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  }, [listo]);
  useEffect(() => {
    if (!listo || !globo.current || temaClaro) return;
    const punto = puntos.find((p) =>
      p.campanas.some((c) => String(c.idCampana) === String(seleccionado)),
    );
    globo.current.pointOfView(
      punto
        ? { lat: punto.lat, lng: punto.lng, altitude: 1.4 }
        : { lat: 8, lng: -55, altitude: 1.85 },
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 700,
    );
  }, [seleccionado, reinicio, listo, puntos, temaClaro]);
  useEffect(() => {
    if (!listo) return;
    const elemento = contenedor.current;
    const instancia = globo.current;
    const controles = instancia.controls();
    let visible = true;
    let arrastrando = false;
    let pausa;
    function actualizar() {
      clearTimeout(pausa);
      if (visible && !document.hidden) {
        instancia.resumeAnimation();
        // La cartografía es estática: no consumir GPU mientras no se interactúa.
        if (temaClaro && !arrastrando)
          pausa = setTimeout(() => instancia.pauseAnimation(), 1200);
      } else instancia.pauseAnimation();
    }
    function comenzar() {
      arrastrando = true;
      actualizar();
    }
    function terminar() {
      arrastrando = false;
      actualizar();
    }
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      actualizar();
    });
    observer.observe(elemento);
    document.addEventListener("visibilitychange", actualizar);
    if (temaClaro) {
      elemento.addEventListener("pointermove", actualizar);
      elemento.addEventListener("wheel", actualizar, { passive: true });
      controles.addEventListener("start", comenzar);
      controles.addEventListener("end", terminar);
    }
    actualizar();
    return () => {
      clearTimeout(pausa);
      observer.disconnect();
      document.removeEventListener("visibilitychange", actualizar);
      elemento.removeEventListener("pointermove", actualizar);
      elemento.removeEventListener("wheel", actualizar);
      controles.removeEventListener("start", comenzar);
      controles.removeEventListener("end", terminar);
    };
  }, [
    listo,
    temaClaro,
    regiones,
    regionSeleccionada,
    tamano.width,
    tamano.height,
  ]);

  function seleccionar(punto) {
    if (punto.cluster) {
      const proximoZoom = Math.min(
        8,
        indice.getClusterExpansionZoom(punto.clusterId),
      );
      globo.current.pointOfView(
        {
          lat: punto.lat,
          lng: punto.lng,
          altitude: Math.max(0.12, 3 / 2 ** proximoZoom),
        },
        650,
      );
    }
    alSeleccionar?.(punto);
  }
  function etiqueta(punto) {
    const texto = document.createElement("div");
    texto.className = "marketing-tooltip";
    texto.textContent = `${punto.lugares.map((p) => p.ciudad || p.pais).join(" · ")} · ${punto.campanas.length} campaña(s)`;
    return texto;
  }
  return (
    <div
      data-listo={listo}
      ref={contenedor}
      className="marketing-globo-canvas"
      aria-label={
        temaClaro
          ? "Globo de resultados por país. Usa también el filtro País o la tabla."
          : "Globo de campañas. Selección accesible disponible en la lista de campañas."
      }
    >
      <Globe
        ref={conectarGlobo}
        {...tamano}
        backgroundColor="rgba(0,0,0,0)"
        globeImageUrl={temaClaro ? undefined : "/mapa/earth-blue-marble.jpg"}
        {...(material ? { globeMaterial: material } : {})}
        polygonsData={regiones}
        polygonCapCurvatureResolution={7}
        polygonCapColor={(r) => r.properties.color}
        polygonSideColor={() => "#c8d7e9"}
        polygonStrokeColor={(r) =>
          r.properties.iso === regionSeleccionada ? "#132f60" : "#ffffff"
        }
        polygonAltitude={(r) =>
          r.properties.iso === regionSeleccionada ? 0.018 : 0.004
        }
        polygonsTransitionDuration={0}
        polygonLabel={(r) => {
          const texto = document.createElement("div");
          texto.className = "marketing-tooltip";
          texto.textContent = r.properties.tooltip;
          return texto;
        }}
        onPolygonClick={(r) => {
          if (r.properties.conDatos) alSeleccionarRegion?.(r.properties.iso);
        }}
        atmosphereColor="#c6e4df"
        atmosphereAltitude={0.12}
        animateIn={false}
        rendererConfig={{ antialias: true, alpha: true }}
        pointsData={marcadores}
        pointLat="lat"
        pointLng="lng"
        pointColor="color"
        pointLabel={etiqueta}
        pointAltitude={0.008}
        pointResolution={12}
        pointsTransitionDuration={0}
        pointRadius={(p) =>
          Math.min(
            1.8,
            0.65 +
              Math.sqrt(p.campanas.length) * 0.25 +
              Math.log10(1 + p.impresiones) * 0.08,
          )
        }
        onPointClick={seleccionar}
        labelsData={marcadores.filter((p) => p.campanas.length > 1)}
        labelLat="lat"
        labelLng="lng"
        labelText={(p) => String(p.campanas.length)}
        labelSize={2.2}
        labelIncludeDot={false}
        labelAltitude={0.025}
        labelColor={() => "#ffffff"}
        labelDotRadius={0}
        onLabelClick={seleccionar}
        onZoom={({ altitude }) =>
          setZoom(
            Math.max(
              0,
              Math.min(8, Math.round(Math.log2(3 / Math.max(altitude, 0.01)))),
            ),
          )
        }
      />
      <span className="marketing-globo-credito">
        {temaClaro
          ? "Geografía · Natural Earth"
          : "Textura terrestre · NASA / Blue Marble"}
      </span>
    </div>
  );
}
