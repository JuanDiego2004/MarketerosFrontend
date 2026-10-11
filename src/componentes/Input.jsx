export default function Input({
                                  Icono,
                                  type="text",
                                  placeholder,
                                  label,
                                  onChange,
                                  value,
                                  required,
                                  colorLabel = "text-gray-200", placeholderColor = "text-gray-400", className=""}) {
    return (
       <div>
           <span className={`uppercase font-loxend font-medium text-[12px]  ${colorLabel}`}>{label}</span>
           <div className={`flex items-center gap-2 bg-white/10 backdrop-blur-sm px-2 py-2 w-full rounded-md mt-1 ${className} hover:border border-gray-400 transition-all transform ease-in-out duration-300 focus:border focus:border-gray-400`}>
               <Icono color={"gray"}/>
               <input
                   type={type}
                   required={required}
                   onChange={onChange}
                   value={value}
                   className={`w-full focus:outline-none ${placeholderColor}`}
                   placeholder={placeholder} />
           </div>
       </div>
    )
}