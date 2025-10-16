import type { Point } from '../types';

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
