import { prisma } from '../prisma.js';

export async function logAudit({
  userId,
  entity,
  entityId,
  action,
  previousValues,
  newValues,
}: {
  userId: string;
  entity: string;
  entityId: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  previousValues?: any;
  newValues?: any;
}) {
  try {
    await prisma.auditLog.create({
      data: {
        userId,
        entity,
        entityId,
        action,
        previousValues: previousValues ? JSON.stringify(previousValues) : null,
        newValues: newValues ? JSON.stringify(newValues) : null,
      },
    });
  } catch (err) {
    console.error('Error al registrar auditoría:', err);
  }
}
