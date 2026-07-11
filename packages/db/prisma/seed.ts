import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // 1. Roles
  const roles = ['ADMIN', 'REVIEWER', 'STUDENT'] as const;
  for (const roleName of roles) {
    await prisma.role.upsert({
      where: { name: roleName },
      update: {},
      create: {
        name: roleName,
        description: `Default ${roleName} role`,
      },
    });
  }
  console.log('✔ Roles seeded');

  // 2. Default Users
  const [adminRole, reviewerRole, studentRole] = await Promise.all([
    prisma.role.findUnique({ where: { name: 'ADMIN' } }),
    prisma.role.findUnique({ where: { name: 'REVIEWER' } }),
    prisma.role.findUnique({ where: { name: 'STUDENT' } }),
  ]);
  if (!adminRole) throw new Error('ADMIN role not found');
  if (!reviewerRole) throw new Error('REVIEWER role not found');
  if (!studentRole) throw new Error('STUDENT role not found');

  const adminEmail = 'admin@examforge.com';
  const adminUser = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      deletedAt: null,
      isActive: true,
      roleId: adminRole.id,
    },
    create: {
      email: adminEmail,
      name: 'System Admin',
      roleId: adminRole.id,
      isActive: true,
    },
  });
  console.log('✔ Default admin user seeded');

  const sampleUsers = [
    {
      email: 'reviewer@examforge.com',
      name: 'Dr. Amit Patel',
      roleId: reviewerRole.id,
      isActive: true,
    },
    {
      email: 'sarah.jenkins@examforge.com',
      name: 'Sarah Jenkins',
      roleId: reviewerRole.id,
      isActive: true,
    },
    {
      email: 'student.one@examforge.com',
      name: 'Aarav Sharma',
      roleId: studentRole.id,
      isActive: true,
    },
    {
      email: 'student.two@examforge.com',
      name: 'Meera Iyer',
      roleId: studentRole.id,
      isActive: true,
    },
    {
      email: 'inactive.student@examforge.com',
      name: 'Inactive Student',
      roleId: studentRole.id,
      isActive: false,
    },
    { email: 'j.doe@example.com', name: 'John Doe', roleId: studentRole.id, isActive: true },
    { email: 'k.smith@example.com', name: 'Kavya Smith', roleId: studentRole.id, isActive: true },
    { email: 'p.kumar@example.com', name: 'Priya Kumar', roleId: studentRole.id, isActive: true },
    { email: 'r.singh@example.com', name: 'Rahul Singh', roleId: studentRole.id, isActive: true },
    { email: 'a.gupta@example.com', name: 'Ananya Gupta', roleId: studentRole.id, isActive: true },
    { email: 'm.desai@example.com', name: 'Manish Desai', roleId: studentRole.id, isActive: false },
    { email: 'n.reddy@example.com', name: 'Neha Reddy', roleId: studentRole.id, isActive: true },
    {
      email: 's.sharma@example.com',
      name: 'Siddharth Sharma',
      roleId: studentRole.id,
      isActive: true,
    },
    {
      email: 'v.kapoor@example.com',
      name: 'Vikram Kapoor',
      roleId: reviewerRole.id,
      isActive: true,
    },
    { email: 't.jain@example.com', name: 'Tanvi Jain', roleId: studentRole.id, isActive: true },
    { email: 'l.das@example.com', name: 'Lakshya Das', roleId: studentRole.id, isActive: true },
  ];

  for (const user of sampleUsers) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: {
        name: user.name,
        roleId: user.roleId,
        isActive: user.isActive,
        deletedAt: null,
      },
      create: {
        email: user.email,
        name: user.name,
        roleId: user.roleId,
        isActive: user.isActive,
      },
    });
  }
  console.log('✔ Sample users seeded');

  // 3. Default Settings (e.g. confidence thresholds)
  const defaultSettings = [
    { key: 'confidence.threshold.medium', value: { min: 70, max: 89 } },
    { key: 'confidence.threshold.high', value: { min: 90, max: 100 } },
  ];

  for (const setting of defaultSettings) {
    await prisma.settings.upsert({
      where: { key: setting.key },
      update: {},
      create: {
        key: setting.key,
        value: setting.value,
      },
    });
  }
  console.log('✔ Default settings seeded');

  // 4. Sample Exams
  const sampleExams = [
    { title: 'JEE Main 2024 Mock Test 1', examType: 'JEE_MAIN' as const },
    { title: 'NEET Biology Final Revision', examType: 'JEE_MAIN' as const }, // Temporarily JEE_MAIN as ExamType is limited
    { title: 'BITSAT Physics Practice', examType: 'JEE_MAIN' as const },
  ];

  for (const examData of sampleExams) {
    // Only insert if it doesn't exist to prevent duplicates on re-run
    const existingExam = await prisma.exam.findFirst({
      where: { title: examData.title },
    });

    if (!existingExam) {
      await prisma.exam.create({
        data: {
          title: examData.title,
          examType: examData.examType,
          ownerId: adminUser.id,
        },
      });
    }
  }
  console.log('✔ Sample exams seeded');

  console.log('Seeding complete! 🚀');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
