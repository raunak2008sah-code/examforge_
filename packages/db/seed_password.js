const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findUnique({ where: { email: 'admin@examforge.com' } });
  if (!user) throw new Error('User not found');
  
  // Bcrypt hash for Password123!
  const hash = '$2a$10$D/N5U.P0/N3aG5J.uIqgReXg5e1cMvM.J9mB7wY/p5Z1P1p/r.R3G';

  let account = await prisma.account.findFirst({
    where: { providerId: 'credential', accountId: user.email }
  });

  if (account) {
    await prisma.account.update({
      where: { id: account.id },
      data: { password: hash }
    });
  } else {
    await prisma.account.create({
      data: {
        userId: user.id,
        accountId: user.email,
        providerId: 'credential',
        password: hash
      }
    });
  }

  console.log('Password set for admin@examforge.com to: Password123!');
}

main().finally(() => prisma.$disconnect());
