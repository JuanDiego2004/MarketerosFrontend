const base = `${import.meta.env.VITE_API_URL}/api/crm`;

export async function solicitarCrm(
  ruta,
  token,
  { method = "GET", body, signal, archivo = false } = {},
) {
  const multipart = body instanceof FormData;
  let respuesta;
  try {
    respuesta = await fetch(`${base}${ruta}`, {
      method,
      signal,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(!multipart && body ? { "Content-Type": "application/json" } : {}),
      },
      body: body ? (multipart ? body : JSON.stringify(body)) : undefined,
    });
  } catch (error) {
    if (signal?.aborted || error.name === "AbortError") throw error;
    if (error instanceof TypeError)
      throw new Error("No se pudo conectar con el backend. Revisa la conexión y si el navegador o una extensión está bloqueando la solicitud.", { cause: error });
    throw error;
  }
  if (!respuesta.ok) {
    const error = await respuesta.json().catch(() => ({}));
    throw new Error(
      error.mensaje ||
        error.error?.mensaje ||
        `No se pudo completar la operación (${respuesta.status}).`,
    );
  }
  if (respuesta.status === 204) return null;
  return archivo ? respuesta.blob() : (await respuesta.json()).datos;
}

export function descargarCrm(blob, nombre) {
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement("a");
  enlace.href = url;
  enlace.download = nombre;
  enlace.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
