import { useEffect, useCallback, useRef, useState, useMemo } from "react";
import { Minus, Pause, Play, Plus, RotateCcw } from "lucide-react";
import Globe from "react-globe.gl";
import { MeshPhongMaterial } from "three";
import Supercluster from "supercluster";
import { COLORES_ESTADO } from "./datosMarketing";
import { distribuirSenales } from "./senalesGlobo";

const VACIO = [];
export default function GloboInteractivo({
  puntos = VACIO,
  seleccionado,
  alSeleccionar,
  reinicio,
  regiones = VACIO,
  modoPaises = false,
  regionSeleccionada,
  alSeleccionarRegion,
  alRestablecer,
  temaClaro = true,
}) {
  const contenedor = useRef(null),
    globo = useRef(null),
    arrastrando = useRef(false);
  const zonasPaneles = useRef([]);
  const cajasSenales = useRef({ fotograma: -1, cajas: new Map() });
  const [tamano, setTamano] = useState({ width: 900, height: 780 });
  const [zoom, setZoom] = useState(0),
    [listo, setListo] = useState(false);
  const [movimientoReducido, setMovimientoReducido] = useState(
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const [girando, setGirando] = useState(
    () => !window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const conectarGlobo = useCallback((instancia) => {
    globo.current = instancia;
    if (instancia) setListo(true);
  }, []);
  const material = useMemo(
    () =>
      temaClaro
        ? new MeshPhongMaterial({ color: "#dbeaf6", shininess: 5 })
        : null,
    [temaClaro],
  );
  useEffect(() => () => material?.dispose(), [material]);
  useEffect(() => {
    const preferencia = window.matchMedia("(prefers-reduced-motion: reduce)");
    const cambiar = () => {
      setMovimientoReducido(preferencia.matches);
      if (preferencia.matches) setGirando(false);
    };
    preferencia.addEventListener("change", cambiar);
    // La preferencia puede cambiar entre el primer render y la suscripción.
    cambiar();
    return () => preferencia.removeEventListener("change", cambiar);
  }, []);
  useEffect(() => {
    const observer = new ResizeObserver(([entry]) =>
      setTamano({
        width: Math.max(1, entry.contentRect.width),
        height: Math.max(1, entry.contentRect.height),
      }),
    );
    observer.observe(contenedor.current);
    return () => observer.disconnect();
  }, []);
  const movil = tamano.width < 650;
  const focoPais = regiones.find(
    (r) => r.properties.iso === regionSeleccionada,
  )?.properties;
  const focoCampana = puntos.find((p) =>
    p.campanas.some((c) => String(c.idCampana) === String(seleccionado)),
  );
  const foco = modoPaises
    ? regionSeleccionada
      ? focoPais
      : null
    : focoCampana;
  const latFoco = foco?.lat,
    lngFoco = foco?.lng;
  useEffect(() => {
    if (!listo || !globo.current) return;
    const enfocado = latFoco != null && lngFoco != null;
    if (enfocado || movimientoReducido) setGirando(false);
    globo.current.pointOfView(
      {
        lat: enfocado ? latFoco : 8,
        lng: enfocado ? lngFoco : -55,
        altitude: enfocado ? (movil ? 2.1 : 1.1) : movil ? 2.8 : 1.45,
      },
      0,
    );
    globo.current.controls().update();
    contenedor.current.dispatchEvent(new Event("globo-actualizar"));
  }, [listo, latFoco, lngFoco, reinicio, movil, movimientoReducido]);
  useEffect(() => {
    if (!listo) return;
    const instancia = globo.current,
      controles = instancia.controls();
    controles.enablePan = false;
    controles.minDistance = 118;
    controles.maxDistance = 520;
    controles.autoRotateSpeed = 0.55;
  }, [listo]);
  useEffect(() => {
    if (!listo) return;
    const instancia = globo.current,
      controles = instancia.controls(),
      elemento = contenedor.current;
    const escenario = elemento.closest(".escena-globo");
    function medirPaneles() {
      if (!escenario) return;
      const origen = elemento.getBoundingClientRect();
      zonasPaneles.current = [
        ...escenario.querySelectorAll(
          ".globo-panel-contenido, .globo-panel-toggle, .globo-controles, .portal-mapa-cabecera, .marketing-mapa-titulo, .portal-pais-detalle, .portal-leyenda",
        ),
      ]
        .map((e) => e.getBoundingClientRect())
        .filter((r) => r.width && r.height)
        .map((r) => ({
          x: r.x - origen.x,
          y: r.y - origen.y,
          width: r.width,
          height: r.height,
        }));
    }
    let visible = true,
      pausa;
    const pixeles = Math.max(1, tamano.width * tamano.height);
    const densidadMovimiento = Math.min(
      window.devicePixelRatio,
      1,
      Math.sqrt(500000 / pixeles),
    );
    const densidadReposo = Math.min(
      window.devicePixelRatio,
      1.25,
      Math.sqrt(1200000 / pixeles),
    );
    function densidad(valor) {
      if (Math.abs(instancia.renderer().getPixelRatio() - valor) > 0.01)
        instancia.renderer().setPixelRatio(valor);
    }
    function detener() {
      instancia.pauseAnimation();
    }
    function arrancar() {
      densidad(densidadMovimiento);
      instancia.resumeAnimation();
    }
    function suspenderCuandoEsteDibujado(primerFotograma) {
      // En equipos lentos, completar el cambio de cámara antes de suspender.
      if (instancia.renderer().info.render.frame - primerFotograma < 3) {
        pausa = setTimeout(
          () => suspenderCuandoEsteDibujado(primerFotograma),
          200,
        );
        return;
      }
      detener();
      densidad(densidadReposo);
      instancia.resumeAnimation();
      instancia.pauseAnimation();
      elemento.dataset.renderizando = "false";
    }
    function actualizar() {
      clearTimeout(pausa);
      const activo = visible && !document.hidden;
      controles.autoRotate = activo && girando && !movimientoReducido;
      elemento.dataset.renderizando = String(activo);
      if (activo) {
        const primerFotograma = instancia.renderer().info.render.frame;
        arrancar();
        if (!controles.autoRotate && !arrastrando.current)
          pausa = setTimeout(
            () => suspenderCuandoEsteDibujado(primerFotograma),
            1300,
          );
      } else detener();
    }
    function comenzar() {
      arrastrando.current = true;
      setGirando(false);
      actualizar();
    }
    function terminar() {
      arrastrando.current = false;
      actualizar();
    }
    function cambiarPaneles() {
      medirPaneles();
      actualizar();
    }
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      actualizar();
    });
    observer.observe(elemento);
    document.addEventListener("visibilitychange", actualizar);
    elemento.addEventListener("pointermove", actualizar);
    elemento.addEventListener("wheel", actualizar, { passive: true });
    elemento.addEventListener("globo-actualizar", actualizar);
    controles.addEventListener("start", comenzar);
    controles.addEventListener("end", terminar);
    escenario?.addEventListener("globo-panel-cambio", cambiarPaneles);
    medirPaneles();
    actualizar();
    return () => {
      clearTimeout(pausa);
      detener();
      observer.disconnect();
      controles.autoRotate = false;
      document.removeEventListener("visibilitychange", actualizar);
      elemento.removeEventListener("pointermove", actualizar);
      elemento.removeEventListener("wheel", actualizar);
      elemento.removeEventListener("globo-actualizar", actualizar);
      controles.removeEventListener("start", comenzar);
      controles.removeEventListener("end", terminar);
      escenario?.removeEventListener("globo-panel-cambio", cambiarPaneles);
    };
  }, [
    listo,
    girando,
    movimientoReducido,
    regiones,
    puntos,
    regionSeleccionada,
    seleccionado,
    tamano.width,
    tamano.height,
  ]);

  const indice = useMemo(
    () =>
      new Supercluster({ radius: 35, maxZoom: 8 }).load(
        puntos.map((p, i) => ({
          type: "Feature",
          geometry: { type: "Point", coordinates: [p.lng, p.lat] },
          properties: { indicePunto: i },
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
          impresiones: lugares.reduce(
            (s, p) => s + Number(p.impresiones || 0),
            0,
          ),
          color:
            campanas.length === 1
              ? COLORES_ESTADO[campanas[0].estado]
              : "#3474b5",
        };
      }),
    [indice, puntos, zoom],
  );
  const senales = useMemo(
    () =>
      distribuirSenales(
        modoPaises
          ? regiones
              .filter((r) => r.properties.conDatos)
              .map((r) => ({
                clave: `pais:${r.properties.iso}`,
                tipo: "pais",
                iso: r.properties.iso,
                lat: r.properties.lat,
                lng: r.properties.lng,
                titulo: r.properties.nombre,
                detalle: r.properties.etiquetaValor || "Ver resultados",
                valor: r.properties.valor || 0,
                seleccionada: r.properties.iso === regionSeleccionada,
                tooltip: r.properties.tooltip,
              }))
          : marcadores.map((p) => ({
              clave: p.lugares
                .map((l) => `${l.lat},${l.lng}`)
                .sort()
                .join("|"),
              tipo: "campanas",
              punto: p,
              lat: p.lat,
              lng: p.lng,
              titulo: p.lugares[0].ciudad || p.lugares[0].pais,
              detalle:
                p.campanas.length === 1
                  ? p.campanas[0].nombre || "1 campaña"
                  : `${p.campanas.length} campañas`,
              valor: p.impresiones || p.campanas.length,
              seleccionada: p.campanas.some(
                (c) => String(c.idCampana) === String(seleccionado),
              ),
              tooltip: `${p.lugares.map((l) => l.ciudad || l.pais).join(" · ")} · ${p.campanas.length} campaña(s)`,
            })),
        movil ? 9 : 16,
      ),
    [modoPaises, regiones, marcadores, regionSeleccionada, seleccionado, movil],
  );

  function seleccionarPunto(punto) {
    setGirando(false);
    if (punto.cluster) {
      const nivel = Math.min(
        8,
        indice.getClusterExpansionZoom(punto.clusterId),
      );
      globo.current.pointOfView(
        {
          lat: punto.lat,
          lng: punto.lng,
          altitude: Math.max(0.25, 3 / 2 ** nivel),
        },
        0,
      );
    }
    alSeleccionar?.(punto);
  }
  const crearSenal = useCallback(
    (senal) => {
      const elemento = document.createElement("div");
      elemento.className = "globo-senal";
      elemento.dataset.lado = senal.lado;
      elemento.dataset.clave = senal.clave;
      elemento.dataset.lat = String(senal.lat);
      elemento.dataset.lng = String(senal.lng);
      elemento.dataset.seleccionada = String(senal.seleccionada);
      if (senal.iso) elemento.dataset.pais = senal.iso;
      const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      svg.setAttribute("viewBox", "-4 0 160 72");
      svg.setAttribute("aria-hidden", "true");
      svg.classList.add("globo-senal-linea");
      const linea = document.createElementNS(svg.namespaceURI, "path");
      linea.setAttribute("d", "M0 65 L28 12 L147 12");
      linea.setAttribute("fill", "none");
      linea.setAttribute("stroke", "#4d83bf");
      linea.setAttribute("stroke-width", "1.2");
      const punta = document.createElementNS(svg.namespaceURI, "path");
      punta.setAttribute("d", "M0 65 L2 54 L10 59 Z");
      punta.setAttribute("fill", "#2868b2");
      svg.append(linea, punta);
      const boton = document.createElement("button");
      boton.type = "button";
      boton.title = senal.tooltip;
      boton.setAttribute(
        "aria-label",
        senal.tipo === "pais"
          ? `Ver resultados de ${senal.titulo}`
          : `Ver campañas en ${senal.titulo}`,
      );
      const nombre = document.createElement("strong"),
        detalle = document.createElement("small");
      nombre.textContent = senal.titulo;
      detalle.textContent = senal.detalle;
      boton.append(nombre, detalle);
      boton.addEventListener("pointerdown", (e) => e.stopPropagation());
      boton.addEventListener("pointerenter", () => setGirando(false));
      boton.addEventListener("focus", () => setGirando(false));
      boton.addEventListener("click", (e) => {
        e.stopPropagation();
        setGirando(false);
        if (senal.tipo === "pais") alSeleccionarRegion?.(senal.iso);
        else seleccionarPunto(senal.punto);
      });
      elemento.append(svg, boton);
      return elemento;
    },
    [alSeleccionarRegion, alSeleccionar, indice, movimientoReducido],
  );
  function etiquetaPunto(punto) {
    const texto = document.createElement("div");
    texto.className = "marketing-tooltip";
    texto.textContent = `${punto.lugares.map((p) => p.ciudad || p.pais).join(" · ")} · ${punto.campanas.length} campaña(s)`;
    return texto;
  }
  function acercar(factor) {
    setGirando(false);
    const posicion = globo.current.pointOfView();
    globo.current.resumeAnimation();
    globo.current.pointOfView(
      {
        ...posicion,
        altitude: Math.max(0.2, Math.min(4.2, posicion.altitude * factor)),
      },
      0,
    );
    globo.current.controls().update();
    contenedor.current.dispatchEvent(new Event("globo-actualizar"));
  }
  function restablecer() {
    alRestablecer?.();
    globo.current.resumeAnimation();
    globo.current.pointOfView(
      { lat: 8, lng: -55, altitude: movil ? 2.8 : 1.45 },
      0,
    );
    globo.current.controls().update();
    contenedor.current.dispatchEvent(new Event("globo-actualizar"));
  }
  return (
    <div
      ref={contenedor}
      className="marketing-globo-canvas"
      data-listo={listo}
      data-girando={girando && !movimientoReducido}
      data-modo={modoPaises ? "paises" : "campanas"}
      aria-label={
        modoPaises
          ? "Globo de resultados por país. También puedes utilizar el filtro País y la tabla."
          : "Globo de campañas. También puedes utilizar la lista de campañas."
      }
    >
      <Globe
        ref={conectarGlobo}
        onGlobeReady={() =>
          contenedor.current?.dispatchEvent(new Event("globo-actualizar"))
        }
        {...tamano}
        backgroundColor="rgba(0,0,0,0)"
        globeImageUrl={temaClaro ? undefined : "/mapa/earth-blue-marble.jpg"}
        {...(material ? { globeMaterial: material } : {})}
        polygonsData={regiones}
        polygonCapCurvatureResolution={7}
        polygonCapColor={(r) => r.properties.color || "#e9eff5"}
        polygonSideColor={() => "#cbddeb"}
        polygonStrokeColor={(r) =>
          modoPaises && r.properties.iso === regionSeleccionada
            ? "#205a9e"
            : "#ffffff"
        }
        polygonAltitude={(r) =>
          modoPaises && r.properties.iso === regionSeleccionada ? 0.014 : 0.003
        }
        polygonsTransitionDuration={0}
        polygonLabel={(r) => {
          const texto = document.createElement("div");
          texto.className = "marketing-tooltip";
          texto.textContent = r.properties.tooltip || r.properties.nombre;
          return texto;
        }}
        onPolygonClick={(r) => {
          if (modoPaises && r.properties.conDatos) {
            setGirando(false);
            alSeleccionarRegion?.(r.properties.iso);
          }
        }}
        atmosphereColor="#c2e0f6"
        atmosphereAltitude={0.1}
        animateIn={false}
        rendererConfig={{ antialias: true, alpha: true }}
        pointsData={marcadores}
        pointLat="lat"
        pointLng="lng"
        pointColor="color"
        pointLabel={etiquetaPunto}
        pointAltitude={0.01}
        pointResolution={10}
        pointsTransitionDuration={0}
        pointRadius={(p) =>
          Math.min(
            1.6,
            0.55 +
              Math.sqrt(p.campanas.length) * 0.2 +
              Math.log10(1 + p.impresiones) * 0.06,
          )
        }
        onPointClick={seleccionarPunto}
        htmlElementsData={senales}
        htmlLat="lat"
        htmlLng="lng"
        htmlAltitude={0.012}
        htmlElement={crearSenal}
        htmlTransitionDuration={0}
        htmlElementVisibilityModifier={(elemento, visible) => {
          const fotograma = globo.current?.renderer().info.render.frame;
          if (cajasSenales.current.fotograma !== fotograma) {
            cajasSenales.current = { fotograma, cajas: new Map() };
          }
          const cajas = cajasSenales.current.cajas;
          cajas.delete(elemento.dataset.clave);
          let mostrar = visible;
          if (mostrar && globo.current) {
            globo.current.camera().updateMatrixWorld();
            const posicion = globo.current.getScreenCoords(
              Number(elemento.dataset.lat),
              Number(elemento.dataset.lng),
              0.012,
            );
            const derecha = posicion.x < tamano.width / 2;
            elemento.dataset.lado = derecha ? "derecho" : "izquierdo";
            const ancho = movil ? 140 : 165,
              alto = movil ? 48 : 55,
              distancia = movil ? 16 : 25;
            const caja = {
              x: posicion.x + (derecha ? distancia : -distancia - ancho),
              y: posicion.y - (movil ? 36 : 55) - alto,
              width: ancho,
              height: alto,
            };
            mostrar =
              caja.x >= 4 &&
              caja.x + caja.width <= tamano.width - 4 &&
              caja.y >= 4 &&
              caja.y + caja.height <= tamano.height - 4 &&
              !zonasPaneles.current.some(
                (z) =>
                  caja.x < z.x + z.width &&
                  caja.x + caja.width > z.x &&
                  caja.y < z.y + z.height &&
                  caja.y + caja.height > z.y,
              );
            if (mostrar) {
              mostrar = ![...cajas.values()].some(
                (z) =>
                  caja.x < z.x + z.width + 4 &&
                  caja.x + caja.width + 4 > z.x &&
                  caja.y < z.y + z.height + 4 &&
                  caja.y + caja.height + 4 > z.y,
              );
              if (mostrar) cajas.set(elemento.dataset.clave, caja);
            }
          }
          elemento.style.display = mostrar ? "" : "none";
          // CSS2DRenderer administra display en cada dibujo; visibility conserva la oclusión.
          elemento.style.visibility = mostrar ? "visible" : "hidden";
          elemento.dataset.visible = String(mostrar);
          elemento.querySelector("button").tabIndex = mostrar ? 0 : -1;
        }}
        onZoom={({ altitude, lng }) => {
          if (contenedor.current) {
            contenedor.current.dataset.altitud = altitude.toFixed(3);
            contenedor.current.dataset.longitud = lng.toFixed(3);
          }
          setZoom(
            Math.max(
              0,
              Math.min(8, Math.round(Math.log2(3 / Math.max(altitude, 0.01)))),
            ),
          );
        }}
      />
      <div
        className="globo-controles"
        role="group"
        aria-label="Controles del globo"
      >
        <button
          type="button"
          className="globo-giro-boton"
          disabled={!listo || movimientoReducido}
          aria-label={
            movimientoReducido
              ? "Rotación pausada por movimiento reducido"
              : girando
                ? "Pausar rotación"
                : "Reanudar rotación"
          }
          aria-pressed={girando && !movimientoReducido}
          onClick={() => setGirando((v) => !v)}
        >
          {girando && !movimientoReducido ? (
            <Pause size={15} />
          ) : (
            <Play size={15} />
          )}
          <span>
            {movimientoReducido
              ? "Giro en pausa"
              : girando
                ? "Pausar giro"
                : "Reanudar giro"}
          </span>
        </button>
        <button
          type="button"
          disabled={!listo}
          aria-label="Acercar globo"
          onClick={() => acercar(0.78)}
        >
          <Plus size={18} />
        </button>
        <button
          type="button"
          disabled={!listo}
          aria-label="Alejar globo"
          onClick={() => acercar(1.28)}
        >
          <Minus size={18} />
        </button>
        <button
          type="button"
          disabled={!listo}
          aria-label="Restablecer vista del globo"
          onClick={restablecer}
        >
          <RotateCcw size={16} />
        </button>
      </div>
      <span className="marketing-globo-credito">
        {temaClaro
          ? "Geografía · Natural Earth"
          : "Textura terrestre · NASA / Blue Marble"}
      </span>
    </div>
  );
}
