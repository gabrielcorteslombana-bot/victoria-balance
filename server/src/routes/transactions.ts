import { Router } from 'express';
import { z } from 'zod';
import { Decimal } from 'decimal.js';
import { prisma } from '../prisma.js';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.js';
import { getOrCreatePeriod } from '../services/periods.js';
import { logAudit } from '../services/audit.js';

const router = Router();
router.use(authMiddleware);

// Esquema de validación para transacciones
const transactionSchema = z.object({
  type: z.enum(['INCOME', 'EXPENSE'], {
    errorMap: () => ({ message: 'Tipo debe ser INCOME o EXPENSE' }),
  }),
  date: z.string().optional(), // ISO date o YYYY-MM-DD
  concept: z.string().optional(),
  amount: z.union([z.number(), z.string()]).refine((val) => {
    try {
      const d = new Decimal(val);
      return d.isPositive() && !d.isZero();
    } catch {
      return false;
    }
  }, 'El monto debe ser un número positivo mayor que 0'),
  categoryId: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
});

// GET /api/transactions - Listar movimientos con filtros
router.get('/', async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.userId!;
    const { year, month, type, categoryId, search } = req.query;

    const whereClause: any = { userId };

    if (type && (type === 'INCOME' || type === 'EXPENSE')) {
      whereClause.type = type;
    }

    if (categoryId) {
      whereClause.categoryId = categoryId as string;
    }

    if (year && month) {
      const y = parseInt(year as string, 10);
      const m = parseInt(month as string, 10);
      const startDate = new Date(Date.UTC(y, m - 1, 1, 0, 0, 0));
      const endDate = new Date(Date.UTC(y, m, 0, 23, 59, 59, 999));
      whereClause.date = { gte: startDate, lte: endDate };
    }

    if (search) {
      whereClause.concept = { contains: search as string, mode: 'insensitive' };
    }

    const transactions = await prisma.transaction.findMany({
      where: whereClause,
      include: {
        category: true,
        period: true,
      },
      orderBy: { date: 'desc' },
    });

    const formatted = transactions.map((t) => ({
      id: t.id,
      type: t.type,
      date: t.date.toISOString().split('T')[0],
      concept: t.concept,
      amount: new Decimal(t.amount.toString()).toNumber(),
      category: t.category ? { id: t.category.id, name: t.category.name, emoji: t.category.emoji } : null,
      description: t.description || null,
      createdAt: t.createdAt,
    }));

    return res.json({ transactions: formatted });
  } catch (error: any) {
    console.error('Error al obtener movimientos:', error);
    return res.status(500).json({ error: 'Error al obtener movimientos.' });
  }
});

// POST /api/transactions - Registro individual e inmediato
router.post('/', async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.userId!;
    const body = transactionSchema.parse(req.body);

    // Regla: Fecha actual por defecto o fecha indicada
    const transactionDate = body.date ? new Date(body.date) : new Date();

    // Regla: Concepto por defecto si carece de uno
    let concept = body.concept?.trim();
    if (!concept || concept.length === 0) {
      concept = body.type === 'EXPENSE' ? 'Pago sin nombre' : 'Ingreso sin concepto';
    }

    // Regla: Categoría por defecto si no se especifica o no es válida
    let categoryId = body.categoryId || null;
    if (body.type === 'EXPENSE' && !categoryId) {
      const unclassified = await prisma.category.findFirst({
        where: { name: 'Sin clasificar' },
      });
      categoryId = unclassified ? unclassified.id : null;
    }

    // Identificar o crear el período correspondiente a la fecha
    const period = await getOrCreatePeriod(userId, transactionDate);

    // Regla: Período CLOSED no permite nuevos registros
    if (period.status === 'CLOSED') {
      return res.status(400).json({
        error: `El período ${period.year}-${String(period.month).padStart(2, '0')} está CERRADO. No se permiten modificaciones sin reapertura.`,
      });
    }

    const decimalAmount = new Decimal(body.amount);

    const transaction = await prisma.transaction.create({
      data: {
        userId,
        periodId: period.id,
        type: body.type,
        date: transactionDate,
        concept,
        amount: decimalAmount.toFixed(2),
        categoryId: body.type === 'EXPENSE' ? categoryId : null,
        description: body.description?.trim() || null,
      },
      include: {
        category: true,
      },
    });

    await logAudit({
      userId,
      entity: 'TRANSACTION',
      entityId: transaction.id,
      action: 'CREATE',
      newValues: transaction,
    });

    return res.status(201).json({
      message: 'Movimiento registrado correctamente en base de datos.',
      transaction: {
        id: transaction.id,
        type: transaction.type,
        date: transaction.date.toISOString().split('T')[0],
        concept: transaction.concept,
        amount: decimalAmount.toNumber(),
        category: transaction.category ? { id: transaction.category.id, name: transaction.category.name, emoji: transaction.category.emoji } : null,
        description: transaction.description,
      },
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors.map((e) => e.message).join(', ') });
    }
    console.error('Error al registrar movimiento:', error);
    return res.status(500).json({ error: 'No se pudo guardar el movimiento de forma persistente.' });
  }
});

