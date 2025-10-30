import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import Select from '../components/ui/Select';
import { ROLES } from '../roles';
import type { Role } from '../types';
import toast from 'react-hot-toast';

interface RegisterPageProps {
  onLoginClick: () => void;
}

const RegisterPage: React.FC<RegisterPageProps> = ({ onLoginClick }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<Role>('vendedor');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validações
    if (password !== confirmPassword) {
      toast.error('As senhas não coincidem');
      return;
    }

    if (password.length < 6) {
      toast.error('A senha deve ter pelo menos 6 caracteres');
      return;
    }

    setLoading(true);

    try {
      const registered = await register({
        name,
        email,
        password,
        role,
      });

      if (registered) {
        setName('');
        setEmail('');
        setPassword('');
        setConfirmPassword('');
        setRole('vendedor');
        
        // Redirecionar para login após 2 segundos
        setTimeout(() => {
          onLoginClick();
        }, 2000);
      }
    } catch (err) {
      // Erro já tratado pelo toast no AuthContext
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-900 dark:to-slate-800 px-4 py-8">
      <Card className="w-full max-w-md p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-2">
            Criar Conta
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Preencha os dados abaixo
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Input
              id="name"
              label="Nome Completo"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="João Silva"
              required
            />
          </div>

          <div>
            <Input
              id="email"
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              required
            />
          </div>

          <div>
            <Select
              id="role"
              label="Função"
              value={role}
              onChange={(e) => setRole(e.target.value as Role)}
            >
              {Object.entries(ROLES).map(([key, value]) => (
                <option key={key} value={key}>
                  {value.displayName}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <Input
              id="password"
              label="Senha"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          <div>
            <Input
              id="confirmPassword"
              label="Confirmar Senha"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>


          <Button
            type="submit"
            className="w-full"
            disabled={loading}
          >
            {loading ? 'Criando conta...' : 'Criar Conta'}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Já tem uma conta?{' '}
            <button
              type="button"
              onClick={onLoginClick}
              className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
            >
              Fazer login
            </button>
          </p>
        </div>
      </Card>
    </div>
  );
};

export default RegisterPage;

