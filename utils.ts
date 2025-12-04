
import { Transaction } from "./types";

export const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

export const formatPercent = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value / 100);
};

export const generateId = () => {
  // Use crypto.randomUUID if available (modern browsers)
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  
  // Fallback UUID v4 generator
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

export const getStatusColor = (status: string) => {
  return status === 'Concluída' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800';
};

export const exportToCSV = (transactions: Transaction[]) => {
  // Define headers
  const headers = ['Data', 'Tipo', 'Categoria', 'Valor', 'Descrição', 'Forma de Pagamento'];
  
  // Map data to rows
  const rows = transactions.map(t => [
    new Date(t.date).toLocaleDateString('pt-BR'),
    t.type === 'income' ? 'Receita' : 'Despesa',
    t.category,
    t.amount.toFixed(2).replace('.', ','), // Format for Sheets/Excel (comma decimal)
    `"${t.description.replace(/"/g, '""')}"`, // Escape quotes
    t.paymentMethod || '-'
  ]);

  // Combine headers and rows
  const csvContent = [
    headers.join(';'), // Semicolon is standard for CSV in Brazil/PT-BR regions for Excel/Sheets
    ...rows.map(row => row.join(';'))
  ].join('\n');

  // Create blob with BOM for UTF-8 (fixes accents in Excel)
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  
  // Create download link
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `finance_pro_360_relatorio_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Simple License Key Generator based on User ID
// Returns an 8-character alphanumeric key
export const generateLicenseKey = (userId: string): string => {
  if (!userId) return '';
  const secret = 'FP360-ENTERPRISE-KEY-GEN';
  let hash = 0;
  // Normalized ID + Secret
  const str = userId.trim().toLowerCase() + secret;
  
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  
  // Convert to Hex, absolute value, uppercase, take first 8 chars
  const key = Math.abs(hash).toString(16).toUpperCase().padStart(8, '0').substring(0, 8);
  // Format as XXXX-XXXX
  return `${key.substring(0, 4)}-${key.substring(4, 8)}`;
};

export const validateLicenseKey = (userId: string, keyInput: string): boolean => {
    if (!userId || !keyInput) return false;
    const expected = generateLicenseKey(userId);
    // Remove dashes for comparison if user typed without them, but generator adds them
    const cleanInput = keyInput.trim().toUpperCase().replace(/-/g, '');
    const cleanExpected = expected.replace(/-/g, '');
    return cleanInput === cleanExpected;
};
