import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const DEFAULT_CATEGORIES = [
  { name: 'Vivienda', emoji: '🏡' },
  { name: 'Alimentación y Mercado', emoji: '🛒' },
  { name: 'Transporte y Movilidad', emoji: '🚗' },
  { name: 'Servicios Públicos y Suscripciones', emoji: '💡' },
  { name: 'Salud y Cuidado Personal', emoji: '🌷' },
  { name: 'Educación y Desarrollo', emoji: '📚' },
  { name: 'Ocio y Entretenimiento', emoji: '🎟️' },
  { name: 'Gastos Financieros y Deudas', emoji: '💳' },
  { name: 'Sin clasificar', emoji: '📌' },
];

async function main() {
  console.log('--- Iniciando Seed de Victoria Balance ---');

  // Categorías del catálogo global (userId = null)
  for (const cat of DEFAULT_CATEGORIES) {
    const existing = await prisma.category.findFirst({
      where: { name: cat.name, userId: null },
    });
    if (!existing) {
      await prisma.category.create({
        data: {
          name: cat.name,
          emoji: cat.emoji,
          isActive: true,
          userId: null,
        },
      });
      console.log(`Categoría creada: ${cat.emoji} ${cat.name}`);
    }
  }

  // Usuario de prueba demostrativo
  const demoEmail = 'victoria@balance.app';
  let demoUser = await prisma.user.findUnique({ where: { email: demoEmail } });

  if (!demoUser) {
    const passwordHash = await bcrypt.hash('Victoria2026*', 10);
    demoUser = await prisma.user.create({
      data: {
        email: demoEmail,
        name: 'Victoria Admin',
        passwordHash,
      },
    });
    console.log(`Usuario demo creado: ${demoEmail} (Password: Victoria2026*)`);
  }

  console.log('--- Seed completado con éxito ---');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
