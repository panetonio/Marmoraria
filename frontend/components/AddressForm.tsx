import React, { useState, useEffect } from 'react';
import type { Address } from '../types';
import Input from './ui/Input';
import Select from './ui/Select';
import { ufs, getMunicipiosByUF } from '../utils/municipios';

interface AddressFormProps {
    address: Address;
    onAddressChange: (field: keyof Address, value: string) => void;
    errors: Partial<Record<keyof Address, string>>;
}

const AddressForm: React.FC<AddressFormProps> = ({ address, onAddressChange, errors }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [cepError, setCepError] = useState<string | undefined>(errors.cep);
    const [municipios, setMunicipios] = useState<string[]>([]);

    // Inicializar UF com RO se estiver vazio
    useEffect(() => {
        if (!address.uf) {
            onAddressChange('uf', 'RO');
        }
    }, []);

    // Atualizar lista de municípios quando UF mudar
    useEffect(() => {
        if (address.uf) {
            const municipiosDisponiveis = getMunicipiosByUF(address.uf);
            setMunicipios(municipiosDisponiveis);
            
            // Se o município atual não está na nova lista, limpar
            if (address.city && !municipiosDisponiveis.includes(address.city)) {
                onAddressChange('city', '');
            }
        }
    }, [address.uf]);

    const handleCepBlur = async (cep: string) => {
        const cleanedCep = cep.replace(/\D/g, '');

        if (cleanedCep.length !== 8) {
            // Don't set an error if the field is simply empty, but clear previous error
            if (cleanedCep.length > 0) {
                 setCepError("CEP inválido. Deve conter 8 dígitos.");
            } else {
                 setCepError(undefined);
            }
            return;
        }

        setCepError(undefined);
        setIsLoading(true);

        try {
            const response = await fetch(`https://viacep.com.br/ws/${cleanedCep}/json/`);
            if (!response.ok) {
                throw new Error('Erro ao buscar CEP.');
            }
            const data = await response.json();

            if (data.erro) {
                setCepError("CEP não encontrado.");
            } else {
                onAddressChange('address', data.logradouro || '');
                onAddressChange('neighborhood', data.bairro || '');
                onAddressChange('city', data.localidade || '');
                onAddressChange('uf', data.uf || '');
            }

        } catch (error) {
            console.error("CEP lookup error:", error);
            setCepError("Erro ao buscar CEP. Verifique a conexão.");
        } finally {
            setIsLoading(false);
        }
    };

    const LoadingSpinner = () => (
        <svg className="animate-spin h-5 w-5 text-text-secondary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
    );

    return (
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            <div className="md:col-span-2">
                <Input
                    label="CEP"
                    id="address-cep"
                    value={address.cep}
                    onChange={e => {
                        const value = e.target.value.replace(/\D/g, '');
                        let formatted = '';
                        if (value.length > 0) {
                            if (value.length <= 5) {
                                formatted = value;
                            } else {
                                formatted = `${value.slice(0, 5)}-${value.slice(5, 8)}`;
                            }
                        }
                        onAddressChange('cep', formatted);
                        if (cepError) setCepError(undefined); // Clear error on typing
                    }}
                    onBlur={e => handleCepBlur(e.target.value)}
                    error={cepError || errors.cep}
                    placeholder="_____-___"
                    maxLength={9} // 00000-000
                    endAdornment={isLoading ? <LoadingSpinner /> : null}
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
            <div className="md:col-span-1">
                <Select
                    label="UF"
                    id="address-uf"
                    value={address.uf || 'RO'}
                    onChange={e => onAddressChange('uf', e.target.value)}
                    error={errors.uf}
                >
                    <option value="">Selecione...</option>
                    {ufs.map(uf => (
                        <option key={uf} value={uf}>{uf}</option>
                    ))}
                </Select>
            </div>
            <div className="md:col-span-3">
                <Select
                    label="Município"
                    id="address-city"
                    value={address.city}
                    onChange={e => onAddressChange('city', e.target.value)}
                    error={errors.city}
                    disabled={!address.uf || municipios.length === 0}
                >
                    <option value="">Selecione o município...</option>
                    {municipios.map(municipio => (
                        <option key={municipio} value={municipio}>{municipio}</option>
                    ))}
                </Select>
            </div>
        </div>
    );
};

export default AddressForm;