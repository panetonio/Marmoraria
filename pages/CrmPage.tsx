import React, { useState, useMemo, FC, DragEvent, useEffect } from 'react';
import type { Client, Opportunity, OpportunityStatus, AgendaEvent, Note, Page, QuoteStatus, User, Address } from '../types';
import { mockUsers, mockQuotes, mockOrders } from '../data/mockData';
import Card, { CardContent, CardHeader, CardFooter } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Tabs from '../components/ui/Tabs';
import { useData } from '../context/DataContext';
import { generateWhatsAppLink } from '../../utils/helpers';
import Input from '../components/ui/Input';
import Textarea from '../components/ui/Textarea';
import AddressForm from '../components/AddressForm';

type CrmView = 'clientes' | 'pipeline' | 'agenda';

const KANBAN_COLUMNS: { id: OpportunityStatus; title: string; color: string }[] = [
  { id: 'novo', title: 'Novo', color: 'bg-gray-400' },
  { id: 'contatado', title: 'Contatado', color: 'bg-blue-400' },
  { id: 'orcamento_enviado', title: 'Orçamento Enviado', color: 'bg-yellow-500' },
  { id: 'negociacao', title: 'Em Negociação', color: 'bg-orange-500' },
  { id: 'ganho', title: 'Ganho', color: 'bg-green-500' },
  { id: 'perdido', title: 'Perdido', color: 'bg-red-500' },
];

