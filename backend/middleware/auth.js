const { verifyToken } = require('../config/jwt');
const User = require('../models/User');

/**
 * Middleware para autenticar usuários via JWT
 */
const authenticate = async (req, res, next) => {
  try {
    // Pegar token do header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Token de autenticação não fornecido',
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer '

    // Verificar token
    const decoded = verifyToken(token);
    
    if (!decoded) {
      return res.status(401).json({
        success: false,
        message: 'Token inválido ou expirado',
      });
    }

    // Buscar usuário
    const user = await User.findById(decoded.id);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Usuário não encontrado',
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Usuário desativado',
      });
    }

    // Adicionar usuário ao request
    req.user = user;
    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Erro na autenticação',
      error: error.message,
    });
  }
};

/**
 * Middleware para verificar se o usuário tem permissão para acessar determinada página
 */
const authorize = (...allowedPages) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Usuário não autenticado',
      });
    }

    // Admin tem acesso a tudo
    if (req.user.role === 'admin') {
      return next();
    }

    // Verificar permissões customizadas
    if (req.user.customPermissions && req.user.customPermissions.length > 0) {
      const hasPermission = allowedPages.some(page => 
        req.user.customPermissions.includes(page)
      );
      
      if (hasPermission) {
        return next();
      }
    } else {
      // Usar permissões do role
      const ROLE_PERMISSIONS = {
        vendedor: ['dashboard', 'quotes', 'orders', 'crm', 'stock'],
        producao: ['dashboard', 'orders', 'production', 'logistics', 'stock', 'suppliers'],
        aux_administrativo: [
          'dashboard', 'quotes', 'orders', 'logistics', 'suppliers',
          'crm', 'finance', 'invoices', 'receipts', 'catalog'
        ],
      };

      const userPermissions = ROLE_PERMISSIONS[req.user.role] || [];
      const hasPermission = allowedPages.some(page => userPermissions.includes(page));
      
      if (hasPermission) {
        return next();
      }
    }

    return res.status(403).json({
      success: false,
      message: 'Você não tem permissão para acessar este recurso',
    });
  };
};

/**
 * Middleware para verificar se o usuário é admin
 */
const isAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Usuário não autenticado',
    });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Acesso negado. Apenas administradores',
    });
  }

  next();
};

module.exports = {
  authenticate,
  authorize,
  isAdmin,
};

