import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { parse } from 'pg-connection-string';
import * as bcrypt from 'bcrypt';

// Parse DATABASE_URL
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL is not set');
}

const parsed = parse(connectionString);

// Create PostgreSQL connection pool
const pool = new Pool({
  host: process.env.DB_HOST || parsed.host || 'localhost',
  port: parseInt(
    process.env.DB_PORT || (parsed.port?.toString() ?? '5432'),
    10,
  ),
  user: process.env.DB_USER || parsed.user || 'postgres',
  password: process.env.DB_PASSWORD || parsed.password || '',
  database: process.env.DB_NAME || parsed.database || 'postgres',
  ssl: parsed.ssl ? { rejectUnauthorized: false } : undefined,
});

// Create Prisma adapter
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Starting seed...');

  // 1. Clear existing data
  console.log('🗑️  Clearing existing data...');
  await prisma.booking.deleteMany();
  await prisma.timeSlot.deleteMany();
  await prisma.admin.deleteMany();

  // 2. Create Admin
  console.log('👤 Creating admin user...');
  const passwordHash = await bcrypt.hash('admin123', 10);
  const admin = await prisma.admin.create({
    data: {
      username: 'admin',
      passwordHash,
      fullName: 'Administrator',
      phone: '628123456789',
      isActive: true,
    },
  });
  console.log('✅ Admin created:', {
    username: admin.username,
    fullName: admin.fullName,
  });

  // 3. Create Time Slots
  console.log('🕐 Creating time slots...');

  const weekdaySlots = [
    { name: 'Pagi 09:00 - 11:00', startTime: '09:00', endTime: '11:00' },
    { name: 'Siang 11:00 - 13:00', startTime: '11:00', endTime: '13:00' },
    { name: 'Sore 13:00 - 15:00', startTime: '13:00', endTime: '15:00' },
    { name: 'Sore 15:00 - 17:00', startTime: '15:00', endTime: '17:00' },
  ];

  const weekendSlots = [
    { name: 'Pagi 09:00 - 11:00', startTime: '09:00', endTime: '11:00' },
    { name: 'Siang 11:00 - 13:00', startTime: '11:00', endTime: '13:00' },
    { name: 'Sore 13:00 - 15:00', startTime: '13:00', endTime: '15:00' },
    { name: 'Sore 15:00 - 17:00', startTime: '15:00', endTime: '17:00' },
  ];

  // Create weekday slots (Rp 200,000 per slot)
  for (const slot of weekdaySlots) {
    await prisma.timeSlot.create({
      data: {
        name: slot.name,
        startTime: slot.startTime,
        endTime: slot.endTime,
        dayType: 'WEEKDAY',
        price: 200000,
        isActive: true,
        description: `Weekday slot ${slot.startTime} - ${slot.endTime}`,
      },
    });
  }

  // Create weekend slots (Rp 300,000 per slot)
  for (const slot of weekendSlots) {
    await prisma.timeSlot.create({
      data: {
        name: slot.name,
        startTime: slot.startTime,
        endTime: slot.endTime,
        dayType: 'WEEKEND',
        price: 300000,
        isActive: true,
        description: `Weekend slot ${slot.startTime} - ${slot.endTime}`,
      },
    });
  }

  console.log('✅ Time slots created:');
  console.log('   - 4 Weekday slots (Rp 200,000 each)');
  console.log('   - 4 Weekend slots (Rp 300,000 each)');

  // 4. Display summary
  console.log('\n📊 Seed Summary:');
  const adminCount = await prisma.admin.count();
  const timeSlotCount = await prisma.timeSlot.count();
  console.log(`   - Admins: ${adminCount}`);
  console.log(`   - Time Slots: ${timeSlotCount}`);

  console.log('\n🔐 Admin Credentials:');
  console.log('   Username: admin');
  console.log('   Password: admin123');

  console.log('\n✨ Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
