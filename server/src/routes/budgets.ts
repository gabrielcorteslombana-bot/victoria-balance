import { Router } from 'express';
import { z } from 'zod';
import { Decimal } from 'decimal.js';
import { prisma } from '../prisma.js';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.js';
import { getOrCreatePeriod } from '../services/periods.js';
import { logAudit } from '../services/audit.js';

const router = Router();
router.use(authMiddleware);

// GET /api/budgets?year=2026&month=11
router.get('/', async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.userId!;
    const year = parseInt((req.query.year as string) || `${new Date().getFullYear()}`, 10);
    const month = parseInt((req.query.month as string) || `${new Date().getMonth() + 1}`, 10);

    const refDate = new Date(Date.UTC(year, month - 1, 1));
    const period = await getOrCreatePeriod(userId, refDate);

    // Obtener todas las categorías (globales o del usuario)
    const categories = await prisma.category.findMany({
      where: {
        OR: [{ userId: null }, { userId }],
        isActive: true,
      },
      orderBy: { name: 'asc' },
    });

    // Asignaciones de presupuesto para el período
    const allocations = await prisma.budgetAllocation.findMany({
      where: { userId, periodId: period.id },
    });
    const allocationMap = new Map(allocations.map((a) => [a.categoryId, new Decimal(a.allocatedAmount.toString())]));

    // Gastos reales agrupados por categoría en este mes
    const startDate = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0));
    const endDate = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));

    const expenses = await prisma.transaction.findMany({
      where: {
        userId,
        type: 'EXPENSE',
        date: { gte: startDate, lte: endDate },
      },
    });

    const expenseMap = new Map<string, Decimal>();
    for (const exp of expenses) {
      const catId = exp.categoryId || 'unclassified';
      const current = expenseMap.get(catId) || new Decimal(0);
      expenseMap.set(catId, current.plus(new Decimal(exp.amount.toString())));
    }

    let totalBudget = new Decimal(0);
    let totalExpense = new Decimal(0);

    const categoryBudgets = categories.map((cat) => {
      const budgetAmount = allocationMap.get(cat.id) || new Decimal(0);
      const expenseAmount = expenseMap.get(cat.id) || new Decimal(0);
      const remaining = budgetAmount.minus(expenseAmount);
      
      const executionPercentage = budgetAmount.isPositive() && !budgetAmount.isZero()
        ? expenseAmount.dividedBy(budgetAmount).times(100).toDecimalPlaces(1).toNumber()
        : null;

      totalBudget = totalBudget.plus(budgetAmount);
      totalExpense = totalExpense.plus(expenseAmount);

      return {
        categoryId: cat.id,
        categoryName: cat.name,
        emoji: cat.emoji,
        allocatedAmount: budgetAmount.toNumber(),
        spentAmount: expenseAmount.toNumber(),
        remainingAmount: remaining.toNumber(),
        executionPercentage,
        hasBudget: budgetAmount.greaterThan(0),
        isExceeded: budgetAmount.greaterThan(0) && expenseAmount.greaterThan(budgetAmount),
      };
    });

    return res.json({
      period: {
        id: period.id,
        year: period.year,
        month: period.month,
        status: period.status,
      },
      totalBudget: totalBudget.toNumber(),
      totalExpense: totalExpense.toNumber(),
      overallExecutionPercentage: totalBudget.greaterThan(0)
        ? totalExpense.dividedBy(totalBudget).times(100).toDecimalPlaces(1).toNumber()
        : null,
      categories: categoryBudgets,
    });
  } catch (error) {
    console.error('Error al obtener presupuestos:', error);
    return res.status(500).json({ error: 'Error al consultar presupuestos.' });
  }
});

// POST /api/budgets - Asignar presupuesto a una categoría
const setBudgetSchema = z.object({
  year: z.number().int(),
  month: z.number().int().min(1).max(12),
  categoryId: z.string(),
  amount: z.union([z.number(), z.string()]).refine((val) => {
    try {
      const d = new Decimal(val);
      return d.isPositive() || d.isZero();
    } catch {
      return false;
    }
  }, 'El monto asignado debe ser 0 o positivo'),
});

router.post('/', async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.userId!;
    const body = setBudgetSchema.parse(req.body);

    const refDate = new Date(Date.UTC(body.year, body.month - 1, 1));
    const period = await getOrCreatePeriod(userId, refDate);

    if (period.status === 'CLOSED') {
      return res.status(400).json({ error: 'No se puede modificar el presupuesto de un período CERRADO.' });
    }

    const decimalAmount = new Decimal(body.amount);

    const allocation = await prisma.budgetAllocation.upsert({
      where: {
        userId_periodId_categoryId: {
          userId,
          periodId: period.id,
          categoryId: body.categoryId,
        },
      },
      update: {
        allocatedAmount: decimalAmount.toFixed(2),
      },
      create: {
        userId,
        periodId: period.id,
        categoryId: body.categoryId,
        allocatedAmount: decimalAmount.toFixed(2),
      },
    });

    await logAudit({
      userId,
      entity: 'BUDGET_ALLOCATION',
      entityId: allocation.id,
      action: 'UPDATE',
      newValues: allocation,
    });

    return res.json({
      message: 'Presupuesto asignado correctamente.',
      allocation: {
        id: allocation.id,
        categoryId: allocation.categoryId,
        allocatedAmount: decimalAmount.toNumber(),
      },
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors.map((e) => e.message).join(', ') });
    }
    return res.status(500).json({ error: 'Error al asignar presupuesto.' });
  }
});

// POST /api/budgets/copy-previous - Copiar presupuesto del mes anterior
router.post('/copy-previous', async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.userId!;
    const { year, month } = req.body;
    if (!year || !month) return res.status(400).json({ error: 'Año y mes requeridos.' });

    const currentPeriod = await getOrCreatePeriod(userId, new Date(Date.UTC(year, month - 1, 1)));
    if (currentPeriod.status === 'CLOSED') {
      return res.status(400).json({ error: 'El período actual está CERRADO.' });
    }

    // Calcular mes previo
    const prevDate = new Date(Date.UTC(year, month - 2, 1));
    const prevYear = prevDate.getUTCFullYear();
    const prevMonth = prevDate.getUTCMonth() + 1;

    const prevPeriod = await prisma.financialPeriod.findUnique({
      where: { userId_year_month: { userId, year: prevYear, month: prevMonth } },
    });

    if (!prevPeriod) {
      return res.status(404).json({ error: 'No existe presupuesto registrado para el mes anterior.' });
    }

    const prevAllocations = await prisma.budgetAllocation.findMany({
      where: { userId, periodId: prevPeriod.id },
    });

    if (prevAllocations.length === 0) {
      return res.status(404).json({ error: 'El mes anterior no cuenta con asignaciones presupuestales.' });
    }

    for (const alloc of prevAllocations) {
      await prisma.budgetAllocation.upsert({
        where: {
          userId_periodId_categoryId: {
            userId,
            periodId: currentPeriod.id,
            categoryId: alloc.categoryId,
          },
        },
        update: {
          allocatedAmount: alloc.allocatedAmount,
        },
        create: {
          userId,
          periodId: currentPeriod.id,
          categoryId: alloc.categoryId,
          allocatedAmount: alloc.allocatedAmount,
        },
      });
    }

    return res.json({ message: `Se copiaron ${prevAllocations.length} asignaciones del mes anterior.` });
  } catch (error) {
    return res.status(500).json({ error: 'Error al copiar presupuesto del mes anterior.' });
  }
});

export default router;
