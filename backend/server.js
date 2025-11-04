require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const connectDB = require('./config/database');
const errorHandler = require('./middleware/errorHandler');

// Conectar ao banco de dados
connectDB();

const app = express();

// Middlewares de segurança
// Configurar Helmet com políticas CSP que permitem scripts inline do React/Vite
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'",
        "'unsafe-inline'", // Necessário para React/Vite
        "'unsafe-eval'", // Necessário para desenvolvimento
        "https://cdn.tailwindcss.com", // Tailwind CSS
        "https://cdn.jsdelivr.net", // Ant Design CSS
      ],
      styleSrc: [
        "'self'",
        "'unsafe-inline'", // Necessário para CSS inline
        "https://cdn.tailwindcss.com",
        "https://cdn.jsdelivr.net",
      ],
      imgSrc: ["'self'", "data:", "blob:", "https:"],
      fontSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "http://localhost:5000", "https:"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      frameAncestors: ["'none'"],
    },
  },
}));

// CORS - Liberado para qualquer origem
app.use(cors({
  origin: true, // Permite qualquer origem
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Rate limiting - DESABILITADO TEMPORARIAMENTE PARA DESENVOLVIMENTO
// const limiter = rateLimit({
//   windowMs: 15 * 60 * 1000, // 15 minutos
//   max: 1000, // Limite de 1000 requisições por IP (aumentado para desenvolvimento)
//   message: 'Muitas requisições deste IP, tente novamente em 15 minutos',
// });
// app.use('/api', limiter);

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Servir arquivos estáticos (uploads)
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));
// Servir arquivos estáticos da NF-e simulada
app.use('/nfe_simulada', express.static(path.join(__dirname, 'public/nfe_simulada')));
// Servir arquivos estáticos do frontend (build)
app.use(express.static(path.join(__dirname, 'public/frontend')));

// Rotas
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/clients', require('./routes/clients'));
app.use('/api/suppliers', require('./routes/suppliers'));
app.use('/api/quotes', require('./routes/quotes'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/order-addendums', require('./routes/orderAddendums'));
app.use('/api/serviceorders', require('./routes/serviceOrders'));
app.use('/api/vehicles', require('./routes/vehicles'));
app.use('/api/delivery-routes', require('./routes/deliveryRoutes'));
app.use('/api/production-employees', require('./routes/productionEmployees'));
app.use('/api/assets', require('./routes/assets'));
app.use('/api/cut-pieces', require('./routes/cutPieces'));
app.use('/api/checklist-templates', require('./routes/checklistTemplates'));
app.use('/api/materials', require('./routes/materials'));
app.use('/api/uploads', require('./routes/uploads'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/invoices', require('./routes/invoices'));
app.use('/api/financial-transactions', require('./routes/financialTransactions'));
app.use('/api/contracts', require('./routes/contracts'));

// Rota de teste da API (mantida para compatibilidade)
app.get('/api', (req, res) => {
  res.json({
    success: true,
    message: 'API Marmoraria ERP',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      users: '/api/users',
      clients: '/api/clients',
      suppliers: '/api/suppliers',
      quotes: '/api/quotes',
      orders: '/api/orders',
      uploads: '/api/uploads',
    },
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'OK',
    timestamp: new Date().toISOString(),
  });
});

// Rota catch-all: servir index.html para todas as rotas que não são API
// Isso permite que o React Router funcione corretamente
app.get('*', (req, res) => {
  // Se for uma rota de API, retornar 404 JSON
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({
      success: false,
      message: 'Rota da API não encontrada',
    });
  }
  // Caso contrário, servir o index.html do frontend (para React Router)
  res.sendFile(path.join(__dirname, 'public/frontend/index.html'));
});

// Error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`🌍 Ambiente: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📡 CORS habilitado para:`);
  console.log(`   - http://localhost:3000`);
  console.log(`   - http://localhost:5173`);
  if (process.env.CORS_ORIGIN) {
    console.log(`   - ${process.env.CORS_ORIGIN}`);
  }
  console.log(`\n✅ API disponível em: http://localhost:${PORT}/api`);
  console.log(`🌐 Frontend disponível em: http://localhost:${PORT}`);
  console.log(`📚 Endpoints principais:`);
  console.log(`   - POST   /api/auth/register   (Registrar)`);
  console.log(`   - POST   /api/auth/login      (Login)`);
  console.log(`   - GET    /api/auth/me         (Perfil)`);
  console.log(`   - GET    /api/users           (Listar usuários - Admin)`);
  console.log(`   - GET    /api/clients         (Listar clientes)`);
  console.log(`   - GET    /api/suppliers       (Listar fornecedores)`);
  console.log(`   - GET    /api/quotes          (Listar orçamentos)`);
  console.log(`   - GET    /api/orders          (Listar pedidos)`);
});

