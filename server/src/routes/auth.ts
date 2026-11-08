import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '../prisma.js';
import { generateToken, authMiddleware, AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();

const registerSchema = z.object({
  email: z.string().email('Correo electrónico inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  name: z.string().optional(),
  phone: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

// Registro de nuevos usuarios con 7 días de prueba
router.post('/register', async (req, res) => {
  try {
    const data = registerSchema.parse(req.body);
    const normalizedEmail = data.email.trim().toLowerCase();

    const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existing) {
      return res.status(400).json({ error: 'Ya existe una cuenta con este correo electrónico.' });
    }

    const passwordHash = await bcrypt.hash(data.password, 10);
    
    // Asignar 7 días de prueba (Trial)
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 7);

    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        name: data.name?.trim() || null,
        phone: data.phone?.trim() || null,
        passwordHash,
        role: 'USER',
        subscriptionStatus: 'TRIAL',
        trialEndsAt,
      },
    });

    const token = generateToken(user.id, user.email, user.role);
    return res.status(201).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        subscriptionStatus: user.subscriptionStatus,
        trialEndsAt: user.trialEndsAt,
      },
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors.map((e) => e.message).join(', ') });
    }
    return res.status(500).json({ error: 'Error al registrar el usuario.' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const data = loginSchema.parse(req.body);
    const normalizedEmail = data.email.trim().toLowerCase();

    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (!user) {
      return res.status(401).json({ error: 'Credenciales inválidas.' });
    }

    const isValid = await bcrypt.compare(data.password, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({ error: 'Credenciales inválidas.' });
    }

    // Verificar si el trial expiró (solo para usuarios en TRIAL que no sean ADMIN ni LIFETIME)
    let currentStatus = user.subscriptionStatus;
    if (user.role !== 'ADMIN' && currentStatus === 'TRIAL' && user.trialEndsAt) {
      if (new Date() > new Date(user.trialEndsAt)) {
        currentStatus = 'EXPIRED';
        await prisma.user.update({
          where: { id: user.id },
          data: { subscriptionStatus: 'EXPIRED' },
        });
      }
    }

    const token = generateToken(user.id, user.email, user.role);
    return res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        subscriptionStatus: currentStatus,
        trialEndsAt: user.trialEndsAt,
      },
    });
  } catch (error: any) {
    return res.status(500).json({ error: 'Error al iniciar sesión.' });
  }
});

// Perfil del usuario actual
router.get('/me', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        subscriptionStatus: true,
        trialEndsAt: true,
        createdAt: true,
      },
    });
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado.' });

    // Chequeo dinámico de vencimiento
    let currentStatus = user.subscriptionStatus;
    if (user.role !== 'ADMIN' && currentStatus === 'TRIAL' && user.trialEndsAt) {
      if (new Date() > new Date(user.trialEndsAt)) {
        currentStatus = 'EXPIRED';
        await prisma.user.update({
          where: { id: user.id },
          data: { subscriptionStatus: 'EXPIRED' },
        });
      }
    }

    return res.json({ user: { ...user, subscriptionStatus: currentStatus } });
  } catch (error) {
    return res.status(500).json({ error: 'Error al obtener usuario.' });
  }
});

export default router;
