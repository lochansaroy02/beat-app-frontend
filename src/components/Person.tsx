"use client";
import InputComponent from "@/components/ui/InputComponent";
import { Button } from "@/components/ui/button";
import { usePersonStore } from "@/store/personStore";
import { useState } from "react";
import Address from "./Address";
import DropDown from "./ui/DropDown";

const Person = () => {
    const { getPerson, personData } = usePersonStore()
    const [toggleAddress, setToggleAddress] = useState(false)
    const [gender, setGender] = useState("")
    const [fields, setFields] = useState({
        name: "",
        age: null,
        isAcccused: false,
        dossierNo: "",
        checkingId: "",

    });

    // Generic handler
    const handleInputChange = (key: keyof typeof fields, value: string | number) => {
        setFields((prev) => ({
            ...prev,
            [key]: value,
        }));
    };


    const genderOptions = [
        {
            value: "male",
            label: "Male"
        },
        {
            value: "female",
            label: "Female"
        },
    ]
    // Field configs
    const fieldConfigs = [
        { key: "name", label: "Name", type: "text" },
        { key: "age", label: "Age", type: "number" },
        { key: "gender", label: "Gender", type: "text" },
        { key: "isAcccused", label: "Accused", type: "boolean" },
        { key: "dossierNo", label: "Dossier Number", type: "string" },

    ] as const;

    // functions 
    const handleClick = () => {
        setToggleAddress(true)
    }


    // useEffects  
    return (
        <div className="px-12 flex   mt-12  ">
            <div className=" flex  items-center flex-col ">
                <div className="flex w-full flex-col  h-fit justify-center gap-4 ">
                    <div className="w-full   flex justify-center " >
                        <h1 className="text-xl  mb-4 ">Person Details </h1>
                    </div>
                    <div className="flex flex-wrap gap-4  ">

                        {fieldConfigs.map((field, index) => (
                            <div key={index} className=" ">
                                {
                                    (field.key === "gender") ? (
                                        <DropDown label="Gender" options={genderOptions} selectedValue={gender} handleSelect={setGender} />
                                    ) :
                                        < InputComponent
                                            className="gap-2"
                                            key={field.key}
                                            label={field.label}
                                            type={field.type}
                                            value={fields[field.key]}
                                            setInput={(e) =>
                                                handleInputChange(
                                                    field.key,
                                                    field.type === "number" ? Number(e.target.value) : e.target.value
                                                )
                                            }
                                        />
                                }

                            </div>
                        ))}
                        <div className=" flex mt-4   justify-center">
                            <Button onClick={handleClick}>Add Address</Button>
                        </div>
                    </div>

                    {toggleAddress && <Address setToggleAddress={setToggleAddress} />}
                </div>



                <div className="bg-green-300">

                </div>

            </div>
        </div >
    );
};

export default Person;
