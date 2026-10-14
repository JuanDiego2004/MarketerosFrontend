import Person from "supercons/Person";
import Notification from "supercons/Notification";
import {useState} from "react";
import {motion} from "motion/react";

export default function Header() {
    const [activo, setActivo] = useState(false);

    return (
        <header className="relative h-10 w-full bg-transparent">
            <div className="absolute left-0 top-0 h-[10px] w-[80%] xl:w-[90%] bg-black" />

            <div
                className="absolute right-0 top-0 h-full w-[20%] xl:w-[10%] rounded-bl-[35px] bg-black z-50 flex items-center justify-center" >
                <Person
                    onMouseEnter={() => setActivo(true)}
                    onMouseLeave={() => setActivo(false)}
                    size={39} color={"white"} />
                <Notification size={27} color={"white"} />
            </div>

            {activo && (
                <motion.div
                    className={"bg-black p-3 absolute top-0 w-[200px] right-[10px] h-[40px] rounded-b-[30px] text-white"}
                    initial={{opacity: 0, x: 60}}
                    animate={{opacity: 1, x: 0}}
                    exit={{ opacity: 0 , x:60}}
                    transition={{
                        duration: 0.5,
                    }}
                >
                    juan diego
                </motion.div>
            )}

            <div className={"absolute top-0 left-[0px] bg-black/60 h-[29px] rounded-br-[30px]"}>
                 cc
            </div>
        </header>
    )
}