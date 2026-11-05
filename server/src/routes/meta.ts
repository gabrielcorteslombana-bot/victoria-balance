import { Router } from 'express';
import { z } from 'zod';
import { Decimal } from 'decimal.js';
import { prisma } from '../prisma.js';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.js';
import { getOrCreatePeriod } from '../services/periods.js';
import { logAudit } from '../services/audit.js';

const router = Router();

// Endpoint público o autenticado para categories
router.get('/categories', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.userId!;
    const categories = await prisma.category.findMany({
      where: {
        OR: [{ userId: null }, { userId }],
        isActive: true,
      },
      orderBy: { name: 'asc' },
    });
    return res.json({ categories });
  } catch (error) {
    return res.status(500).json({ error: 'Error al obtener categorías.' });
  }
});

// GET /api/periods - Listar períodos
router.get('/periods', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.userId!;
    const periods = await prisma.financialPeriod.findMany({
      where: { userId },
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
    });
    return res.json({ periods });
  } catch (error) {
    return res.status(500).json({ error: 'Error al obtener períodos.' });
  }
});

// POST /api/periods/opening-balance - Configurar saldo inicial
router.post('/periods/opening-balance', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.userId!;
    const { year, month, openingBalance } = req.body;
    if (openingBalance === undefined) return res.status(400).json({ error: 'Saldo inicial requerido.' });

    const refDate = new Date(Date.UTC(year, month - 1, 1));
    const period = await getOrCreatePeriod(userId, refDate);

    const updated = await prisma.financialPeriod.update({
      where: { id: period.id },
      data: { openingBalance: new Decimal(openingBalance).toFixed(2) },
    });

    return res.json({ period: updated });
  } catch (error) {
    return res.status(500).json({ error: 'Error al actualizar saldo inicial.' });
  }
});

// POST /api/periods/:id/toggle-status - Cerrar o Reabrir período
router.post('/periods/:id/toggle-status', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.userId!;
    const { id } = req.params;

    const period = await prisma.financialPeriod.findFirst({ where: { id, userId } });
    if (!period) return res.status(404).json({ error: 'Período no encontrado.' });

    const nextStatus = period.status === 'OPEN' ? 'CLOSED' : 'OPEN';
    const updated = await prisma.financialPeriod.update({
      where: { id },
      data: { status: nextStatus },
    });

    await logAudit({
      userId,
      entity: 'FINANCIAL_PERIOD',
      entityId: id,
      action: 'UPDATE',
      previousValues: { status: period.status },
      newValues: { status: nextStatus },
    });

    return res.json({
      message: `Período ${updated.year}-${String(updated.month).padStart(2, '0')} ahora está ${nextStatus}.`,
      period: updated,
    });
  } catch (error) {
    return res.status(500).json({ error: 'Error al cambiar estado del período.' });
  }
});

// POST /api/reconciliations - Realizar conciliación financiera
const reconcileSchema = z.object({
  year: z.number().int(),
  month: z.number().int().min(1).max(12),
  reportedOutflow: z.union([z.number(), z.string()]).refine((val) => {
    try {
      return new Decimal(val).isPositive() || new Decimal(val).isZero();
    } catch {
      return false;
    }
  }, 'Egreso bancario debe ser mayor o igual a cero'),
});

router.post('/reconciliations', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.userId!;
    const body = reconcileSchema.parse(req.body);

    const refDate = new Date(Date.UTC(body.year, body.month - 1, 1));
    const period = await getOrCreatePeriod(userId, refDate);

    // Suma real de gastos en el período
    const startDate = new Date(Date.UTC(body.year, body.month - 1, 1, 0, 0, 0));
    const endDate = new Date(Date.UTC(body.year, body.month, 0, 23, 59, 59, 999));

    const expenses = await prisma.transaction.findMany({
      where: {
        userId,
        type: 'EXPENSE',
        date: { gte: startDate, lte: endDate },
      },
    });

    let registeredExpenses = new Decimal(0);
    for (const exp of expenses) {
      registeredExpenses = registeredExpenses.plus(new Decimal(exp.amount.toString()));
    }

    const reportedOutflow = new Decimal(body.reportedOutflow);

    let status = 'CONCILIADO';
    let difference = new Decimal(0);

    if (reportedOutflow.greaterThan(registeredExpenses)) {
      status = 'CON_DIFERENCIAS_NO_IDENTIFICADAS';
      difference = reportedOutflow.minus(registeredExpenses);
    } else if (registeredExpenses.greaterThan(reportedOutflow)) {
      status = 'INCONSISTENCIA_SOBRE_REGISTRO';
      difference = registeredExpenses.minus(reportedOutflow);
    }

    const reconciliation = await prisma.reconciliation.create({
      data: {
        userId,
        periodId: period.id,
        reportedOutflow: reportedOutflow.toFixed(2),
        registeredExpenses: registeredExpenses.toFixed(2),
        difference: difference.toFixed(2),
        status,
      },
    });

    return res.status(201).json({ reconciliation });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors.map((e) => e.message).join(', ') });
    }
    return res.status(500).json({ error: 'Error al procesar la conciliación.' });
  }
});

// GET /api/reconciliations - Consultar conciliaciones de un período
router.get('/reconciliations', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.userId!;
    const reconciliations = await prisma.reconciliation.findMany({
      where: { userId },
      include: { period: true },
      orderBy: { createdAt: 'desc' },
    });
    return res.json({ reconciliations });
  } catch (error) {
    return res.status(500).json({ error: 'Error al obtener conciliaciones.' });
  }
});

export default router;
