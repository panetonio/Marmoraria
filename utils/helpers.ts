import type { Point, QuoteItem, QuoteItemType, Service, Product, FinancialTransaction, Address } from '../types';

export const generateWhatsAppLink = (phone: string): string => {
    if (!phone) return '';
    const cleanedPhone = phone.replace(/\D/g, '');
    // Simple logic for Brazilian numbers. Can be improved.
    // Assumes 55 is the country code for Brazil.
    if (cleanedPhone.length <= 11) {
        return `https://wa.me/55${cleanedPhone}`;
    }
    return `https://wa.me/${cleanedPhone}`;
};

export const calculateArea = (verts: Point[]): number => {
    if (verts.length < 3) return 0;
    let area = 0;
    for (let i = 0; i < verts.length; i++) {
        const p1 = verts[i];
        const p2 = verts[(i + 1) % verts.length];
        area += (p1.x * p2.y - p2.x * p1.y);
    }
    return Math.abs(area / 2);
};

// Helper for quote item calculations
export const calculateQuoteItem = (data: Partial<QuoteItem & { area?: number }>): Partial<QuoteItem & { area?: number, perimeter?: number }> => {
    let quantity = data.quantity || 0;
    const unitPrice = data.unitPrice || 0;
    const discount = data.discount || 0;
    let calculatedData: Partial<QuoteItem & { area?: number, perimeter?: number }> = { ...data };

    if (data.type === 'material') {
        if (data.shapePoints && data.shapePoints.length > 0) {
            // Area from shapePoints is the quantity
        } else if (data.width && data.height) {
            const width = parseFloat(data.width.toString());
            const height = parseFloat(data.height.toString());
            if (!isNaN(width) && !isNaN(height) && width > 0 && height > 0) {
                const area = width * height;
                const perimeter = 2 * (width + height);
                quantity = area;
                calculatedData = { ...calculatedData, area, perimeter };
            }
        }
    }
    
    const basePrice = quantity * unitPrice;
    const totalPrice = basePrice - discount;

    return { ...calculatedData, quantity, totalPrice };
};


// Helper for quote item validation
export const validateQuoteItem = (
    itemData: Partial<QuoteItem>,
    itemType: QuoteItemType,
    services: Service[],
    products: Product[]
): Record<string, string> => {
    const errors: Record<string, string> = {};

    if (itemType === 'material') {
        if (!itemData.materialId) { errors.materialId = "Selecione um material."; }
        if (!itemData.description?.trim()) { errors.description = "A descrição da peça é obrigatória."; }
        if (!(itemData.shapePoints && itemData.shapePoints.length > 0)) {
            if (!itemData.width || itemData.width <= 0) { errors.width = "Largura deve ser > 0."; }
            if (!itemData.height || itemData.height <= 0) { errors.height = "Altura deve ser > 0."; }
        }
    } else if (itemType === 'service') {
        const serviceExists = services.some(s => s.id === itemData.id);
        if (!itemData.id || !serviceExists) {
            errors.id = "Selecione um serviço válido.";
        }
        if (!itemData.quantity || itemData.quantity <= 0) {
            errors.quantity = "Quantidade deve ser > 0.";
        }
    } else if (itemType === 'product') {
        const productExists = products.some(p => p.id === itemData.id);
        if (!itemData.id || !productExists) {
            errors.id = "Selecione um produto válido.";
        }
        if (!itemData.quantity || itemData.quantity <= 0) {
            errors.quantity = "Quantidade deve ser > 0.";
        }
    }
    return errors;
};

export const exportTransactionsToCSV = (transactions: FinancialTransaction[], filename: string) => {
    if (transactions.length === 0) return;

    const headers = [
        'Data Pagamento',
        'Descrição',
        'Valor',
        'Tipo',
        'Status',
        'Método Pagamento',
        'Pedido Relacionado',
        'Cliente Relacionado'
    ];

    const escapeCSV = (str: string) => `"${str.replace(/"/g, '""')}"`;

    const csvRows = [
        headers.join(','),
        ...transactions.map(t => {
            const row = [
                t.paymentDate ? new Date(t.paymentDate).toLocaleDateString('pt-BR') : 'N/A',
                escapeCSV(t.description),
                t.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 }),
                t.type,
                t.status,
                t.paymentMethod || 'N/A',
                t.relatedOrderId || 'N/A',
                t.relatedClientId || 'N/A'
            ];
            return row.join(',');
        })
    ];

    const csvString = csvRows.join('\n');
    const blob = new Blob([`\uFEFF${csvString}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

// Address validation
export type AddressErrors = Partial<Record<keyof Address, string>>;

export const validateAddress = (address: Address): AddressErrors => {
    const errors: AddressErrors = {};

    if (!address.address || !address.address.trim()) {
        errors.address = 'Logradouro é obrigatório.';
    }
    if (!address.number || !address.number.trim()) {
        errors.number = 'Número é obrigatório.';
    }
    if (!address.neighborhood || !address.neighborhood.trim()) {
        errors.neighborhood = 'Bairro é obrigatório.';
    }
    if (!address.city || !address.city.trim()) {
        errors.city = 'Cidade é obrigatória.';
    }
    if (!address.uf || !address.uf.trim() || address.uf.length !== 2) {
        errors.uf = 'UF inválido.';
    }
    if (!address.cep || !address.cep.trim()) {
        errors.cep = 'CEP é obrigatório.';
    }

    return errors;
};
