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
    return res.status(500).json({ error: 'Error al obtener estadísticas de administración.' });
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

// PATCH /api/admin/users/:id/status - Cambiar estado de suscripción (ej: activar tras recibir pago por WhatsApp)
const updateStatusSchema = z.object({
  subscriptionStatus: z.enum(['TRIAL', 'ACTIVE', 'EXPIRED', 'LIFETIME']),
  extendTrialDays: z.number().int().optional(),
});

router.patch('/users/:id/status', async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const body = updateStatusSchema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado.' });

    let newTrialEndsAt = user.trialEndsAt;
    if (body.extendTrialDays && body.extendTrialDays > 0) {
      const baseDate = user.trialEndsAt && new Date(user.trialEndsAt) > new Date()
        ? new Date(user.trialEndsAt)
        : new Date();
      baseDate.setDate(baseDate.getDate() + body.extendTrialDays);
      newTrialEndsAt = baseDate;
    }

    const updated = await prisma.user.update({
      where: { id },
      data: {
        subscriptionStatus: body.subscriptionStatus,
        trialEndsAt: newTrialEndsAt,
      },
    });

    return res.json({
      message: `Estado actualizado a ${body.subscriptionStatus}`,
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
