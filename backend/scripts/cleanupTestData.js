const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/marmoraria_erp');
  console.log('Conectado ao MongoDB');
};

const ServiceOrder = require('../models/ServiceOrder');
const ProductionEmployee = require('../models/ProductionEmployee');

const main = async () => {
  await connectDB();
  
  // Limpar dados de teste
  await ServiceOrder.deleteMany({ id: { $regex: 'OS-TEST-EMP-' } });
  await ProductionEmployee.deleteMany({ email: { $regex: '@teste.com' } });
  
  console.log('Dados de teste limpos');
  await mongoose.connection.close();
};

main().catch(console.error);
