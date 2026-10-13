import TablaGlass from '../../componentes/tablaGlass/TablaGlass.jsx'
import { motion, AnimatePresence } from "motion/react"; // <-- FALTABA motion aquí
import { useState } from "react";
import Loader from "../../componentes/Loader.jsx";

const variantes = {
  cerrado: {
    X: 500,
    opacity: 0,
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 40
    }
  },
  abierto: {
    x: 0,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 500,
      damping: 40
    }
  }
}

export default function ClientesCanalesAdministrador() {
  const [abierto, setAbierto] = useState(false);


  return (
      <div className="flex flex-col gap-5 relative">
        <div className={"flex justify-between items-center"}>
          <h2 className="font-jakarta text-[28px] font-medium">Clientes</h2>

          <button
              onClick={() => setAbierto(!abierto)}
              className={"rounded-md bg-black/60 backdrop-blur-2xl text-white px-2 py-2"}
          >
            Agregar
          </button>

        </div>


       <div className={"absolute top-[-40px] right-[-30px] bg-green-600 h-screen"}>
         <AnimatePresence>
           {abierto && (
               <motion.div
                   initial="cerrado"
                   animate="abierto"
                   exit="cerrado"
                   variants={variantes}
                   className={"w-[300px]"}
               >
                 <h2>Jusandndndndu</h2>

                 <button
                     onClick={() => setAbierto(!abierto)}
                     className={"rounded-md bg-black/60 backdrop-blur-2xl text-white px-2 py-2"}
                 >
                   cerrar
                 </button>
               </motion.div>
           )}
         </AnimatePresence>
       </div>

        <Loader
            size={72}
            color="#38BDF8"
            label="Cargando eventos..."
        />

      </div>
  )
}