const API_URL = import.meta.env.VITE_API_URL?.replace(/\/+$/, "");
const CLAVE_SESION = "sesionAgencia";

async function enviarSolicitud(ruta, cuerpo) {
  if (!API_URL) throw new Error("Falta configurar la dirección del backend (VITE_API_URL).");
  const control = new AbortController();
  const espera = setTimeout(() => control.abort(), 60000);
  try {
  const respuesta = await fetch(`${API_URL}${ruta}`, {
    method: "POST",
    signal: control.signal,
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(cuerpo),
  });
  const texto = await respuesta.text();
  let resultado = {};
  if (texto) {
    try {
      resultado = JSON.parse(texto);
    } catch {
      resultado = { mensaje: "El backend devolvió una respuesta inválida. Intenta nuevamente." };
    }
  }
  if (!respuesta.ok || !resultado.exito) {
    throw new Error(
      resultado.error?.mensaje ||
        resultado.mensaje ||
        `Error HTTP ${respuesta.status}`,
    );
  }
  return resultado;
  } catch (error) {
    if (control.signal.aborted) throw new Error("El servidor tardó demasiado en responder. Intenta iniciar sesión nuevamente.", { cause: error });
    if (error instanceof TypeError) throw new Error("No se pudo conectar con el backend. Revisa tu conexión e intenta nuevamente.", { cause: error });
    throw error;
  } finally {
    clearTimeout(espera);
  }
}

export const iniciarSesion = (correo, contrasena) =>
  enviarSolicitud("/auth/login", { correo, contrasena });

export const registrarUsuario = (nombres, correo, contrasena) =>
  enviarSolicitud("/auth/registro", { nombres, correo, password: contrasena });

export const cerrarSesion = async () => {
  localStorage.removeItem(CLAVE_SESION);
  return { error: null };
};

export const obtenerSesion = async () => {
  try {
    const sesion = JSON.parse(localStorage.getItem(CLAVE_SESION) || "null");
    if (!sesion?.token || Date.parse(sesion.fechaExpiracion) <= Date.now()) {
      localStorage.removeItem(CLAVE_SESION);
      return { sesion: null, error: null };
    }
    return { sesion, error: null };
  } catch (error) {
    return { sesion: null, error };
  }
};
