import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import type { AuthUser, Page } from '../types';
import { ROLES, PERMISSIONS } from '../roles';
import { api, validateToken } from '../utils/api';
import toast from 'react-hot-toast';

interface AuthContextType {
  currentUser: AuthUser | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  register: (userData: Omit<AuthUser, 'id' | 'createdAt' | 'isActive'>) => Promise<boolean>;
  hasAccessToPage: (page: Page) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'token';
const USER_KEY = 'user';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Verificar token ao carregar
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem(TOKEN_KEY);
      const storedUser = localStorage.getItem(USER_KEY);

      if (token && storedUser) {
        try {
          // Validar token com o backend usando função especial que não redireciona
          const result = await validateToken();
          
          if (result.success && result.data) {
            const user: AuthUser = {
              id: result.data.user.id,
              name: result.data.user.name,
              email: result.data.user.email,
              password: '', // Não armazenar senha
              role: result.data.user.role,
              customPermissions: result.data.user.customPermissions,
              isActive: result.data.user.isActive,
              createdAt: result.data.user.createdAt,
            };
            setCurrentUser(user);
          } else {
            // Token inválido, limpar
            localStorage.removeItem(TOKEN_KEY);
            localStorage.removeItem(USER_KEY);
          }
          setIsLoading(false);
        } catch (error) {
          console.error('Erro ao validar token:', error);
          // Limpar dados mesmo em caso de erro
          localStorage.removeItem(TOKEN_KEY);
          localStorage.removeItem(USER_KEY);
          setIsLoading(false);
        }
      } else {
        setIsLoading(false);
      }
    };

    checkAuth();
    
    // Timeout de segurança para evitar loading infinito
    const timeout = setTimeout(() => {
      console.warn('Timeout ao verificar autenticação, limpando estado de loading');
      setIsLoading(false);
    }, 10000);
    
    return () => clearTimeout(timeout);
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const result = await api.login(email, password);
      
      if (result.success && result.data) {
        const user: AuthUser = {
          id: result.data.user.id,
          name: result.data.user.name,
          email: result.data.user.email,
          password: '', // Não armazenar senha
          role: result.data.user.role,
          customPermissions: result.data.user.customPermissions || [],
          isActive: result.data.user.isActive,
          createdAt: result.data.user.createdAt,
        };
        
        setCurrentUser(user);
        localStorage.setItem(TOKEN_KEY, result.data.token);
        localStorage.setItem(USER_KEY, JSON.stringify(user));
        toast.success('Login realizado com sucesso!');
        return true;
      }
      toast.error('Email ou senha incorretos');
      return false;
    } catch (error) {
      console.error('Erro no login:', error);
      toast.error('Erro ao fazer login. Tente novamente.');
      return false;
    }
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  };

  const register = async (
    userData: Omit<AuthUser, 'id' | 'createdAt' | 'isActive'>
  ): Promise<boolean> => {
    try {
      const result = await api.register({
        name: userData.name,
        email: userData.email,
        password: userData.password,
        role: userData.role,
      });
      
      if (result.success) {
        toast.success('Conta criada com sucesso! Redirecionando...');
        return true;
      }
      toast.error('Este email já está cadastrado');
      return false;
    } catch (error) {
      console.error('Erro no registro:', error);
      toast.error('Erro ao criar conta. Tente novamente.');
      return false;
    }
  };

  const hasAccessToPage = (page: Page): boolean => {
    if (!currentUser) return false;
    
    // Se o usuário tem permissões customizadas, usa elas
    if (currentUser.customPermissions && currentUser.customPermissions.length > 0) {
      return currentUser.customPermissions.includes(page);
    }
    
    // Caso contrário, usa as permissões do role
    const requiredPermission = PERMISSIONS[page];
    return ROLES[currentUser.role].permissions.includes(requiredPermission);
  };

  const value = {
    currentUser,
    isAuthenticated: !!currentUser,
    login,
    logout,
    register,
    hasAccessToPage,
  };

  // Mostrar loading durante verificação inicial
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-slate-600 dark:text-slate-400">Carregando...</p>
        </div>
      </div>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

