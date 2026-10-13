export default function PantallaModulo({ titulo, descripcion }) {
  return (
    <section className="mx-auto max-w-5xl text-white bg-transparent">
      <p className="mb-2 text-sm uppercase tracking-[0.2em] text-blue-300">Área de trabajo</p>
      <h1 className="text-3xl font-semibold">{titulo}</h1>
      <p className="mt-3 text-gray-400">{descripcion}</p>
      <div className="mt-8 rounded-xl border border-white/10 bg-white/5 p-6 text-gray-300">
        La pantalla del módulo ya está conectada a su ruta. Aquí puedes incorporar sus formularios,
        tablas y operaciones.
      </div>
    </section>
  )
}
