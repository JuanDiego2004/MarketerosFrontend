import { Link } from "react-router-dom";

export default function SinAcceso() {
  return (
    <main className="min-h-screen bg-gray-950 p-8 text-white">
      <h1>No tienes permiso para acceder a esta sección.</h1>
      <Link className="mt-4 inline-block underline" to="/dashboard">
        Volver al dashboard
      </Link>
    </main>
  );
}