const ClientDetailModal: FC<{ 
    client: Client;
    isOpen: boolean;
    onClose: () => void;
}> = ({ client, isOpen, onClose }) => {
    const { notes, addNote } = useData();
    const [newNoteContent, setNewNoteContent] = useState('');

    const interactionHistory = useMemo(() => {
        const now = new Date();
        const archiveLimit = 120 * 24 * 60 * 60 * 1000; // 120 days in milliseconds

        const processedQuotes = mockQuotes.map(quote => {
            const isOld = now.getTime() - new Date(quote.createdAt).getTime() > archiveLimit;
            if ((quote.status === 'draft' || quote.status === 'sent') && isOld) {
                return { ...quote, status: 'archived' as QuoteStatus };
            }
            return quote;
        });

        const clientQuotes = processedQuotes.filter(q => 
                q.clientName === client.name && 
                q.status !== 'approved' &&
                q.status !== 'archived'
            )
            .map(q => ({ ...q, type: 'Orçamento' }));
        
        const clientOrders = mockOrders.filter(o => o.clientName === client.name)
            .map(o => ({ ...o, type: 'Pedido', createdAt: o.approvalDate, total: o.total, id: o.id }));
        const clientNotes = notes.filter(n => n.clientId === client.id)
            .map(n => ({...n, type: 'Anotação'}));
        
        const combined = [...clientQuotes, ...clientOrders, ...clientNotes];
        return combined.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }, [client, notes]);

    const handleSaveNote = () => {
        if (!newNoteContent.trim()) return;
        addNote(client.id, newNoteContent);
        setNewNoteContent('');
    };

    const getIconForHistory = (type: string) => {
        switch(type) {
            case 'Orçamento': return <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-600 dark:text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>;
            case 'Pedido': return <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>;
            case 'Anotação': return <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>;
            default: return null;
        }
    }
    
    const formattedAddress = `${client.address.address}, ${client.address.number}${client.address.complement ? ` - ${client.address.complement}` : ''} - ${client.address.neighborhood}, ${client.address.city} - ${client.address.uf}`;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Detalhes do Cliente" className="max-w-4xl">
            <div className="flex flex-col md:flex-row gap-6">
                <div className="md:w-1/3 bg-slate-50 dark:bg-dark p-6 rounded-lg">
                    <h3 className="text-2xl font-bold text-text-primary dark:text-slate-100 mb-1">{client.name}</h3>
                    <p className="text-sm text-text-secondary dark:text-slate-400 mb-4">{client.type === 'empresa' ? 'Empresa' : 'Pessoa Física'}</p>
                    <div className="space-y-3 text-text-secondary dark:text-slate-300">
                       <p><strong>Email:</strong> {client.email}</p>
                        <div className="flex items-center space-x-2">
                            <p><strong>Telefone:</strong> {client.phone}</p>
                            {client.phone && (
                                <a href={generateWhatsAppLink(client.phone)} target="_blank" rel="noopener noreferrer" title="Abrir no WhatsApp" className="text-green-500 hover:text-green-700">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.487 5.235 3.487 8.413 0 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 4.315 1.919 6.066l-1.472 5.378 5.441-1.421zM11.999 4.521c.212 0 .416.03.612.088.225-.045.458-.068.696-.068h.001c.138 0 .274.01.409.029.164.023.324.057.48.102.18.053.352.12.518.2.148.071.29.155.425.25.158.114.306.242.441.381.119.123.23.255.335.395.122.161.233.332.336.512.092.158.175.324.248.499.063.149.117.302.162.458.042.145.074.293.097.444.02.127.031.255.031.385v.001c0 .093-.005.185-.014.276-.025.245-.084.482-.175.709-.131.325-.316.626-.55.895-.252.287-.556.533-.898.729-.281.16-.583.284-.901.372-.258.072-.524.12-.796.143-.332.028-.671.028-.999 0-.272-.023-.538-.071-.796-.143-.318-.088-.62-.212-.901-.372-.342-.196-.646-.442-.898-.729-.234-.269-.419-.57-.55-.895-.091-.227-.15-.464-.175-.709-.009-.091-.014-.183-.014-.276v-.001c0-.13.011-.258.031-.385.023-.151.055-.299.097-.444.045-.156.099-.309.162-.458.073-.175.156-.341.248-.499.103-.18.214-.351.336.512.105-.14.216-.272.335.395.135-.139.283-.267.441.381.135-.095.277-.179.425-.25.166-.08.338-.147.518.2.156-.045.316-.079.48-.102.135-.019.271-.029.409-.029h.001z"/></svg>
                                </a>
                            )}
                        </div>
                       <p><strong>Endereço:</strong> {formattedAddress}</p>
                       <p><strong>CEP:</strong> {client.address.cep}</p>
                       {client.cpfCnpj && <p><strong>CPF/CNPJ:</strong> {client.cpfCnpj}</p>}
                       <p><strong>Cliente desde:</strong> {new Date(client.createdAt).toLocaleDateString()}</p>
                    </div>
                </div>
                 <div className="md:w-2/3">
                    <h4 className="font-semibold text-lg mb-2">Histórico de Interações</h4>
                    <div className="bg-surface dark:bg-slate-700/50 p-4 rounded-lg shadow-inner h-96 overflow-y-auto">
                        <ul className="space-y-4">
                            {interactionHistory.map(item => (
                                <li key={item.id} className="flex items-start space-x-3">
                                    <div className="p-2 bg-slate-100 dark:bg-dark rounded-full mt-1">{getIconForHistory(item.type)}</div>
                                    <div>
                                        <p className="font-semibold">{item.type} <span className="text-xs text-text-secondary dark:text-slate-400 font-normal">- {new Date(item.createdAt).toLocaleString()}</span></p>
                                        <p className="text-sm text-text-secondary dark:text-slate-400">
                                            {'content' in item ? item.content : `ID: ${item.id} - Total: ${'total' in item ? item.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : ''}`}
                                        </p>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                     <div className="mt-4">
                        <Textarea 
                            placeholder="Adicionar nova anotação..."
                            value={newNoteContent}
                            onChange={(e) => setNewNoteContent(e.target.value)}
                            rows={3}
                        />
                        <Button 
                            onClick={handleSaveNote}
                            disabled={!newNoteContent.trim()}
                            className="mt-2 float-right"
                        >
                            Salvar Anotação
                        </Button>
                    </div>
                </div>
            </div>
        </Modal>
    );
};

const ClientForm: React.FC<{
    client: Client;
    onSave: (client: Client) => void;
    onCancel: () => void;
}> = ({ client: initialClient, onSave, onCancel }) => {
    const [client, setClient] = useState<Client>(initialClient);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const validate = () => {
        const newErrors: Record<string, string> = {};
        if (!client.name.trim()) newErrors.name = "Nome é obrigatório.";
        if (!client.cpfCnpj.trim()) newErrors.cpfCnpj = "CPF/CNPJ é obrigatório.";
        if (!client.phone.trim()) newErrors.phone = "Telefone é obrigatório.";
        if (!client.address.address.trim()) newErrors.address = "Logradouro é obrigatório.";
        if (!client.address.number.trim()) newErrors.number = "Número é obrigatório.";
        if (!client.address.neighborhood.trim()) newErrors.neighborhood = "Bairro é obrigatório.";
        if (!client.address.city.trim()) newErrors.city = "Cidade é obrigatória.";
        if (!client.address.uf.trim() || client.address.uf.length !== 2) newErrors.uf = "UF inválido.";
        if (!client.address.cep.trim()) newErrors.cep = "CEP é obrigatório.";
        if (!client.email.trim()) {
            newErrors.email = "Email é obrigatório.";
        } else if (!/\S+@\S+\.\S+/.test(client.email)) {
            newErrors.email = "Formato de email inválido.";
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSave = () => {
        if (validate()) {
            onSave(client);
        }
    };

    const handleAddressChange = (field: keyof Address, value: string) => {
        setClient(prev => ({
            ...prev,
            address: { ...prev.address, [field]: value }
        }));
         if (errors[field]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[field];
                return newErrors;
            });
        }
    };


    return (
        <Card>
            <CardHeader>{client.id.startsWith('new-') ? 'Novo Cliente' : `Editando ${client.name}`}</CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-text-primary dark:text-slate-100 border-b border-border dark:border-slate-700 pb-2">Dados Pessoais / Empresa</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                            label="Nome Completo / Razão Social"
                            id="client-name"
                            value={client.name}
                            onChange={e => setClient({...client, name: e.target.value})}
                            error={errors.name}
                        />
                        <div>
                            <label htmlFor="client-type" className="block text-sm font-medium text-text-secondary dark:text-slate-400 mb-1">Tipo</label>
                            <select id="client-type" value={client.type} onChange={e => setClient({...client, type: e.target.value as 'pessoa_fisica' | 'empresa'})} className="p-2 border rounded w-full bg-slate-50 dark:bg-slate-700 border-border dark:border-slate-600 h-[42px]">
                                <option value="pessoa_fisica">Pessoa Física</option>
                                <option value="empresa">Empresa</option>
                            </select>
                        </div>
                         <Input
                            label="CPF / CNPJ"
                            id="client-cpfCnpj"
                            value={client.cpfCnpj}
                            onChange={e => setClient({...client, cpfCnpj: e.target.value})}
                            error={errors.cpfCnpj}
                        />
                        <Input
                            label="Email"
                            id="client-email"
                            type="email"
                            value={client.email}
                            onChange={e => setClient({...client, email: e.target.value})}
                            error={errors.email}
                        />
                         <Input
                            label="Telefone"
                            id="client-phone"
                            value={client.phone}
                            onChange={e => setClient({...client, phone: e.target.value})}
                            error={errors.phone}
                        />
                    </div>
                    <h3 className="text-lg font-semibold text-text-primary dark:text-slate-100 border-b border-border dark:border-slate-700 pb-2 pt-4">Endereço</h3>
                    <AddressForm
                        address={client.address}
                        onAddressChange={handleAddressChange}
                        errors={errors}
                    />
                </div>
            </CardContent>
            <CardFooter className="flex justify-end space-x-4">
                <Button variant="ghost" onClick={onCancel}>Cancelar</Button>
                <Button onClick={handleSave}>Salvar Cliente</Button>
            </CardFooter>
        </Card>
    );
};

const EventFormModal: FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (event: Omit<AgendaEvent, 'id'>) => void;
    clients: Client[];
    users: User[];
}> = ({ isOpen, onClose, onSave, clients, users }) => {
    const [title, setTitle] = useState('');
    const [date, setDate] = useState('');
    const [time, setTime] = useState('');
    const [clientId, setClientId] = useState('');
    const [userId, setUserId] = useState('');
    const [description, setDescription] = useState('');
    const [errors, setErrors] = useState<Record<string, string>>({});

    const validate = (): boolean => {
        const newErrors: Record<string, string> = {};
        if (!title.trim()) newErrors.title = "O título é obrigatório.";
        if (!date) newErrors.date = "A data é obrigatória.";
        if (!time) newErrors.time = "A hora é obrigatória.";
        if (!clientId) newErrors.clientId = "Selecione um cliente.";
        if (!userId) newErrors.userId = "Selecione um responsável.";

        if (date && time) {
            const eventDateTime = new Date(`${date}T${time}`);
            const now = new Date();
            // Allow events for today, but not in the past
            now.setHours(0,0,0,0);
            if (new Date(date) < now) {
                 newErrors.date = "A data não pode ser no passado.";
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSave = () => {
        if (!validate()) return;
        
        const eventDateTime = new Date(`${date}T${time}`).toISOString();

        onSave({
            title,
            date: eventDateTime,
            clientId,
            description,
            userId
        });
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Agendar Novo Evento">
            <div className="space-y-4">
                <Input
                    label="Título do Evento"
                    id="event-title"
                    type="text"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    error={errors.title}
                />
                <div className="grid grid-cols-2 gap-4">
                     <Input
                        label="Data"
                        id="event-date"
                        type="date"
                        value={date}
                        onChange={e => setDate(e.target.value)}
                        error={errors.date}
                    />
                    <Input
                        label="Hora"
                        id="event-time"
                        type="time"
                        value={time}
                        onChange={e => setTime(e.target.value)}
                        error={errors.time}
                    />
                </div>
                <div>
                    <label htmlFor="event-client" className="block text-sm font-medium text-text-secondary dark:text-slate-400 mb-1">Cliente</label>
                    <select id="event-client" value={clientId} onChange={e => setClientId(e.target.value)} className={`p-2 border rounded w-full bg-slate-50 dark:bg-slate-700 ${errors.clientId ? 'border-error' : 'border-border dark:border-slate-600'} h-[42px]`}>
                        <option value="">-- Selecione --</option>
                        {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                </div>
                 <div>
                    <label htmlFor="event-user" className="block text-sm font-medium text-text-secondary dark:text-slate-400 mb-1">Responsável</label>
                    <select id="event-user" value={userId} onChange={e => setUserId(e.target.value)} className={`p-2 border rounded w-full bg-slate-50 dark:bg-slate-700 ${errors.userId ? 'border-error' : 'border-border dark:border-slate-600'} h-[42px]`}>
                        <option value="">-- Selecione --</option>
                        {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                    </select>
                </div>
                <Textarea
                    label="Descrição"
                    id="event-description"
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    rows={3}
                />
            </div>
            <div className="flex justify-end mt-6 space-x-3">
                <Button variant="ghost" onClick={onClose}>Cancelar</Button>
                <Button onClick={handleSave}>Salvar Evento</Button>
            </div>
        </Modal>
    );
};


interface CrmPageProps {
    searchTarget: { page: Page; id: string } | null;
    clearSearchTarget: () => void;
}

const CrmPage: FC<CrmPageProps> = ({ searchTarget, clearSearchTarget }) => {
    const { 
        clients,
        opportunities, setOpportunities,
        agendaEvents,
        addClient,
        updateClient,
        addEvent,
    } = useData();
    const [view, setView] = useState<CrmView>('clientes');
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);
    const [clientView, setClientView] = useState<'list' | 'form'>('list');
    const [editingClient, setEditingClient] = useState<Client | null>(null);
    const [isEventModalOpen, setIsEventModalOpen] = useState(false);

    useEffect(() => {
        if (searchTarget && searchTarget.page === 'crm') {
            const client = clients.find(c => c.id === searchTarget.id);
            if (client) {
                setSelectedClient(client);
            }
            clearSearchTarget();
        }
    }, [searchTarget, clients, clearSearchTarget]);

    const handleDrop = (e: DragEvent<HTMLDivElement>, newStatus: OpportunityStatus) => {
        const oppId = e.dataTransfer.getData("oppId");
        setOpportunities(prev =>
            prev.map(opp =>
                opp.id === oppId ? { ...opp, status: newStatus } : opp
            )
        );
    };
    
    // FIX: Change DragEvent type from HTMLDivElement to HTMLElement to match what the Card component provides.
    const handleDragStart = (e: DragEvent<HTMLElement>, oppId: string) => {
        e.dataTransfer.setData("oppId", oppId);
    };
    
    const handleNewClient = () => {
        setEditingClient({
            id: `new-${Date.now()}`,
            name: '',
            type: 'pessoa_fisica',
            email: '',
            phone: '',
            address: { cep: '', uf: '', city: '', neighborhood: '', address: '', number: '' },
            cpfCnpj: '',
            createdAt: new Date().toISOString()
        });
        setClientView('form');
    };

    const handleEditClient = (client: Client) => {
        setEditingClient(JSON.parse(JSON.stringify(client)));
        setClientView('form');
    };

    const handleSaveClient = (clientToSave: Client) => {
        if (clientToSave.id.startsWith('new-')) {
            addClient(clientToSave);
        } else {
            updateClient(clientToSave);
        }
        setClientView('list');
        setEditingClient(null);
    };

    const handleCancelClient = () => {
        setClientView('list');
        setEditingClient(null);
    };

    const handleSaveEvent = (eventData: Omit<AgendaEvent, 'id'>) => {
        addEvent(eventData);
        setIsEventModalOpen(false);
    };


    const renderView = () => {
        switch (view) {
            case 'clientes':
                 if (clientView === 'form' && editingClient) {
                    return <ClientForm client={editingClient} onSave={handleSaveClient} onCancel={handleCancelClient} />;
                }
                return (
                    <Card className="p-0">
                        <CardHeader>
                            <div className="flex justify-between items-center">
                                <h2 className="text-2xl font-semibold text-text-primary dark:text-slate-100">Cadastro de Clientes</h2>
                                <Button onClick={handleNewClient}>Novo Cliente</Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                 <table className="w-full text-left">
                                    <thead><tr className="border-b border-border dark:border-slate-700"><th className="p-3">Nome</th><th className="p-3">CPF/CNPJ</th><th className="p-3">Contato</th><th className="p-3">Telefone</th><th className="p-3">Ações</th></tr></thead>
                                    <tbody>
                                        {clients.map(client => (
                                            <tr key={client.id} className="border-b border-border dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50">
                                                <td className="p-3 font-semibold">{client.name}</td>
                                                <td className="p-3 font-mono text-sm">{client.cpfCnpj}</td>
                                                <td className="p-3">{client.email}</td>
                                                <td className="p-3">{client.phone}</td>
                                                <td className="p-3 space-x-4">
                                                    <button onClick={() => setSelectedClient(client)} className="text-primary hover:underline font-semibold text-sm">Ver Detalhes</button>
                                                     <button onClick={() => handleEditClient(client)} className="text-secondary-hover hover:underline font-semibold text-sm">Editar</button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                );
            case 'pipeline':
                return (
                    <div className="grid grid-cols-6 gap-5 h-[75vh]">
                        {KANBAN_COLUMNS.map(column => (
                            <div key={column.id} className="bg-slate-100 dark:bg-slate-800/50 rounded-lg p-3 flex flex-col" onDragOver={e => e.preventDefault()} onDrop={e => handleDrop(e, column.id)}>
                                <div className="flex items-center mb-4"><div className={`w-3 h-3 rounded-full mr-2 ${column.color}`}></div><h3 className="font-semibold text-text-primary dark:text-slate-100">{column.title}</h3></div>
                                <div className="flex-1 overflow-y-auto pr-1">
                                {opportunities.filter(o => o.status === column.id).map(opp => (
                                    <Card key={opp.id} draggable onDragStart={e => handleDragStart(e, opp.id)} className="p-3 mt-3 shadow-sm border border-border dark:border-slate-700 cursor-grab active:cursor-grabbing">
                                        <p className="font-bold text-sm">{opp.clientName}</p>
                                        <p className="text-text-secondary dark:text-slate-400 text-sm mt-1">{opp.estimatedValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">{mockUsers.find(u => u.id === opp.salespersonId)?.name}</p>
                                    </Card>
                                ))}
                                </div>
                            </div>
                        ))}
                    </div>
                );
            case 'agenda':
                 return (
                    <Card className="p-0">
                        <CardHeader>
                            <div className="flex justify-between items-center">
                                <h2 className="text-2xl font-semibold text-text-primary dark:text-slate-100">Agenda de Compromissos</h2>
                                <Button onClick={() => setIsEventModalOpen(true)}>Agendar Evento</Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <ul className="space-y-4">
                                {agendaEvents.sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime()).map(event => {
                                    const client = clients.find(c => c.id === event.clientId);
                                    return (
                                    <li key={event.id} className="flex items-center p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-border dark:border-slate-700">
                                        <div className="text-center w-20 mr-4">
                                            <p className="font-bold text-lg text-primary">{new Date(event.date).toLocaleDateString('pt-BR', {day: '2-digit', month: 'short'})}</p>
                                            <p className="text-sm text-text-secondary dark:text-slate-400">{new Date(event.date).toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit'})}</p>
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-semibold">{event.title}</h4>
                                            <p className="text-sm text-text-secondary dark:text-slate-400">Cliente: {client?.name}</p>
                                            <p className="text-sm text-text-primary dark:text-slate-300 mt-1">{event.description}</p>
                                        </div>
                                        <div className="text-sm text-text-secondary dark:text-slate-400">
                                           Responsável: {mockUsers.find(u => u.id === event.userId)?.name}
                                        </div>
                                    </li>
                                )})}
                            </ul>
                        </CardContent>
                    </Card>
                );
        }
    };
    
    return (
        <div>
            {selectedClient && <ClientDetailModal 
                client={selectedClient} 
                isOpen={!!selectedClient}
                onClose={() => setSelectedClient(null)} 
            />}

             {isEventModalOpen && (
                <EventFormModal
                    isOpen={isEventModalOpen}
                    onClose={() => setIsEventModalOpen(false)}
                    onSave={handleSaveEvent}
                    clients={clients}
                    users={mockUsers}
                />
            )}

            <h1 className="text-3xl font-bold text-text-primary dark:text-slate-100">CRM - Gestão de Relacionamento</h1>
            <p className="mt-2 text-text-secondary dark:text-slate-400 mb-6">Centralize informações de clientes, oportunidades e agendamentos.</p>

            <Tabs
                tabs={[
                    { id: 'clientes', label: 'Clientes' },
                    { id: 'pipeline', label: 'Pipeline' },
                    { id: 'agenda', label: 'Agenda' },
                ]}
                activeTab={view}
                // FIX: Pass an arrow function to satisfy the onTabClick prop type.
                onTabClick={(tabId) => setView(tabId)}
            />

            {renderView()}
        </div>
    );
};

export default CrmPage;