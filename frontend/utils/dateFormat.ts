/**
 * Utilitários para formatação e parsing de datas no formato brasileiro DD/MM/AAAA
 */

/**
 * Converte uma data (Date, string ISO ou string DD/MM/AAAA) para formato DD/MM/AAAA
 * @param date - Data a ser formatada (Date, string ISO YYYY-MM-DD, ou string DD/MM/AAAA)
 * @returns String formatada DD/MM/AAAA ou string vazia se inválida
 */
export const formatDate = (date: string | Date | null | undefined): string => {
  if (!date) return '';
  
  let dateObj: Date;
  
  // Se já é Date, usar diretamente
  if (date instanceof Date) {
    dateObj = date;
  } 
  // Se é string ISO (YYYY-MM-DD)
  else if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}/.test(date)) {
    dateObj = new Date(date);
  }
  // Se já está no formato DD/MM/AAAA, retornar como está
  else if (typeof date === 'string' && /^\d{2}\/\d{2}\/\d{4}$/.test(date)) {
    return date;
  }
  // Tentar parsear como Date
  else {
    dateObj = new Date(date);
  }
  
  // Verificar se a data é válida
  if (isNaN(dateObj.getTime())) {
    return '';
  }
  
  // Formatar para DD/MM/AAAA
  const day = dateObj.getDate().toString().padStart(2, '0');
  const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
  const year = dateObj.getFullYear();
  
  return `${day}/${month}/${year}`;
};

/**
 * Converte uma string DD/MM/AAAA para objeto Date
 * @param dateString - String no formato DD/MM/AAAA
 * @returns Date object ou null se inválida
 */
export const parseDate = (dateString: string): Date | null => {
  if (!dateString || dateString.trim() === '') return null;
  
  // Se já está no formato ISO, converter diretamente
  if (/^\d{4}-\d{2}-\d{2}/.test(dateString)) {
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? null : date;
  }
  
  // Tentar parsear DD/MM/AAAA
  const parts = dateString.split('/');
  if (parts.length !== 3) return null;
  
  const [day, month, year] = parts.map(p => parseInt(p, 10));
  
  // Validar valores
  if (isNaN(day) || isNaN(month) || isNaN(year)) return null;
  if (day < 1 || day > 31 || month < 1 || month > 12 || year < 1900 || year > 2100) {
    return null;
  }
  
  // Criar Date (mês é 0-indexed)
  const date = new Date(year, month - 1, day);
  
  // Verificar se a data é válida (ex: 31/02/2024 não é válido)
  if (date.getDate() !== day || date.getMonth() !== month - 1 || date.getFullYear() !== year) {
    return null;
  }
  
  return date;
};

/**
 * Converte uma string DD/MM/AAAA para formato ISO (YYYY-MM-DD)
 * @param dateString - String no formato DD/MM/AAAA
 * @returns String no formato YYYY-MM-DD ou string vazia se inválida
 */
export const parseDateToISO = (dateString: string): string => {
  const date = parseDate(dateString);
  if (!date) return '';
  
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  
  return `${year}-${month}-${day}`;
};

/**
 * Formata uma data para exibição com hora (DD/MM/AAAA HH:MM)
 */
export const formatDateTime = (date: string | Date | null | undefined): string => {
  if (!date) return '';
  
  const dateObj = date instanceof Date ? date : new Date(date);
  if (isNaN(dateObj.getTime())) return '';
  
  const dateStr = formatDate(dateObj);
  const hours = dateObj.getHours().toString().padStart(2, '0');
  const minutes = dateObj.getMinutes().toString().padStart(2, '0');
  
  return `${dateStr} ${hours}:${minutes}`;
};

