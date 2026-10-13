import {useState} from 'react'

import Spline from "@splinetool/react-spline";
import {motion, AnimatePresence} from "motion/react";
import LoginForm from "./LoginForm.jsx";
import RegistroForm from "./RegistroForm.jsx";



const PantallaLogin = () => {


    const [activeTab, setActiveTab] = useState("login")

    const tabs = [
        {id: 'login', name: 'Iniciar Sesión'},
        {id: 'register', name: 'Registro'},
    ];

    return (
        <div className="w-full h-screen relative flex justify-between items-center bg-black">

            <div className="relative h-screen w-[50%] overflow-hidden bg-black lg:w-[70%]">
                <div className="absolute inset-x-0 top-0 h-[calc(100%+110px)]">
                    <Spline scene="https://prod.spline.design/OqA4aJs2JGF-rfcB/scene.splinecode" />
                </div>
            </div>

            <div className={"w-[50%] lg:w-[30%] bg-black flex justify-center items-center"}>
                <div className={"w-[90%]"}>
                    <div
                        className="flex justify-between px-4 text-white">
                        {tabs.map((tab) => {
                            const activo = activeTab === tab.id;

                            return (
                                <button
                                    className={`w-[50%] border-b relative`}
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                >
                                    {activo && (
                                        <motion.span
                                            layoutId="tab-underline"
                                            className="absolute bottom-0 left-0 h-[3px] w-full bg-white-950"
                                            transition={{
                                                type: "spring",
                                                stiffness: 500,
                                                damping: 40,
                                                mass: 0.6,
                                            }}
                                        />
                                    )}
                                    <span className={`${activo ? "text-white font-medium" : "text-gray-300"} text-[17px]`}>
                                    {tab.name}
                               </span>
                                </button>
                            )
                        })}
                    </div>

                    <div className="mt-6 w-full relative">
                        <AnimatePresence mode="wait">
                            {activeTab === "login" ? (
                                <motion.div
                                    key="login"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    <LoginForm />
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="register"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    <RegistroForm />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>


            </div>

        </div>
    )
}

export default PantallaLogin
