import { Router } from 'express';
import { z } from 'zod';
import { Decimal } from 'decimal.js';
import { prisma } from '../prisma.js';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();
router.use(authMiddleware);

const debtSchema = z.object({
  name: z.string().min(1, 'El nombre de la deuda es requerido'),
  totalAmount: z.union([z.number(), z.string()]).refine((val) => {
    try {
      const d = new Decimal(val);
      return d.isPositive() && !d.isZero();
    } catch {
      return false;
    }
  }, 'El monto total debe ser un número positivo'),
  totalInstallments: z.number().int().min(1, 'Debe tener al menos 1 cuota'),
  paidInstallments: z.number().int().min(0).default(0),
  installmentAmount: z.union([z.number(), z.string()]).optional().nullable(),
  notes: z.string().optional().nullable(),
});

// GET /api/debts - Listar deudas del usuario
router.get('/', async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.userId!;
    const debts = await prisma.debt.findMany({
      where: { userId },
      orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
    });

    const formatted = debts.map((d) => {
      const total = new Decimal(d.totalAmount.toString());
      const perInstallment = d.installmentAmount
        ? new Decimal(d.installmentAmount.toString())
        : total.dividedBy(d.totalInstallments);

      const remainingInstallments = Math.max(0, d.totalInstallments - d.paidInstallments);
      const remainingAmount = perInstallment.times(remainingInstallments);
      const progressPercentage = Math.min(100, Math.round((d.paidInstallments / d.totalInstallments) * 100));

      return {
        id: d.id,
        name: d.name,
        totalAmount: total.toNumber(),
        totalInstallments: d.totalInstallments,
        paidInstallments: d.paidInstallments,
        installmentAmount: perInstallment.toNumber(),
        remainingInstallments,
        remainingAmount: remainingAmount.toNumber(),
        progressPercentage,
        status: d.status,
        notes: d.notes,
        createdAt: d.createdAt,
        updatedAt: d.updatedAt,
      };
    });

    return res.json({ debts: formatted });
  } catch (error) {
    console.error('Error al listar deudas:', error);
    return res.status(500).json({ error: 'Error al obtener deudas.' });
  }
});

// POST /api/debts - Crear nueva deuda
router.post('/', async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.userId!;
    const body = debtSchema.parse(req.body);

    const totalAmount = new Decimal(body.totalAmount);
    const installmentAmount = body.installmentAmount
      ? new Decimal(body.installmentAmount)
      : totalAmount.dividedBy(body.totalInstallments);

    const isFinished = body.paidInstallments >= body.totalInstallments;

    const debt = await prisma.debt.create({
      data: {
        userId,
        name: body.name.trim(),
        totalAmount: totalAmount.toFixed(2),
        totalInstallments: body.totalInstallments,
        paidInstallments: body.paidInstallments,
        installmentAmount: installmentAmount.toFixed(2),
        status: isFinished ? 'PAID' : 'ACTIVE',
        notes: body.notes?.trim() || null,
      },
    });

    return res.status(201).json({ debt });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors.map((e) => e.message).join(', ') });
    }
    return res.status(500).json({ error: 'Error al crear deuda.' });
  }
});

// PATCH /api/debts/:id/pay-installment - Pagar una cuota (+1)
router.patch('/:id/pay-installment', async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.userId!;
    const { id } = req.params;

    const debt = await prisma.debt.findFirst({ where: { id, userId } });
    if (!debt) return res.status(404).json({ error: 'Deuda no encontrada.' });

    if (debt.paidInstallments >= debt.totalInstallments) {
      return res.status(400).json({ error: 'Esta deuda ya está totalmente pagada.' });
    }

    const nextPaid = debt.paidInstallments + 1;
    const isFinished = nextPaid >= debt.totalInstallments;

    const updated = await prisma.debt.update({
      where: { id },
      data: {
        paidInstallments: nextPaid,
        status: isFinished ? 'PAID' : 'ACTIVE',
      },
    });

    return res.json({ message: 'Cuota registrada con éxito.', debt: updated });
  } catch (error) {
    return res.status(500).json({ error: 'Error al registrar pago de cuota.' });
  }
});

// PUT /api/debts/:id - Editar deuda completa
router.put('/:id', async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.userId!;
    const { id } = req.params;
    const body = debtSchema.parse(req.body);

    const existing = await prisma.debt.findFirst({ where: { id, userId } });
    if (!existing) return res.status(404).json({ error: 'Deuda no encontrada.' });

    const totalAmount = new Decimal(body.totalAmount);
    const installmentAmount = body.installmentAmount
      ? new Decimal(body.installmentAmount)
      : totalAmount.dividedBy(body.totalInstallments);

    const isFinished = body.paidInstallments >= body.totalInstallments;

    const updated = await prisma.debt.update({
      where: { id },
      data: {
        name: body.name.trim(),
        totalAmount: totalAmount.toFixed(2),
        totalInstallments: body.totalInstallments,
        paidInstallments: body.paidInstallments,
        installmentAmount: installmentAmount.toFixed(2),
        status: isFinished ? 'PAID' : 'ACTIVE',
        notes: body.notes !== undefined ? body.notes?.trim() || null : existing.notes,
      },
    });

    return res.json({ message: 'Deuda actualizada.', debt: updated });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors.map((e) => e.message).join(', ') });
    }
    return res.status(500).json({ error: 'Error al actualizar deuda.' });
  }
});

// DELETE /api/debts/:id - Eliminar deuda
router.delete('/:id', async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.userId!;
    const { id } = req.params;

    const existing = await prisma.debt.findFirst({ where: { id, userId } });
    if (!existing) return res.status(404).json({ error: 'Deuda no encontrada.' });

    await prisma.debt.delete({ where: { id } });

    return res.json({ message: 'Deuda eliminada correctamente.' });
  } catch (error) {
    return res.status(500).json({ error: 'Error al eliminar deuda.' });
  }
});

export default router;
