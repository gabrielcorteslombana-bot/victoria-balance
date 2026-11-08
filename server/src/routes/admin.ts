import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma.js';
import { authMiddleware, requireAdmin, AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();
router.use(authMiddleware);
router.use(requireAdmin);

// GET /api/admin/stats - Resumen de la plataforma
router.get('/stats', async (req: AuthenticatedRequest, res) => {
  try {
    const totalUsers = await prisma.user.count();
    const trialUsers = await prisma.user.count({ where: { subscriptionStatus: 'TRIAL' } });
    const activeUsers = await prisma.user.count({ where: { subscriptionStatus: { in: ['ACTIVE', 'LIFETIME'] } } });
    const expiredUsers = await prisma.user.count({ where: { subscriptionStatus: 'EXPIRED' } });
    const totalTransactions = await prisma.transaction.count();

    return res.json({
      totalUsers,
      trialUsers,
      activeUsers,
      expiredUsers,
      totalTransactions,
    });
  } catch (error) {
    return res.status(500).json({ error: 'Error al obtener estadisticas de administracion.' });
  }
});

// GET /api/admin/users - Lista completa de usuarios
router.get('/users', async (req: AuthenticatedRequest, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        subscriptionStatus: true,
        trialEndsAt: true,
        createdAt: true,
        _count: {
          select: {
            transactions: true,
            shoppingLists: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.json({ users });
  } catch (error) {
    return res.status(500).json({ error: 'Error al obtener usuarios.' });
  }
});

// PATCH /api/admin/users/:id/status - Cambiar estado de suscripcion con planes mensuales, semestrales o anuales
const updateStatusSchema = z.object({
  subscriptionStatus: z.enum(['TRIAL', 'ACTIVE', 'EXPIRED', 'LIFETIME']),
  extendDays: z.number().int().optional(),
  planType: z.enum(['MONTHLY', 'SEMESTER', 'ANNUAL', 'CUSTOM', 'LIFETIME']).optional(),
});

router.patch('/users/:id/status', async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const body = updateStatusSchema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado.' });

    let newTrialEndsAt = user.trialEndsAt;

    // Calcular dias segun el plan
    let daysToAdd = 0;
    if (body.planType === 'MONTHLY') daysToAdd = 30;
    else if (body.planType === 'SEMESTER') daysToAdd = 180;
    else if (body.planType === 'ANNUAL') daysToAdd = 365;
    else if (body.extendDays) daysToAdd = body.extendDays;

    if (daysToAdd > 0) {
      const baseDate = user.trialEndsAt && new Date(user.trialEndsAt) > new Date()
        ? new Date(user.trialEndsAt)
        : new Date();
      baseDate.setDate(baseDate.getDate() + daysToAdd);
      newTrialEndsAt = baseDate;
    }

    const updated = await prisma.user.update({
      where: { id },
      data: {
        subscriptionStatus: body.subscriptionStatus,
        trialEndsAt: body.subscriptionStatus === 'LIFETIME' ? null : newTrialEndsAt,
      },
    });

    return res.json({
      message: `Usuario actualizado con exito`,
      user: {
        id: updated.id,
        email: updated.email,
        subscriptionStatus: updated.subscriptionStatus,
        trialEndsAt: updated.trialEndsAt,
      },
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors.map(e => e.message).join(', ') });
    }
    return res.status(500).json({ error: 'Error al actualizar usuario.' });
  }
});

export default router;
