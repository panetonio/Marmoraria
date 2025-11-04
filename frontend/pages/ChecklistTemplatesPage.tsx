import React, { useEffect, useMemo, useState } from 'react';
import Card, { CardContent, CardHeader } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Badge from '../components/ui/Badge';
import { useData } from '../context/DataContext';
import type { ChecklistTemplate } from '../types';

interface ChecklistFormState {
  name: string;
  type: 'entrega' | 'montagem';
  items: string[];
}

const initialFormState: ChecklistFormState = {
  name: '',
  type: 'entrega',
  items: [''],
};

const ChecklistTemplatesPage: React.FC = () => {
  const { checklistTemplates, createChecklistTemplate, updateChecklistTemplate, deleteChecklistTemplate } = useData();
  const [formState, setFormState] = useState<ChecklistFormState>(initialFormState);
  const [editingTemplate, setEditingTemplate] = useState<ChecklistTemplate | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (!editingTemplate) {
      setFormState(initialFormState);
      return;
    }

    setFormState({
      name: editingTemplate.name,
      type: editingTemplate.type,
      items: editingTemplate.items.length > 0
        ? editingTemplate.items.map(item => item.text)
        : [''],
    });
  }, [editingTemplate]);

  const sortedTemplates = useMemo(() => {
    return [...checklistTemplates].sort((a, b) => a.name.localeCompare(b.name));
  }, [checklistTemplates]);

  const handleItemChange = (index: number, value: string) => {
    setFormState(prev => {
      const nextItems = [...prev.items];
      nextItems[index] = value;
      return { ...prev, items: nextItems };
    });
  };

  const handleAddItem = () => {
    setFormState(prev => ({ ...prev, items: [...prev.items, ''] }));
  };

  const handleRemoveItem = (index: number) => {
    setFormState(prev => {
      if (prev.items.length === 1) {
        return prev;
      }
      const nextItems = prev.items.filter((_, itemIndex) => itemIndex !== index);
      return { ...prev, items: nextItems };
    });
  };

  const resetForm = () => {
    setEditingTemplate(null);
    setFormState(initialFormState);
    setErrorMessage('');
    setFeedbackMessage('');
  };

  const buildPayload = () => ({
    name: formState.name.trim(),
    type: formState.type,
    items: formState.items
      .map(item => item.trim())
      .filter(item => item.length > 0)
      .map(text => ({ text })),
  });

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrorMessage('');
    setFeedbackMessage('');

    const trimmedName = formState.name.trim();
    const normalizedItems = formState.items.map(item => item.trim()).filter(item => item.length > 0);

    if (trimmedName.length === 0) {
      setErrorMessage('Informe um nome para o checklist.');
      return;
    }

    if (normalizedItems.length === 0) {
      setErrorMessage('Adicione ao menos um item ao checklist.');
      return;
    }

    setIsSubmitting(true);

    try {
      if (editingTemplate) {
        const result = await updateChecklistTemplate(editingTemplate.id, buildPayload());
        if (result.success) {
          setFeedbackMessage(result.message || 'Modelo atualizado com sucesso.');
          setEditingTemplate(null);
          setFormState(initialFormState);
        } else {
          setErrorMessage(result.message || 'Não foi possível atualizar o modelo.');
        }
      } else {
        const result = await createChecklistTemplate(buildPayload());
        if (result.success) {
          setFeedbackMessage(result.message || 'Modelo criado com sucesso.');
          setFormState(initialFormState);
        } else {
          setErrorMessage(result.message || 'Não foi possível criar o modelo.');
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (template: ChecklistTemplate) => {
    const confirmed = window.confirm(`Deseja remover o checklist "${template.name}"?`);
    if (!confirmed) {
      return;
    }

    setIsDeletingId(template.id);
    setFeedbackMessage('');
    setErrorMessage('');

    try {
      const result = await deleteChecklistTemplate(template.id);
      if (result.success) {
        setFeedbackMessage(result.message || 'Modelo removido com sucesso.');
        if (editingTemplate?.id === template.id) {
          resetForm();
        }
      } else {
        setErrorMessage(result.message || 'Não foi possível remover o modelo.');
      }
    } finally {
      setIsDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-text-primary dark:text-slate-100">Modelos de Checklist</h1>
          <p className="mt-2 text-text-secondary dark:text-slate-400">
            Cadastre e edite checklists padronizados para as equipes de entrega e montagem utilizarem no tablet.
          </p>
        </div>
        {editingTemplate && (
          <Button variant="ghost" onClick={resetForm}>
            Cancelar edição
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-0">
          <CardHeader>
            {editingTemplate ? `Editar Checklist: ${editingTemplate.name}` : 'Novo Checklist'}
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              <Input
                id="checklist-name"
                label="Nome do Checklist"
                placeholder="Ex.: Conferência de Saída para Entrega"
                value={formState.name}
                onChange={event => setFormState(prev => ({ ...prev, name: event.target.value }))}
              />

              <Select
                id="checklist-type"
                label="Tipo"
                value={formState.type}
                onChange={event => setFormState(prev => ({ ...prev, type: event.target.value as 'entrega' | 'montagem' }))}
              >
                <option value="entrega">Entrega</option>
                <option value="montagem">Montagem</option>
              </Select>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-text-secondary dark:text-slate-400">
                    Itens do Checklist
                  </label>
                  <Button type="button" variant="ghost" onClick={handleAddItem}>
                    + Adicionar Item
                  </Button>
                </div>

                <div className="space-y-3">
                  {formState.items.map((item, index) => (
                    <div key={`item-${index}`} className="flex items-center gap-3">
                      <Input
                        id={`checklist-item-${index}`}
                        label={`Item ${index + 1}`}
                        placeholder="Descreva a etapa ou conferência..."
                        value={item}
                        onChange={event => handleItemChange(index, event.target.value)}
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        onClick={() => handleRemoveItem(index)}
                        disabled={formState.items.length === 1}
                        title="Remover item"
                      >
                        Remover
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              {errorMessage && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 text-sm text-red-700 dark:text-red-300">
                  {errorMessage}
                </div>
              )}

              {feedbackMessage && !errorMessage && (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3 text-sm text-green-700 dark:text-green-300">
                  {feedbackMessage}
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
                <Button type="submit" disabled={isSubmitting} className="min-w-[160px]">
                  {editingTemplate ? 'Salvar Alterações' : 'Criar Checklist'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card className="p-0">
          <CardHeader>Modelos Cadastrados</CardHeader>
          <CardContent className="space-y-4">
            {sortedTemplates.length === 0 ? (
              <p className="text-sm text-text-secondary dark:text-slate-400">
                Nenhum modelo cadastrado até o momento. Crie um checklist ao lado para começar.
              </p>
            ) : (
              sortedTemplates.map(template => (
                <div
                  key={template.id}
                  className="border border-border dark:border-slate-700 rounded-lg p-4 hover:border-primary/50 transition"
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                    <div>
                      <h3 className="text-lg font-semibold text-text-primary dark:text-slate-100">
                        {template.name}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant={template.type === 'entrega' ? 'primary' : 'warning'}>
                          {template.type === 'entrega' ? 'Entrega' : 'Montagem'}
                        </Badge>
                        <span className="text-xs text-text-secondary dark:text-slate-400">
                          {template.items.length} item{template.items.length === 1 ? '' : 's'}
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => setEditingTemplate(template)}
                      >
                        Editar
                      </Button>
                      <Button
                        type="button"
                        variant="destructive"
                        onClick={() => handleDelete(template)}
                        disabled={isDeletingId === template.id}
                      >
                        {isDeletingId === template.id ? 'Removendo...' : 'Excluir'}
                      </Button>
                    </div>
                  </div>

                  {template.items.length > 0 && (
                    <ul className="mt-3 space-y-2 bg-slate-50 dark:bg-slate-800/50 rounded-md p-3">
                      {template.items.map((item, index) => (
                        <li key={item.id || `${template.id}-item-${index}`} className="text-sm text-text-secondary dark:text-slate-300">
                          • {item.text}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ChecklistTemplatesPage;
