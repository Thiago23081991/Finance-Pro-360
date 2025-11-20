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
  return Math.random().toString(36).substr(2, 9);
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