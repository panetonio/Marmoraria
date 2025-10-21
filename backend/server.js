require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/database');
const errorHandler = require('./middleware/errorHandler');

// Conectar ao banco de dados
connectDB();

const app = express();

// Middlewares de segurança
app.use(helmet());

// CORS - Aceita múltiplas origens para desenvolvimento
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  process.env.CORS_ORIGIN
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // Permitir requisições sem origin (como Postman) ou de origens permitidas
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // Limite de 100 requisições por IP
  message: 'Muitas requisições deste IP, tente novamente em 15 minutos',
});
app.use('/api', limiter);

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rotas
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/clients', require('./routes/clients'));
app.use('/api/suppliers', require('./routes/suppliers'));
app.use('/api/quotes', require('./routes/quotes'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/serviceorders', require('./routes/serviceOrders'));
app.use('/api/vehicles', require('./routes/vehicles'));
app.use('/api/delivery-routes', require('./routes/deliveryRoutes'));
app.use('/api/stock', require('./routes/stock'));
app.use('/api/checklist-templates', require('./routes/checklistTemplates'));

// Rota de teste
app.get('/', (req, res) => {
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

// 404
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Rota não encontrada',
  });
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
  console.log(`\n✅ API disponível em: http://localhost:${PORT}`);
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

