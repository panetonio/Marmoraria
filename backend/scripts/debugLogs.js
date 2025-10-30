const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/marmoraria_erp');
  console.log('Conectado ao MongoDB');
};

const ActivityLog = require('../models/ActivityLog');

const main = async () => {
  await connectDB();
  
  // Verificar logs criados
  const logs = await ActivityLog.find({ action: 'service_order_status_updated' });
  console.log('Logs encontrados:', logs.length);
  if (logs.length > 0) {
    console.log('Primeiro log:', JSON.stringify(logs[0], null, 2));
  }
  
  // Testar pipeline simples
  const pipeline = [
    { $match: { action: 'service_order_status_updated' } },
    { $group: { _id: '$serviceOrder', count: { $sum: 1 } } }
  ];
  
  const result = await ActivityLog.aggregate(pipeline);
  console.log('Resultado pipeline simples:', result);
  
  await mongoose.connection.close();
};

main().catch(console.error);
