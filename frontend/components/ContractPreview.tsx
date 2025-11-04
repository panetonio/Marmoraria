import React, { useMemo } from 'react';
import type { Contract } from '../types';

interface ContractPreviewProps {
  contract: Contract;
}

const normalizeVariables = (variables?: Record<string, any>) => {
  if (!variables) return {} as Record<string, string>;
  const flat: Record<string, string> = {};
  for (const [key, value] of Object.entries(variables)) {
    if (value == null) continue;
    if (typeof value === 'object') {
      try {
        flat[key] = JSON.stringify(value);
      } catch {
        flat[key] = String(value);
      }
    } else {
      flat[key] = String(value);
    }
  }
  // aliases comuns
  if (variables.clientName && !flat.CLIENT_NAME) flat.CLIENT_NAME = String(variables.clientName);
  if (variables.clientCpfCnpj && !flat.CLIENT_DOCUMENT) flat.CLIENT_DOCUMENT = String(variables.clientCpfCnpj);
  if (variables.orderTotal && !flat.ORDER_TOTAL) flat.ORDER_TOTAL = String(variables.orderTotal);
  if (variables.deliveryAddress && !flat.DELIVERY_ADDRESS) flat.DELIVERY_ADDRESS = typeof variables.deliveryAddress === 'object' ? JSON.stringify(variables.deliveryAddress) : String(variables.deliveryAddress);
  return flat;
};

const applyTemplate = (template?: string, variables?: Record<string, any>) => {
  if (!template) return '';
  const map = normalizeVariables(variables);
  return template.replace(/\{\{\s*([A-Z0-9_\.]+)\s*\}\}/g, (_m, key: string) => {
    const k = String(key).toUpperCase();
    return Object.prototype.hasOwnProperty.call(map, k) ? map[k] : '';
  });
};

const ContractPreview: React.FC<ContractPreviewProps> = ({ contract }) => {
  const renderedContent = useMemo(() => applyTemplate(contract.contentTemplate, contract.variables), [contract.contentTemplate, contract.variables]);

  return (
    <div id="contract-printable-area" className="bg-white text-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 p-6 leading-7">
      <div className="pb-4 border-b border-slate-200 dark:border-slate-700">
        <h2 className="text-xl font-semibold">Contrato</h2>
        <p className="text-sm text-slate-500">{contract.documentNumber || 'Sem número'}</p>
      </div>

      <div className="prose max-w-none mt-4 whitespace-pre-wrap text-sm">
        {renderedContent || 'Sem conteúdo.'}
      </div>

      <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-700">
        <h3 className="text-base font-semibold mb-3">Assinatura</h3>
        {contract.status === 'signed' ? (
          <div className="text-center">
            {contract.digitalSignatureUrl && (
              <img src={contract.digitalSignatureUrl} alt="Assinatura" className="mx-auto mb-2 max-h-24" />
            )}
            <p className="font-medium">{contract.signatoryInfo?.name || '-'}</p>
            <p className="text-sm text-slate-600">{contract.signatoryInfo?.documentNumber || '-'}</p>
          </div>
        ) : (
          <div className="text-center">
            <p className="border-b border-slate-900 inline-block w-64 mb-2">&nbsp;</p>
            <p className="font-medium">{(contract.variables as any)?.clientName || 'Cliente'}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ContractPreview;


