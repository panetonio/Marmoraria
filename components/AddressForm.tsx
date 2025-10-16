import React from 'react';
import type { Address } from '../types';
import Input from './ui/Input';

interface AddressFormProps {
    address: Address;
    onAddressChange: (field: keyof Address, value: string) => void;
    errors: Partial<Record<keyof Address, string>>;
}

const AddressForm: React.FC<AddressFormProps> = ({ address, onAddressChange, errors }) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            <div className="md:col-span-2">
                <Input
                    label="CEP"
                    id="address-cep"
                    value={address.cep}
                    onChange={e => onAddressChange('cep', e.target.value)}
                    error={errors.cep}
                />
            </div>
            <div className="md:col-span-4">
                <Input
                    label="Logradouro (Rua, Av.)"
                    id="address-street"
                    value={address.address}
                    onChange={e => onAddressChange('address', e.target.value)}
                    error={errors.address}
                />
            </div>
            <div className="md:col-span-2">
                <Input
                    label="Número"
                    id="address-number"
                    value={address.number}
                    onChange={e => onAddressChange('number', e.target.value)}
                    error={errors.number}
                />
            </div>
            <div className="md:col-span-4">
                <Input
                    label="Complemento"
                    id="address-complement"
                    value={address.complement || ''}
                    onChange={e => onAddressChange('complement', e.target.value)}
                    error={errors.complement}
                />
            </div>
            <div className="md:col-span-2">
                <Input
                    label="Bairro"
                    id="address-neighborhood"
                    value={address.neighborhood}
                    onChange={e => onAddressChange('neighborhood', e.target.value)}
                    error={errors.neighborhood}
                />
            </div>
            <div className="md:col-span-3">
                <Input
                    label="Cidade"
                    id="address-city"
                    value={address.city}
                    onChange={e => onAddressChange('city', e.target.value)}
                    error={errors.city}
                />
            </div>
            <div className="md:col-span-1">
                <Input
                    label="UF"
                    id="address-uf"
                    value={address.uf}
                    maxLength={2}
                    onChange={e => onAddressChange('uf', e.target.value.toUpperCase())}
                    error={errors.uf}
                />
            </div>
        </div>
    );
};

export default AddressForm;