import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mail as Email, LockKeyhole as PrivateOutline } from "lucide-react";

import Input from "../../componentes/Input.jsx";
import { useAuth } from "../../contexto/ContextoAuth";
import { obtenerGrupoRol,GRUPOS_ROL } from "../../utils/roles";
import { iniciarSesion as autenticar } from "../../servicios/servicioAuth";

export default function LoginForm() {
  const navegar = useNavigate();
  const { guardarSesion } = useAuth();
  const [correo, setCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  async function iniciarSesion(evento) {
    evento.preventDefault();
    if (cargando) return;
    setError("");
    setCargando(true);

    try {
      const cuerpo = await autenticar(correo.trim(), contrasena);
      const datos = cuerpo.datos;
      guardarSesion(datos);
      navegar(obtenerGrupoRol(datos.usuario?.rol?.nombreRol)===GRUPOS_ROL.CLIENTE?"/portal":"/dashboard", { replace: true });
    } catch (errorPeticion) {
      setError(
        errorPeticion instanceof Error
          ? errorPeticion.message
          : "No se pudo iniciar sesión.",
      );
    } finally {
      setCargando(false);
    }
  }

  return (
    <form onSubmit={iniciarSesion}>
      <Input
        type="email"
        required
        value={correo}
        onChange={(evento) => setCorreo(evento.target.value)}
        label="INGRESE CORREO"
        Icono={Email}
        placeholder="Ingrese su correo..."
      />

      <Input
        type="password"
        required
        value={contrasena}
        onChange={(evento) => setContrasena(evento.target.value)}
        label="INGRESE CONTRASEÑA"
        Icono={PrivateOutline}
        placeholder="***************"
      />
      {error && (
        <p role="alert" className="mt-3 text-sm text-red-400">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={cargando}
        className="bg-white rounded-md text-gray-500 font-loxend px-2 py-2 w-full mt-4 font-medium hover:bg-gray-300 disabled:opacity-50"
      >
        {cargando ? "Iniciando sesión..." : "INGRESAR"}
      </button>
    </form>
  );
}
