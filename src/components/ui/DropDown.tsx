interface DropDownProps {
    selectedValue: string,
    handleSelect: (value: string) => void,
    // It's good practice to type this more specifically
    options: { value: string, label: string }[],
    selectValueLabel?: string,
    label?: string
}

const DropDown = ({ selectedValue, options, handleSelect, selectValueLabel = "select value", label }: DropDownProps) => {
    return (
        <div className='flex flex-col gap-2 w-full'>
            <label className="text-neutral-800 text-sm  text-nowrap" htmlFor={label}>{label}</label>
            <select
                id={label} // Good for accessibility
                className='rounded-lg w-full  text-neutral-800 px-2 py-1'
                value={selectedValue}
                onChange={(e) => { handleSelect(e.target.value) }}
            >
                <option className='' disabled value="">{selectValueLabel}</option>
                {
                    options.map((item) => (
                        <option
                            key={item.value} // Added key prop to fix the warning
                            className=' px-2'
                            value={item.value} // Use the value for the option's value
                        >
                            {item.label} {/* Use the label for the displayed text */}
                        </option>
                    ))
                }
            </select>
        </div>
    )
}

export default DropDown;