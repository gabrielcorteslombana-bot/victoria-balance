import { prisma } from '../prisma.js';

export async function getOrCreatePeriod(userId: string, date: Date) {
  const year = date.getFullYear();
  const month = date.getMonth() + 1; // 1 - 12

  let period = await prisma.financialPeriod.findUnique({
    where: {
      userId_year_month: {
        userId,
        year,
        month,
      },
    },
  });

  if (!period) {
    period = await prisma.financialPeriod.create({
      data: {
        userId,
        year,
        month,
        openingBalance: 0,
        status: 'OPEN',
      },
    });
  }

  return period;
}
