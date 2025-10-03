'use client';
import { CapturedPersonState } from '@/lib/types';
import { useFormStore } from '@/store/formStore';
import { Trash2, UserPlus } from 'lucide-react';

interface PersonCardProps {
    personData: CapturedPersonState;
    index: number;
}

export const PersonCard = ({ personData, index }: PersonCardProps) => {
    // Get update functions directly from the store
    const {
        removePerson,
        updatePersonField,
        updateAddressField,
        addFamilyMember,
        removeFamilyMember,
        updateFamilyMemberField,
    } = useFormStore();

    // Generic handlers that call the store's update functions
    const handlePersonChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        let finalValue: string | number | boolean = value;
        if (type === 'number') finalValue = parseInt(value, 10) || 0;
        if (name === 'isAcccused') finalValue = (e.target as HTMLInputElement).checked;
        updatePersonField(personData.id, name as any, finalValue);
    };

    const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type } = e.target;
        const finalValue = type === 'number' ? parseInt(value, 10) || 0 : value;
        updateAddressField(personData.id, name as any, finalValue);
    };

    const handleFamilyMemberChange = (memberId: number, e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        const finalValue = type === 'number' ? parseInt(value, 10) || 0 : value;
        updateFamilyMemberField(personData.id, memberId, name as any, finalValue);
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 relative">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-gray-700">Captured Person #{index + 1}</h3>
                <button
                    onClick={() => removePerson(personData.id)}
                    className="p-2 text-red-500 hover:bg-red-100 rounded-full transition-colors"
                    aria-label="Remove Person"
                >
                    <Trash2 size={20} />
                </button>
            </div>

            {/* Person Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-b pb-4 mb-4">
                <input name="name" value={personData.person.name} onChange={handlePersonChange} placeholder="Full Name" className="input-style" />
                <input name="age" type="number" value={personData.person.age} onChange={handlePersonChange} placeholder="Age" className="input-style" />
                <select name="gender" value={personData.person.gender} onChange={handlePersonChange} className="input-style">
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                    <option value="OTHER">Other</option>
                </select>
                <input name="dossierNo" value={personData.person.dossierNo || ''} onChange={handlePersonChange} placeholder="Dossier No. (Optional)" className="input-style" />
                <div className="flex items-center gap-2 md:col-span-2">
                    <input type="checkbox" id={`isAccused-${personData.id}`} name="isAcccused" checked={personData.person.isAcccused} onChange={handlePersonChange} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                    <label htmlFor={`isAccused-${personData.id}`} className="font-medium text-gray-700">Is Accused?</label>
                </div>
            </div>

            {/* Address Details */}
            <h4 className="font-semibold text-lg text-gray-600 mb-2">Address</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-b pb-4 mb-4">
                <input name="village" value={personData.address.village || ''} onChange={handleAddressChange} placeholder="Village/Area" className="input-style" />
                <input name="town" value={personData.address.town || ''} onChange={handleAddressChange} placeholder="Town/City" className="input-style" />
                <input name="district" value={personData.address.district} onChange={handleAddressChange} placeholder="District" className="input-style" required />
                <input name="state" value={personData.address.state} onChange={handleAddressChange} placeholder="State" className="input-style" required />
                <input name="pin" type="number" value={personData.address.pin} onChange={handleAddressChange} placeholder="PIN Code" className="input-style" required />
            </div>

            {/* Family Members */}
            <div className="flex justify-between items-center mb-2">
                <h4 className="font-semibold text-lg text-gray-600">Family Members</h4>
                <button type="button" onClick={() => addFamilyMember(personData.id)} className="flex items-center gap-1 text-sm bg-blue-500 text-white py-1 px-3 rounded-md hover:bg-blue-600 transition-colors">
                    <UserPlus size={16} /> Add
                </button>
            </div>
            {personData.familyMembers.map((member: any) => (
                <div key={member.id} className="grid grid-cols-1 md:grid-cols-5 gap-2 mb-2 p-2 bg-gray-50 rounded-md items-center">
                    <input name="name" value={member.name} onChange={(e) => handleFamilyMemberChange(member.id, e)} placeholder="Member Name" className="input-style md:col-span-2" />
                    <input name="relation" value={member.relation} onChange={(e) => handleFamilyMemberChange(member.id, e)} placeholder="Relation" className="input-style" />
                    <input name="age" type="number" value={member.age} onChange={(e) => handleFamilyMemberChange(member.id, e)} placeholder="Age" className="input-style" />
                    <div className="flex items-center">
                        <input name="occupation" value={member.occupation} onChange={(e) => handleFamilyMemberChange(member.id, e)} placeholder="Occupation" className="input-style w-full" />
                        <button type="button" onClick={() => removeFamilyMember(personData.id, member.id)} className="ml-2 text-red-500 hover:text-red-700">
                            <Trash2 size={16} />
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
};