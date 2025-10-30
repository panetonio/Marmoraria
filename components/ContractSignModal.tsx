import React, { useState } from 'react';
import type { Contract } from '../types';
import Modal from './ui/Modal';
import Button from './ui/Button';
import Input from './ui/Input';
import SignaturePad from './SignaturePad';
import ContractPreview from './ContractPreview';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../utils/api';
import toast from 'react-hot-toast';

interface ContractSignModalProps {
  contract: Contract;
  onClose: () => void;
}

const ContractSignModal: React.FC<ContractSignModalProps> = ({ contract, onClose }) => {
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [documentNumber, setDocumentNumber] = useState('');
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);

  const signMutation = useMutation({
    mutationFn: (payload: { id: string; name: string; documentNumber: string; signatureDataUrl: string }) =>
      api.signContract(payload.id, { name: payload.name, documentNumber: payload.documentNumber, signatureDataUrl: payload.signatureDataUrl }),
    onSuccess: () => {
      queryClient.invalidateQueries();
    },
  });

  const handleDownloadPdf = async () => {
    const el = document.querySelector('#contract-printable-area') as HTMLElement | null;
    if (!el) return;
    const canvas = await html2canvas(el, { scale: 2 });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const props = (pdf as any).getImageProperties(imgData);
    const imgWidth = pageWidth - 20;
    const imgHeight = (props.height * imgWidth) / props.width;
    let y = 10;
    if (imgHeight <= pageHeight) {
      pdf.addImage(imgData, 'PNG', 10, y, imgWidth, imgHeight);
    } else {
      let heightLeft = imgHeight;
      let position = 0;
      while (heightLeft > 0) {
        pdf.addImage(imgData, 'PNG', 10, position ? 10 : y, imgWidth, imgHeight);
        heightLeft -= pageHeight;
        position += pageHeight;
        if (heightLeft > 0) pdf.addPage();
      }
    }
    pdf.save(`Contrato_${contract.documentNumber || contract.id}.pdf`);
  };

  const handleSign = async () => {
    if (!name || !documentNumber || !signatureDataUrl) {
      toast.error('Preencha nome, documento e assinatura.');
      return;
    }

    await toast.promise(
      signMutation.mutateAsync({ id: contract.id, name, documentNumber, signatureDataUrl }),
      {
        loading: 'Salvando assinatura...',
        success: 'Contrato assinado com sucesso!',
        error: 'Erro ao assinar contrato.',
      }
    );

    onClose();
  };

  return (
    <Modal isOpen onClose={onClose} title={`Assinar Contrato ${contract.documentNumber || contract.id}`} className="max-w-4xl">
      <div className="space-y-4">
        <div id="contract-printable-area">
          <ContractPreview contract={contract} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label="Nome Completo" value={name} onChange={(e) => setName(e.target.value)} />
          <Input label="Documento (RG/CPF)" value={documentNumber} onChange={(e) => setDocumentNumber(e.target.value)} />
        </div>
        <SignaturePad onSave={(dataUrl) => setSignatureDataUrl(dataUrl)} />
        <div className="flex justify-between">
          <Button variant="outline" onClick={handleDownloadPdf}>Baixar PDF</Button>
          <div className="space-x-2">
            <Button variant="ghost" onClick={onClose}>Cancelar</Button>
            <Button onClick={handleSign} disabled={signMutation.isLoading}>Assinar e Salvar</Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default ContractSignModal;


