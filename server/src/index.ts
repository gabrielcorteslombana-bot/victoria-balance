import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import authRouter from './routes/auth.js';
import transactionsRouter from './routes/transactions.js';
import budgetsRouter from './routes/budgets.js';
import shoppingRouter from './routes/shopping.js';
import dashboardRouter from './routes/dashboard.js';
import metaRouter from './routes/meta.js';
import adminRouter from './routes/admin.js';
import { authMiddleware, requireActiveSubscription } from './middleware/auth.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Registro de rutas públicas / autenticación
app.use('/api/auth', authRouter);

// Rutas protegidas que requieren suscripción o período de prueba activo
app.use('/api/transactions', authMiddleware, requireActiveSubscription, transactionsRouter);
app.use('/api/budgets', authMiddleware, requireActiveSubscription, budgetsRouter);
app.use('/api/lists', authMiddleware, requireActiveSubscription, shoppingRouter);

// Dashboard y metadatos (lectura y gestión básica)
app.use('/api/dashboard', dashboardRouter);
app.use('/api', metaRouter);

// Panel exclusivo para administradores
app.use('/api/admin', adminRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    system: 'VICTORIA BALANCE',
    version: '2.0.0',
    timestamp: new Date().toISOString(),
  });
});

app.listen(PORT, () => {
  console.log(`VICTORIA BALANCE API Server corriendo en el puerto ${PORT}`);
});
