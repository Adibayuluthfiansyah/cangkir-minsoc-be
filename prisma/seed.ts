import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { parse } from 'pg-connection-string';
import * as bcrypt from 'bcrypt';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL is not set');
}

const parsed = parse(connectionString);

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

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log(' Starting seed...');

  console.log(' Clearing existing data...');
  await prisma.booking.deleteMany();
  await prisma.timeSlot.deleteMany();
  await prisma.admin.deleteMany();

  console.log('Creating admin user...');

  const adminUsername = process.env.ADMIN_DEFAULT_USERNAME;
  const adminPassword = process.env.ADMIN_DEFAULT_PASSWORD;
  const adminFullName = process.env.ADMIN_DEFAULT_FULLNAME || 'Administrator';
  const adminPhone = process.env.ADMIN_DEFAULT_PHONE || '000000000000';

  if (!adminUsername || !adminPassword) {
    throw new Error(
      ' ADMIN_DEFAULT_USERNAME and ADMIN_DEFAULT_PASSWORD must be provided in .env',
    );
  }

  const passwordHash = await bcrypt.hash(adminPassword, 10);
  const admin = await prisma.admin.create({
    data: {
      username: adminUsername,
      passwordHash,
      fullName: adminFullName,
      phone: adminPhone,
      isActive: true,
    },
  });

  console.log(' Admin created:', {
    username: admin.username,
    fullName: admin.fullName,
  });

  console.log(' Creating time slots...');

  const weekdaySlots = [
    { name: 'Pagi 07:00 - 08:00', startTime: '07:00', endTime: '08:00' },
    { name: 'Pagi 08:00 - 09:00', startTime: '08:00', endTime: '09:00' },
    { name: 'Pagi 09:00 - 10:00', startTime: '09:00', endTime: '10:00' },
    { name: 'Pagi 10:00 - 11:00', startTime: '10:00', endTime: '11:00' },
    { name: 'Siang 11:00 - 12:00', startTime: '11:00', endTime: '12:00' },
    { name: 'Siang 12:00 - 13:00', startTime: '12:00', endTime: '13:00' },
    { name: 'Siang 13:00 - 14:00', startTime: '13:00', endTime: '14:00' },
    { name: 'Siang 14:00 - 15:00', startTime: '14:00', endTime: '15:00' },
    { name: 'Sore 15:00 - 16:00', startTime: '15:00', endTime: '16:00' },
    { name: 'Sore 16:00 - 17:00', startTime: '16:00', endTime: '17:00' },
    { name: 'Sore 17:00 - 18:00', startTime: '17:00', endTime: '18:00' },
    { name: 'Malam 18:00 - 19:00', startTime: '18:00', endTime: '19:00' },
    { name: 'Malam 19:00 - 20:00', startTime: '19:00', endTime: '20:00' },
    { name: 'Malam 20:00 - 21:00', startTime: '20:00', endTime: '21:00' },
    { name: 'Malam 21:00 - 22:00', startTime: '21:00', endTime: '22:00' },
    { name: 'Malam 22:00 - 23:00', startTime: '22:00', endTime: '23:00' },
    { name: 'Malam 23:00 - 24:00', startTime: '23:00', endTime: '24:00' },
  ];

  const weekendSlots = [
    { name: 'Pagi 07:00 - 08:00', startTime: '07:00', endTime: '08:00' },
    { name: 'Pagi 08:00 - 09:00', startTime: '08:00', endTime: '09:00' },
    { name: 'Pagi 09:00 - 10:00', startTime: '09:00', endTime: '10:00' },
    { name: 'Pagi 10:00 - 11:00', startTime: '10:00', endTime: '11:00' },
    { name: 'Siang 11:00 - 12:00', startTime: '11:00', endTime: '12:00' },
    { name: 'Siang 12:00 - 13:00', startTime: '12:00', endTime: '13:00' },
    { name: 'Siang 13:00 - 14:00', startTime: '13:00', endTime: '14:00' },
    { name: 'Siang 14:00 - 15:00', startTime: '14:00', endTime: '15:00' },
    { name: 'Sore 15:00 - 16:00', startTime: '15:00', endTime: '16:00' },
    { name: 'Sore 16:00 - 17:00', startTime: '16:00', endTime: '17:00' },
    { name: 'Sore 17:00 - 18:00', startTime: '17:00', endTime: '18:00' },
    { name: 'Malam 18:00 - 19:00', startTime: '18:00', endTime: '19:00' },
    { name: 'Malam 19:00 - 20:00', startTime: '19:00', endTime: '20:00' },
    { name: 'Malam 20:00 - 21:00', startTime: '20:00', endTime: '21:00' },
    { name: 'Malam 21:00 - 22:00', startTime: '21:00', endTime: '22:00' },
    { name: 'Malam 22:00 - 23:00', startTime: '22:00', endTime: '23:00' },
    { name: 'Malam 23:00 - 24:00', startTime: '23:00', endTime: '24:00' },
  ];

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

  console.log(' Time slots created:');
  console.log('   - 4 Weekday slots (Rp 200,000 each)');
  console.log('   - 4 Weekend slots (Rp 300,000 each)');

  //  Display summary
  console.log('\n Seed Summary:');
  const adminCount = await prisma.admin.count();
  const timeSlotCount = await prisma.timeSlot.count();
  console.log(`   - Admins: ${adminCount}`);
  console.log(`   - Time Slots: ${timeSlotCount}`);

  console.log(
    '\n Seed completed successfully! (Admin credentials taken from .env)',
  );
}

main()
  .catch((e) => {
    console.error(' Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
