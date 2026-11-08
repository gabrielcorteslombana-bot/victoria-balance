import { Router } from 'express';
import { Decimal } from 'decimal.js';
import { prisma } from '../prisma.js';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.js';
import { getOrCreatePeriod } from '../services/periods.js';

const router = Router();
router.use(authMiddleware);

// GET /api/dashboard?year=2026&month=11
router.get('/', async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.userId!;
    const year = parseInt((req.query.year as string) || `${new Date().getFullYear()}`, 10);
    const month = parseInt((req.query.month as string) || `${new Date().getMonth() + 1}`, 10);

    const refDate = new Date(Date.UTC(year, month - 1, 1));
    const period = await getOrCreatePeriod(userId, refDate);

    // 1. Rango del mes consultado
    const startDate = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0));
    const endDate = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));

    // 2. Movimientos del mes consultado
    const monthTransactions = await prisma.transaction.findMany({
      where: {
        userId,
        date: { gte: startDate, lte: endDate },
      },
      include: { category: true },
      orderBy: { date: 'desc' },
    });

    let monthlyIncome = new Decimal(0);
    let monthlyExpenses = new Decimal(0);
    const expenseByCategory = new Map<string, Decimal>();

    for (const t of monthTransactions) {
      const amt = new Decimal(t.amount.toString());
      if (t.type === 'INCOME') {
        monthlyIncome = monthlyIncome.plus(amt);
      } else {
        monthlyExpenses = monthlyExpenses.plus(amt);
        const catId = t.categoryId || 'unclassified';
        const current = expenseByCategory.get(catId) || new Decimal(0);
        expenseByCategory.set(catId, current.plus(amt));
      }
    }

    const monthlyNetBalance = monthlyIncome.minus(monthlyExpenses);

    // 3. Saldo acumulado histórico total (disponible)
    // available_balance = opening_balance + cumulative_income - cumulative_expenses
    const allTransactions = await prisma.transaction.findMany({
      where: {
        userId,
        date: { lte: endDate }, // Hasta el final del período consultado
      },
    });

    let cumulativeIncome = new Decimal(0);
    let cumulativeExpenses = new Decimal(0);
    for (const t of allTransactions) {
      const amt = new Decimal(t.amount.toString());
      if (t.type === 'INCOME') cumulativeIncome = cumulativeIncome.plus(amt);
      else cumulativeExpenses = cumulativeExpenses.plus(amt);
    }

    const openingBalance = new Decimal(period.openingBalance.toString());
    const availableBalance = openingBalance.plus(cumulativeIncome).minus(cumulativeExpenses);

    // 4. Presupuestos y Categorías del mes
    const categories = await prisma.category.findMany({
      where: { OR: [{ userId: null }, { userId }], isActive: true },
    });

    const allocations = await prisma.budgetAllocation.findMany({
      where: { userId, periodId: period.id },
    });
    const allocationMap = new Map(allocations.map((a) => [a.categoryId, new Decimal(a.allocatedAmount.toString())]));

    let totalBudget = new Decimal(0);
    const alerts: string[] = [];

    const categorySummary = categories.map((cat) => {
      const allocated = allocationMap.get(cat.id) || new Decimal(0);
      const spent = expenseByCategory.get(cat.id) || new Decimal(0);
      const remaining = allocated.minus(spent);
      totalBudget = totalBudget.plus(allocated);

      const executionPercentage = allocated.greaterThan(0)
        ? spent.dividedBy(allocated).times(100).toDecimalPlaces(1).toNumber()
        : null;

      if (allocated.greaterThan(0) && spent.greaterThan(allocated)) {
        const diff = spent.minus(allocated).toFixed(2);
        alerts.push(`La categoría "${cat.emoji} ${cat.name}" superó su presupuesto por $${diff}.`);
      }

      return {
        categoryId: cat.id,
        categoryName: cat.name,
        emoji: cat.emoji,
        allocatedAmount: allocated.toNumber(),
        spentAmount: spent.toNumber(),
        remainingAmount: remaining.toNumber(),
        executionPercentage,
        hasBudget: allocated.greaterThan(0),
        isExceeded: allocated.greaterThan(0) && spent.greaterThan(allocated),
      };
    });

    const budgetExecutionPercentage = totalBudget.greaterThan(0)
      ? monthlyExpenses.dividedBy(totalBudget).times(100).toDecimalPlaces(1).toNumber()
      : null;

    // Presupuesto no asignado: max(0, monthly_income - total_budget)
    const unallocatedBudget = monthlyIncome.greaterThan(totalBudget)
      ? monthlyIncome.minus(totalBudget).toNumber()
      : 0;

    // 5. Resumen independiente de listas de compras
    const periodRefString = `${year}-${String(month).padStart(2, '0')}`;
    const shoppingLists = await prisma.shoppingList.findMany({
      where: {
        userId,
        status: 'ACTIVE',
        OR: [{ referencePeriod: null }, { referencePeriod: periodRefString }],
      },
      include: { items: true },
    });

    let totalItems = 0;
    let purchasedItems = 0;
    for (const l of shoppingLists) {
      totalItems += l.items.length;
      purchasedItems += l.items.filter((i) => i.isPurchased).length;
    }
    const pendingItems = totalItems - purchasedItems;
    const shoppingCompletion = totalItems > 0 ? Math.round((purchasedItems / totalItems) * 100) : 0;

    // 6. Últimos movimientos
    const recentTransactions = monthTransactions.slice(0, 10).map((t) => ({
      id: t.id,
      type: t.type,
      date: t.date.toISOString().split('T')[0],
      concept: t.concept,
      amount: new Decimal(t.amount.toString()).toNumber(),
      category: t.category ? { id: t.category.id, name: t.category.name, emoji: t.category.emoji } : null,
      description: t.description || null,
    }));

    // 5.5 Comparativa con el mes anterior
    const prevMonthDate = new Date(Date.UTC(year, month - 2, 1));
    const prevYear = prevMonthDate.getUTCFullYear();
    const prevMonth = prevMonthDate.getUTCMonth() + 1;
    const prevStartDate = new Date(Date.UTC(prevYear, prevMonth - 1, 1, 0, 0, 0));
    const prevEndDate = new Date(Date.UTC(prevYear, prevMonth, 0, 23, 59, 59, 999));

    const prevExpensesTx = await prisma.transaction.findMany({
      where: {
        userId,
        type: 'EXPENSE',
        date: { gte: prevStartDate, lte: prevEndDate },
      },
      select: { amount: true },
    });

    let prevMonthExpenses = new Decimal(0);
    for (const t of prevExpensesTx) {
      prevMonthExpenses = prevMonthExpenses.plus(new Decimal(t.amount.toString()));
    }

    let expenseGrowthPercentage: number | null = null;
    if (prevMonthExpenses.greaterThan(0)) {
      expenseGrowthPercentage = monthlyExpenses
        .minus(prevMonthExpenses)
        .dividedBy(prevMonthExpenses)
        .times(100)
        .toDecimalPlaces(1)
        .toNumber();
    }

    return res.json({
      selected_period: periodRefString,
      comparison: {
        prev_month_expenses: prevMonthExpenses.toNumber(),
        growth_percentage: expenseGrowthPercentage,
      },
      period_status: period.status,
      monthly_income: monthlyIncome.toNumber(),
      monthly_expenses: monthlyExpenses.toNumber(),
      monthly_net_balance: monthlyNetBalance.toNumber(),
      opening_balance: openingBalance.toNumber(),
      available_balance: availableBalance.toNumber(),
      total_budget: totalBudget.toNumber(),
      unallocated_budget: unallocatedBudget,
      budget_execution_percentage: budgetExecutionPercentage,
      recent_transactions: recentTransactions,
      category_summary: categorySummary,
      shopping_summary: {
        active_lists: shoppingLists.length,
        total_items: totalItems,
        purchased_items: purchasedItems,
        pending_items: pendingItems,
        completion_percentage: shoppingCompletion,
      },
      alerts,
    });
  } catch (error) {
    console.error('Error al generar dashboard:', error);
    return res.status(500).json({ error: 'Error al calcular indicadores del dashboard.' });
  }
});

export default router;
