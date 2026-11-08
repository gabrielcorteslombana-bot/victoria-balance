import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../prisma.js';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key_victoria';

export interface AuthenticatedRequest extends Request {
  userId?: string;
  userEmail?: string;
  userRole?: string;
}

export function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Acceso no autorizado. Token requerido.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; email: string; role?: string };
    req.userId = decoded.userId;
    req.userEmail = decoded.email;
    req.userRole = decoded.role || 'USER';
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Token invalido o expirado.' });
  }
}

export async function requireActiveSubscription(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    if (req.userRole === 'ADMIN' || req.userEmail === 'victoria@balance.app') {
      return next();
    }

    if (!req.userId) {
      return res.status(401).json({ error: 'Usuario no identificado.' });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { role: true, email: true, subscriptionStatus: true, trialEndsAt: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado.' });
    }

    if (user.role === 'ADMIN' || user.email === 'victoria@balance.app' || user.subscriptionStatus === 'LIFETIME' || user.subscriptionStatus === 'ACTIVE') {
      return next();
    }

    // Verificar si sigue dentro del período de prueba
    if (user.subscriptionStatus === 'TRIAL' && user.trialEndsAt) {
      if (new Date() <= new Date(user.trialEndsAt)) {
        return next();
      }
      // Si ya expiró, actualizar a EXPIRED
      await prisma.user.update({
        where: { id: req.userId },
        data: { subscriptionStatus: 'EXPIRED' }
      });
    }

    return res.status(403).json({
      error: 'Tu período de prueba ha finalizado. Activa tu membresía por WhatsApp (310 578 0607) para continuar.',
      subscriptionExpired: true
    });
  } catch (error) {
    console.error('Error en requireActiveSubscription:', error);
    return res.status(500).json({ error: 'Error al verificar suscripción.' });
  }
}

export async function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    if (req.userRole === 'ADMIN' || req.userEmail === 'victoria@balance.app') {
      return next();
    }

    if (req.userId) {
      const user = await prisma.user.findUnique({
        where: { id: req.userId },
        select: { role: true, email: true }
      });

      if (user && (user.role === 'ADMIN' || user.email === 'victoria@balance.app')) {
        req.userRole = 'ADMIN';
        return next();
      }
    }

    return res.status(403).json({ error: 'Acceso denegado. Se requieren permisos de administrador.' });
  } catch (error) {
    console.error('Error en requireAdmin:', error);
    return res.status(500).json({ error: 'Error al verificar permisos de administrador.' });
  }
}

export function generateToken(userId: string, email: string, role: string = 'USER'): string {
  return jwt.sign({ userId, email, role }, JWT_SECRET, { expiresIn: '30d' });
}
