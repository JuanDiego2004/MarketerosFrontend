import Search from "supercons/Search";

export default function InputSearch() {
    return (
        <div className={"flex bg-white/40 backdrop-blur-md rounded-md shadow-sm"}>
            <Search color="black"/>
            <input
                placeholder="Buscar..."
                className="focus:outline-none"
            />
        </div>
    )
}