// PUT /api/transactions/:id - Modificar movimiento
router.put('/:id', async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.userId!;
    const { id } = req.params;
    const body = transactionSchema.parse(req.body);

    const existing = await prisma.transaction.findFirst({
      where: { id, userId },
      include: { period: true },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Movimiento no encontrado.' });
    }

    if (existing.period.status === 'CLOSED') {
      return res.status(400).json({ error: 'No se puede modificar un movimiento de un período CERRADO.' });
    }

    const transactionDate = body.date ? new Date(body.date) : existing.date;
    const newPeriod = await getOrCreatePeriod(userId, transactionDate);

    if (newPeriod.status === 'CLOSED') {
      return res.status(400).json({ error: 'No se puede trasladar un movimiento a un período CERRADO.' });
    }

    let concept = body.concept?.trim() || existing.concept;
    let categoryId = body.categoryId !== undefined ? body.categoryId : existing.categoryId;

    if (body.type === 'EXPENSE' && !categoryId) {
      const unclassified = await prisma.category.findFirst({
        where: { name: 'Sin clasificar' },
      });
      categoryId = unclassified ? unclassified.id : null;
    }

    const decimalAmount = new Decimal(body.amount);

    const updated = await prisma.transaction.update({
      where: { id },
      data: {
        type: body.type,
        date: transactionDate,
        periodId: newPeriod.id,
        concept,
        amount: decimalAmount.toFixed(2),
        categoryId: body.type === 'EXPENSE' ? categoryId : null,
        description: body.description !== undefined ? body.description?.trim() || null : existing.description,
      },
      include: { category: true },
    });

    await logAudit({
      userId,
      entity: 'TRANSACTION',
      entityId: id,
      action: 'UPDATE',
      previousValues: existing,
      newValues: updated,
    });

    return res.json({
      message: 'Movimiento actualizado correctamente.',
      transaction: {
        id: updated.id,
        type: updated.type,
        date: updated.date.toISOString().split('T')[0],
        concept: updated.concept,
        amount: decimalAmount.toNumber(),
        category: updated.category ? { id: updated.category.id, name: updated.category.name, emoji: updated.category.emoji } : null,
        description: updated.description,
      },
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors.map((e) => e.message).join(', ') });
    }
    return res.status(500).json({ error: 'Error al actualizar movimiento.' });
  }
});

// DELETE /api/transactions/:id - Eliminar movimiento
router.delete('/:id', async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.userId!;
    const { id } = req.params;

    const existing = await prisma.transaction.findFirst({
      where: { id, userId },
      include: { period: true },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Movimiento no encontrado.' });
    }

    if (existing.period.status === 'CLOSED') {
      return res.status(400).json({ error: 'No se puede eliminar un movimiento de un período CERRADO.' });
    }

    await prisma.transaction.delete({ where: { id } });

    await logAudit({
      userId,
      entity: 'TRANSACTION',
      entityId: id,
      action: 'DELETE',
      previousValues: existing,
    });

    return res.json({ message: 'Movimiento eliminado correctamente de la base de datos.' });
  } catch (error) {
    return res.status(500).json({ error: 'Error al eliminar movimiento.' });
  }
});

export default router;
