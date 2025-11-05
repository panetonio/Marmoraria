import React, { useState, useEffect } from 'react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Modal from '../components/ui/Modal';
import Badge from '../components/ui/Badge';
import { ROLES } from '../roles';
import type { AuthUser, Role, Page } from '../types';
import { api } from '../utils/api';
import { formatDate } from '../utils/dateFormat';

const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPermissionsModalOpen, setIsPermissionsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AuthUser | null>(null);
  const [selectedUserForPermissions, setSelectedUserForPermissions] = useState<AuthUser | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'vendedor' as Role,
  });

  const [customPermissions, setCustomPermissions] = useState<Page[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Carregar usuários
  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await api.getUsers();
      if (result.success) {
        // Mapear IDs do MongoDB para o formato esperado
        const mappedUsers = result.data.map((u: any) => ({
          id: u._id || u.id,
          name: u.name,
          email: u.email,
          password: '',
          role: u.role,
          customPermissions: u.customPermissions,
          isActive: u.isActive,
          createdAt: u.createdAt,
        }));
        setUsers(mappedUsers);
      } else {
        setError('Erro ao carregar usuários');
      }
    } catch (err) {
      setError('Erro de conexão com o servidor');
      console.error('Erro ao carregar usuários:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (user?: AuthUser) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        name: user.name,
        email: user.email,
        password: '',
        role: user.role,
      });
    } else {
      setEditingUser(null);
      setFormData({
        name: '',
        email: '',
        password: '',
        role: 'vendedor',
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingUser(null);
    setFormData({
      name: '',
      email: '',
      password: '',
      role: 'vendedor',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      if (editingUser) {
        // Atualizar usuário existente
        const updateData: any = {
          name: formData.name,
          email: formData.email,
          role: formData.role,
        };
        
        // Só incluir senha se foi fornecida
        if (formData.password) {
          updateData.password = formData.password;
        }

        const result = await api.updateUser(editingUser.id, updateData);
        if (result.success) {
          await loadUsers();
          handleCloseModal();
        } else {
          setError(result.message || 'Erro ao atualizar usuário');
        }
      } else {
        // Criar novo usuário
        const result = await api.createUser({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role: formData.role,
        });

        if (result.success) {
          await loadUsers();
          handleCloseModal();
        } else {
          setError(result.message || 'Erro ao criar usuário');
        }
      }
    } catch (err) {
      setError('Erro de conexão com o servidor');
      console.error('Erro ao salvar usuário:', err);
    }
  };

  const handleToggleActive = async (userId: string) => {
    try {
      const result = await api.toggleUserStatus(userId);
      if (result.success) {
        await loadUsers();
      } else {
        setError('Erro ao alterar status do usuário');
      }
    } catch (err) {
      setError('Erro de conexão com o servidor');
      console.error('Erro ao alterar status:', err);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (window.confirm('Tem certeza que deseja excluir este usuário?')) {
      try {
        const result = await api.deleteUser(userId);
        if (result.success) {
          await loadUsers();
        } else {
          setError('Erro ao excluir usuário');
        }
      } catch (err) {
        setError('Erro de conexão com o servidor');
        console.error('Erro ao excluir usuário:', err);
      }
    }
  };

  const handleOpenPermissionsModal = (user: AuthUser) => {
    setSelectedUserForPermissions(user);
    setCustomPermissions(user.customPermissions || []);
    setIsPermissionsModalOpen(true);
  };

  const handleClosePermissionsModal = () => {
    setIsPermissionsModalOpen(false);
    setSelectedUserForPermissions(null);
    setCustomPermissions([]);
  };

  const handleTogglePermission = (page: Page) => {
    setCustomPermissions(prev => {
      if (prev.includes(page)) {
        return prev.filter(p => p !== page);
      } else {
        return [...prev, page];
      }
    });
  };

  const handleSavePermissions = async () => {
    if (!selectedUserForPermissions) return;

    try {
      const result = await api.updateUserPermissions(
        selectedUserForPermissions.id,
        customPermissions.length > 0 ? customPermissions : []
      );

      if (result.success) {
        await loadUsers();
        handleClosePermissionsModal();
      } else {
        setError('Erro ao atualizar permissões');
      }
    } catch (err) {
      setError('Erro de conexão com o servidor');
      console.error('Erro ao atualizar permissões:', err);
    }
  };

  const handleClearCustomPermissions = async () => {
    if (!selectedUserForPermissions) return;
    
    if (window.confirm('Deseja remover as permissões personalizadas? O usuário voltará a usar as permissões do seu cargo.')) {
      try {
        const result = await api.updateUserPermissions(selectedUserForPermissions.id, []);
        
        if (result.success) {
          await loadUsers();
          handleClosePermissionsModal();
        } else {
          setError('Erro ao limpar permissões');
        }
      } catch (err) {
        setError('Erro de conexão com o servidor');
        console.error('Erro ao limpar permissões:', err);
      }
    }
  };

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const availablePages: { key: Page; label: string }[] = [
    { key: 'dashboard', label: 'Dashboard' },
    { key: 'quotes', label: 'Orçamentos' },
    { key: 'orders', label: 'Pedidos' },
    { key: 'production', label: 'Produção' },
    { key: 'logistics', label: 'Logística' },
    { key: 'stock', label: 'Estoque' },
    { key: 'catalog', label: 'Catálogo' },
    { key: 'suppliers', label: 'Fornecedores' },
    { key: 'crm', label: 'CRM' },
    { key: 'finance', label: 'Financeiro' },
    { key: 'invoices', label: 'Notas Fiscais' },
    { key: 'receipts', label: 'Recibos' },
    { key: 'users', label: 'Usuários' },
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">
            Gerenciamento de Usuários
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Gerencie usuários e suas permissões de acesso
          </p>
        </div>
        <Button onClick={() => handleOpenModal()}>
          + Novo Usuário
        </Button>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <Card className="mb-6 p-4">
        <Input
          id="search"
          label="Buscar usuário"
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Nome ou email..."
        />
      </Card>

      {loading && (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      )}

      {!loading && (
        <div className="grid gap-4">
        {filteredUsers.map(user => (
          <Card key={user.id} className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-lg font-semibold text-slate-800 dark:text-white">
                    {user.name}
                  </h3>
                  {!user.isActive && (
                    <Badge variant="danger">Inativo</Badge>
                  )}
                  {user.customPermissions && user.customPermissions.length > 0 && (
                    <Badge variant="info">Permissões Customizadas</Badge>
                  )}
                </div>
                
                <p className="text-slate-600 dark:text-slate-400 text-sm mb-1">
                  {user.email}
                </p>
                
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="primary">
                    {ROLES[user.role].displayName}
                  </Badge>
                  <span className="text-xs text-slate-500 dark:text-slate-500">
                    Criado em {formatDate(user.createdAt)}
                  </span>
                </div>

                {user.customPermissions && user.customPermissions.length > 0 && (
                  <div className="mt-3">
                    <p className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Acesso às páginas:
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {user.customPermissions.map(page => {
                        const pageInfo = availablePages.find(p => p.key === page);
                        return (
                          <span
                            key={page}
                            className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 px-2 py-1 rounded"
                          >
                            {pageInfo?.label || page}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-2 ml-4">
                <Button
                  variant="secondary"
                  onClick={() => handleOpenPermissionsModal(user)}
                  title="Gerenciar Permissões"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                  </svg>
                </Button>
                
                <Button
                  variant="secondary"
                  onClick={() => handleOpenModal(user)}
                  title="Editar"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                  </svg>
                </Button>

                <Button
                  variant={user.isActive ? 'warning' : 'success'}
                  onClick={() => handleToggleActive(user.id)}
                  title={user.isActive ? 'Desativar' : 'Ativar'}
                >
                  {user.isActive ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  )}
                </Button>

                {user.id !== 'user-1' && ( // Não permitir excluir o admin padrão
                  <Button
                    variant="danger"
                    onClick={() => handleDeleteUser(user.id)}
                    title="Excluir"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </Button>
                )}
              </div>
            </div>
          </Card>
        ))}

          {filteredUsers.length === 0 && (
            <Card className="p-8 text-center">
              <p className="text-slate-500 dark:text-slate-400">
                Nenhum usuário encontrado
              </p>
            </Card>
          )}
        </div>
      )}

      {/* Modal de Criar/Editar Usuário */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingUser ? 'Editar Usuário' : 'Novo Usuário'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}
          <Input
            id="name"
            label="Nome Completo"
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />

          <Input
            id="email"
            label="Email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
          />

          <Input
            id="password"
            label={editingUser ? 'Nova Senha (deixe em branco para manter)' : 'Senha'}
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            required={!editingUser}
          />

          <Select
            id="role"
            label="Cargo"
            value={formData.role}
            onChange={(e) => setFormData({ ...formData, role: e.target.value as Role })}
          >
            {Object.entries(ROLES).map(([key, value]) => (
              <option key={key} value={key}>
                {value.displayName}
              </option>
            ))}
          </Select>

          <div className="flex justify-end gap-2 mt-6">
            <Button type="button" variant="secondary" onClick={handleCloseModal}>
              Cancelar
            </Button>
            <Button type="submit">
              {editingUser ? 'Salvar' : 'Criar'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal de Permissões */}
      <Modal
        isOpen={isPermissionsModalOpen}
        onClose={handleClosePermissionsModal}
        title={`Permissões de ${selectedUserForPermissions?.name}`}
      >
        <div className="space-y-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <p className="text-sm text-blue-900 dark:text-blue-300">
              <strong>Cargo:</strong> {selectedUserForPermissions && ROLES[selectedUserForPermissions.role].displayName}
            </p>
            <p className="text-xs text-blue-700 dark:text-blue-400 mt-2">
              Por padrão, o usuário tem acesso às páginas definidas pelo cargo. 
              Você pode personalizar o acesso selecionando páginas específicas abaixo.
            </p>
          </div>

          <div>
            <p className="font-medium text-slate-700 dark:text-slate-300 mb-3">
              Selecione as páginas que o usuário pode acessar:
            </p>
            
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {availablePages.map(({ key, label }) => (
                <label
                  key={key}
                  className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={customPermissions.includes(key)}
                    onChange={() => handleTogglePermission(key)}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-sm text-slate-700 dark:text-slate-300">
                    {label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex justify-between gap-2 mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
            <Button
              type="button"
              variant="danger"
              onClick={handleClearCustomPermissions}
              disabled={!selectedUserForPermissions?.customPermissions}
            >
              Limpar Personalizações
            </Button>
            <div className="flex gap-2">
              <Button type="button" variant="secondary" onClick={handleClosePermissionsModal}>
                Cancelar
              </Button>
              <Button type="button" onClick={handleSavePermissions}>
                Salvar Permissões
              </Button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default UsersPage;

