import React from 'react';
import type { Invoice, Address, QuoteItem } from '../types';

interface InvoicePreviewProps {
  invoice: Invoice;
}

const formatCurrency = (value: number) =>
  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const renderAddress = (addr?: Address) => {
  if (!addr) return '-';
  const parts = [addr.address, addr.number, addr.neighborhood, addr.city, addr.uf, addr.cep]
    .filter(Boolean)
    .join(', ');
  return parts;
};

const InvoicePreview: React.FC<InvoicePreviewProps> = ({ invoice }) => {
  const items: QuoteItem[] = Array.isArray(invoice.items) ? invoice.items : [];

  const subtotal = items.reduce((sum, it) => sum + (it.totalPrice || 0), 0);

  return (
    <div id="invoice-printable-area" className="bg-white text-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded bg-blue-600" />
          <div>
            <h1 className="text-xl font-bold">Marmoraria ERP</h1>
            <p className="text-xs text-slate-500">DANFE SIMULADA</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm">NF-e</p>
          <p className="text-xs text-slate-500">{invoice.id}</p>
        </div>
      </div>

      {/* Chave de Acesso */}
      <div className="mt-4 p-3 rounded bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
        <p className="text-xs font-medium text-slate-600">Chave de Acesso</p>
        <p className="font-mono text-sm break-all">{invoice.nfeKey || '— (ainda não emitida)'}</p>
      </div>

      {/* Destinatário */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-3 rounded border border-slate-200 dark:border-slate-700">
          <p className="text-xs font-medium text-slate-600">Destinatário</p>
          <p className="font-semibold">{invoice.clientName}</p>
          <p className="text-sm text-slate-600">{invoice.buyerDocument || '-'}</p>
          <p className="text-sm text-slate-600 mt-1">{renderAddress(invoice.buyerAddress)}</p>
        </div>
        <div className="p-3 rounded border border-slate-200 dark:border-slate-700">
          <p className="text-xs font-medium text-slate-600">Dados da NF</p>
          <p className="text-sm">Status: <span className="font-medium capitalize">{invoice.status}</span></p>
          <p className="text-sm">Emissão: <span className="font-medium">{invoice.issueDate ? new Date(invoice.issueDate).toLocaleString() : '-'}</span></p>
          {invoice.nfePdfUrl && (
            <p className="text-sm mt-1">
              PDF: <a href={invoice.nfePdfUrl} target="_blank" rel="noreferrer" className="text-blue-600 underline">abrir</a>
            </p>
          )}
        </div>
      </div>

      {/* Itens */}
      <div className="mt-6 overflow-x-auto">
        <table className="min-w-full text-sm border border-slate-200 dark:border-slate-700 rounded">
          <thead>
            <tr className="bg-slate-100 dark:bg-slate-800/50 text-left">
              <th className="py-2 px-3 border-b border-slate-200 dark:border-slate-700">Descrição</th>
              <th className="py-2 px-3 border-b border-slate-200 dark:border-slate-700 text-right">Qtd</th>
              <th className="py-2 px-3 border-b border-slate-200 dark:border-slate-700 text-right">Vl. Unitário</th>
              <th className="py-2 px-3 border-b border-slate-200 dark:border-slate-700 text-right">Vl. Total</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it, idx) => (
              <tr key={idx} className="border-b border-slate-100 dark:border-slate-800">
                <td className="py-2 px-3">{it.description}</td>
                <td className="py-2 px-3 text-right">{it.quantity}</td>
                <td className="py-2 px-3 text-right">{formatCurrency(it.unitPrice)}</td>
                <td className="py-2 px-3 text-right">{formatCurrency(it.totalPrice)}</td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td className="py-3 px-3 text-center text-slate-500" colSpan={4}>Sem itens</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Totais */}
      <div className="mt-6 flex flex-col items-end">
        <div className="w-full md:w-1/2 lg:w-1/3">
          <div className="flex justify-between py-1">
            <span className="text-sm text-slate-600">Subtotal</span>
            <span className="text-sm font-medium">{formatCurrency(subtotal)}</span>
          </div>
          <div className="flex justify-between py-1 border-t border-slate-200 dark:border-slate-700 mt-1">
            <span className="text-base font-semibold">Total da Nota</span>
            <span className="text-base font-bold">{formatCurrency(invoice.total)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoicePreview;


