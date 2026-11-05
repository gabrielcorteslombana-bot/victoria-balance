import { Router } from 'express';
import { z } from 'zod';
import { Decimal } from 'decimal.js';
import { prisma } from '../prisma.js';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.js';
import { logAudit } from '../services/audit.js';

const router = Router();
router.use(authMiddleware);

// GET /api/lists - Consultar listas del usuario
router.get('/', async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.userId!;
    const { referencePeriod, status } = req.query;

    const whereClause: any = { userId };
    if (referencePeriod) whereClause.referencePeriod = referencePeriod as string;
    if (status) whereClause.status = status as string;

    const lists = await prisma.shoppingList.findMany({
      where: whereClause,
      include: {
        items: {
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const formatted = lists.map((list) => {
      const totalItems = list.items.length;
      const purchasedItems = list.items.filter((i) => i.isPurchased).length;
      const completionPercentage = totalItems > 0
        ? Math.round((purchasedItems / totalItems) * 100)
        : 0;

      return {
        id: list.id,
        name: list.name,
        referencePeriod: list.referencePeriod,
        status: list.status,
        createdAt: list.createdAt,
        totalItems,
        purchasedItems,
        pendingItems: totalItems - purchasedItems,
        completionPercentage,
        items: list.items.map((item) => ({
          id: item.id,
          name: item.name,
          quantity: item.quantity,
          estimatedPrice: item.estimatedPrice ? new Decimal(item.estimatedPrice.toString()).toNumber() : null,
          notes: item.notes,
          isPurchased: item.isPurchased,
          purchasedAt: item.purchasedAt,
        })),
      };
    });

    return res.json({ lists: formatted });
  } catch (error) {
    return res.status(500).json({ error: 'Error al obtener listas.' });
  }
});

// POST /api/lists - Crear lista
const createListSchema = z.object({
  name: z.string().min(1, 'El nombre de la lista es obligatorio'),
  referencePeriod: z.string().optional(),
});

router.post('/', async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.userId!;
    const body = createListSchema.parse(req.body);

    const list = await prisma.shoppingList.create({
      data: {
        userId,
        name: body.name.trim(),
        referencePeriod: body.referencePeriod || null,
        status: 'ACTIVE',
      },
      include: { items: true },
    });

    await logAudit({
      userId,
      entity: 'SHOPPING_LIST',
      entityId: list.id,
      action: 'CREATE',
      newValues: list,
    });

    return res.status(201).json({ list });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors.map((e) => e.message).join(', ') });
    }
    return res.status(500).json({ error: 'Error al crear la lista.' });
  }
});

// POST /api/lists/:id/duplicate - Duplicar lista para otro período
router.post('/:id/duplicate', async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.userId!;
    const { id } = req.params;
    const { newName, newReferencePeriod } = req.body;

    const sourceList = await prisma.shoppingList.findFirst({
      where: { id, userId },
      include: { items: true },
    });

    if (!sourceList) {
      return res.status(404).json({ error: 'Lista no encontrada.' });
    }

    // Regla: Una lista duplicada debe comenzar con sus productos pendientes (no comprados)
    const pendingItems = sourceList.items.filter((i) => !i.isPurchased);

    const duplicatedList = await prisma.shoppingList.create({
      data: {
        userId,
        name: newName ? newName.trim() : `${sourceList.name} (Copia)`,
        referencePeriod: newReferencePeriod || sourceList.referencePeriod,
        status: 'ACTIVE',
        items: {
          create: pendingItems.map((item) => ({
            name: item.name,
            quantity: item.quantity,
            estimatedPrice: item.estimatedPrice,
            notes: item.notes,
            isPurchased: false,
          })),
        },
      },
      include: { items: true },
    });

    await logAudit({
      userId,
      entity: 'SHOPPING_LIST',
      entityId: duplicatedList.id,
      action: 'CREATE',
      newValues: duplicatedList,
    });

    return res.status(201).json({
      message: 'Lista duplicada con éxito conservando productos pendientes.',
      list: duplicatedList,
    });
  } catch (error) {
    return res.status(500).json({ error: 'Error al duplicar la lista.' });
  }
});

// DELETE /api/lists/:id - Eliminar lista
router.delete('/:id', async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.userId!;
    const { id } = req.params;

    const existing = await prisma.shoppingList.findFirst({ where: { id, userId } });
    if (!existing) return res.status(404).json({ error: 'Lista no encontrada.' });

    await prisma.shoppingList.delete({ where: { id } });

    await logAudit({
      userId,
      entity: 'SHOPPING_LIST',
      entityId: id,
      action: 'DELETE',
    });

    return res.json({ message: 'Lista eliminada correctamente.' });
  } catch (error) {
    return res.status(500).json({ error: 'Error al eliminar la lista.' });
  }
});

// POST /api/lists/:id/items - Agregar producto a lista
const addItemSchema = z.object({
  name: z.string().min(1, 'El nombre del producto es obligatorio'),
  quantity: z.number().int().min(1).default(1),
  estimatedPrice: z.union([z.number(), z.string()]).nullable().optional(),
  notes: z.string().nullable().optional(),
});

router.post('/:id/items', async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.userId!;
    const { id } = req.params;
    const body = addItemSchema.parse(req.body);

    const list = await prisma.shoppingList.findFirst({ where: { id, userId } });
    if (!list) return res.status(404).json({ error: 'Lista no encontrada.' });

    const item = await prisma.shoppingItem.create({
      data: {
        listId: list.id,
        name: body.name.trim(),
        quantity: body.quantity,
        estimatedPrice: body.estimatedPrice ? new Decimal(body.estimatedPrice).toFixed(2) : null,
        notes: body.notes?.trim() || null,
        isPurchased: false,
      },
    });

    return res.status(201).json({ item });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors.map((e) => e.message).join(', ') });
    }
    return res.status(500).json({ error: 'Error al agregar producto.' });
  }
});

// PATCH /api/lists/items/:itemId/toggle - Marcar comprado / pendiente
// REGLA CRÍTICA: Marcar como comprado NO crea ningún gasto ni altera la contabilidad financiera.
router.patch('/items/:itemId/toggle', async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.userId!;
    const { itemId } = req.params;

    const item = await prisma.shoppingItem.findUnique({
      where: { id: itemId },
      include: { list: true },
    });

    if (!item || item.list.userId !== userId) {
      return res.status(404).json({ error: 'Producto no encontrado.' });
    }

    const nextState = !item.isPurchased;
    const updated = await prisma.shoppingItem.update({
      where: { id: itemId },
      data: {
        isPurchased: nextState,
        purchasedAt: nextState ? new Date() : null,
      },
    });

    return res.json({ item: updated });
  } catch (error) {
    return res.status(500).json({ error: 'Error al actualizar producto.' });
  }
});

// DELETE /api/lists/items/:itemId - Eliminar producto
router.delete('/items/:itemId', async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.userId!;
    const { itemId } = req.params;

    const item = await prisma.shoppingItem.findUnique({
      where: { id: itemId },
      include: { list: true },
    });

    if (!item || item.list.userId !== userId) {
      return res.status(404).json({ error: 'Producto no encontrado.' });
    }

    await prisma.shoppingItem.delete({ where: { id: itemId } });
    return res.json({ message: 'Producto eliminado de la lista.' });
  } catch (error) {
    return res.status(500).json({ error: 'Error al eliminar producto.' });
  }
});

export default router;
