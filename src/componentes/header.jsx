import Person from "supercons/Person";
import Notification from "supercons/Notification";

export default function Header() {
    return (
        <header className="relative h-10 w-full bg-transparent">
            <div className="absolute left-0 top-0 h-[10px] w-[80%] xl:w-[90%] bg-black" />

            <div className="absolute right-0 top-0 h-full w-[20%] xl:w-[10%] rounded-bl-[35px] bg-black flex items-center justify-center" >
                <Person size={39} color={"white"} />
                <Notification size={27} color={"white"} />
            </div>

            <div className={"absolute top-0 left-[0px] bg-black/60 h-[29px] rounded-br-[30px]"}>
                 cc
            </div>
        </header>
    )
}