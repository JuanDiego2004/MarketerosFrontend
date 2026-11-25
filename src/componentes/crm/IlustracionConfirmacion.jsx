import { Check, ShieldCheck, Trash2 } from "lucide-react";

// Ilustraciones vectoriales locales: no necesitan descargas ni recursos externos.
export default function IlustracionConfirmacion({ tipo }) {
  const correo = tipo === "correo";
  const peligro = tipo === "peligro";
  const Icono = peligro ? Trash2 : tipo === "seguridad" ? ShieldCheck : Check;
  return <svg className="dialogo-ilustracion" viewBox="0 0 280 150" fill="none" aria-hidden="true" focusable="false">
    <ellipse cx="143" cy="135" rx="106" ry="9" fill={peligro ? "#fff0f1" : "#eef5ff"} />
    <circle cx="140" cy="78" r="62" fill={peligro ? "#fff4f3" : "#f1f7ff"} />
    <circle cx="54" cy="54" r="5" fill={peligro ? "#ffd0d5" : "#cfe6ff"} />
    <circle cx="223" cy="68" r="4" fill={peligro ? "#ffccd3" : "#bddbfb"} />
    <path d="M58 113c-14-3-18-11-18-22 14 2 20 9 18 22Zm4 13c-1-14 5-22 17-24 1 13-6 21-17 24Z" fill="#afdcd2" />
    <path d="M226 133v-26m0 10c-12-4-17-10-16-22 13 1 18 9 16 22Zm0-6c0-14 6-22 18-25 2 13-4 22-18 25Z" stroke="#65bda7" strokeWidth="3" strokeLinecap="round" />
    {correo ? <>
      <path d="m90 73 54-38 55 38v58H90V73Z" fill="#77b7f3" />
      <rect x="106" y="43" width="79" height="69" rx="7" fill="white" stroke="#a4d2f6" strokeWidth="2" />
      <path d="M120 60h50m-50 12h44m-44 12h29" stroke="#9dc7e9" strokeWidth="4" strokeLinecap="round" />
      <path d="m90 75 54 37 55-37v54H90V75Z" fill="#a5d2f6" />
      <path d="m90 130 49-36a9 9 0 0 1 11 0l49 36" fill="#8fc5f2" />
      <path d="m187 19 51-12-21 34-9-17-21-5Z" fill="#73b8ee" />
      <path d="m208 24 30-17-24 24" fill="#4499dd" />
      <path d="M104 44c-22-12-10-37 7-23 19 19-23 22-39 32" stroke="#afcee8" strokeWidth="1.5" strokeDasharray="4 5" strokeLinecap="round" />
      <path d="M67 74c-5-14-2-30 11-31 15-2 19 12 15 26l-26 5Z" fill="#253b5d" />
      <circle cx="81" cy="59" r="9" fill="#f2c9b4" />
      <path d="M64 99c0-18 6-29 17-29 12 0 19 11 20 29l-37 1Z" fill="#64b5ec" />
      <path d="M74 89 88 98l15-3" stroke="#efc2ac" strokeWidth="6" strokeLinecap="round" />
      <path d="m73 99 35 6-4 25H62c-7-15-2-27 11-31Z" fill="#243d65" />
      <path d="m85 88 24-2-5 20H82l3-18Z" fill="#234577" />
      <circle cx="96" cy="95" r="2" fill="#a9d6f4" />
    </> : <>
      <path d="M101 34h61l23 23v68a9 9 0 0 1-9 9h-75a9 9 0 0 1-9-9V43a9 9 0 0 1 9-9Z" fill="white" stroke={peligro ? "#f5bcc4" : "#b5d5f7"} strokeWidth="2" />
      <path d="M162 34v17a7 7 0 0 0 7 7h16" stroke={peligro ? "#f5bcc4" : "#b5d5f7"} strokeWidth="2" />
      <path d="M108 58h33m-33 14h55m-55 13h35" stroke={peligro ? "#f6d9de" : "#d7e8fa"} strokeWidth="5" strokeLinecap="round" />
      <circle cx="178" cy="105" r="31" fill={peligro ? "#fff0f2" : "#e6f1ff"} stroke="white" strokeWidth="5" />
      <Icono x="164" y="91" width="28" height="28" color={peligro ? "#d25069" : "#387acb"} strokeWidth="1.7" />
      <path d="m76 30 2 6 6 2-6 2-2 6-2-6-6-2 6-2 2-6Z" fill={peligro ? "#e8b9c2" : "#b0ceef"} />
    </>}
  </svg>;
}
