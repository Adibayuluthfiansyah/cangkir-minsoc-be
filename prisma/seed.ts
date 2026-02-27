import { PrismaClient, DayType } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { parse } from 'pg-connection-string';
import * as bcrypt from 'bcrypt';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL is not set in environment variables');
}

const parsed = parse(connectionString);

const pool = new Pool({
  host: process.env.DB_HOST || parsed.host || 'localhost',
  port: parseInt(process.env.DB_PORT || String(parsed.port) || '5432', 10),
  user: process.env.DB_USER || parsed.user || 'postgres',
  password: process.env.DB_PASSWORD || parsed.password || '',
  database: process.env.DB_NAME || parsed.database || 'postgres',
  ssl: parsed.ssl ? { rejectUnauthorized: false } : undefined,
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log(' Starting seed...');

  console.log(' Cleaning existing data...');
  await prisma.booking.deleteMany();
  await prisma.timeSlot.deleteMany();
  await prisma.admin.deleteMany();

  console.log(' Creating default admin...');

  const adminPassword = await bcrypt.hash('admin123', 10);

  const admin = await prisma.admin.create({
    data: {
      username: 'admin',
      passwordHash: adminPassword,
      fullName: 'Administrator',
      phone: '08123456789',
      isActive: true,
    },
  });

  console.log(`Admin created: ${admin.username}`);

  console.log(' Creating time slots...');

  const timeSlots = [
    {
      name: 'Pagi Weekday',
      startTime: '09:00',
      endTime: '11:00',
      dayType: DayType.WEEKDAY,
      price: 200000,
      description: 'Lapangan mini soccer 2 jam - Senin sampai Jumat',
    },
    {
      name: 'Siang Weekday',
      startTime: '11:00',
      endTime: '13:00',
      dayType: DayType.WEEKDAY,
      price: 200000,
      description: 'Lapangan mini soccer 2 jam - Senin sampai Jumat',
    },
    {
      name: 'Sore Weekday',
      startTime: '13:00',
      endTime: '15:00',
      dayType: DayType.WEEKDAY,
      price: 200000,
      description: 'Lapangan mini soccer 2 jam - Senin sampai Jumat',
    },
    {
      name: 'Sore Akhir Weekday',
      startTime: '15:00',
      endTime: '17:00',
      dayType: DayType.WEEKDAY,
      price: 200000,
      description: 'Lapangan mini soccer 2 jam - Senin sampai Jumat',
    },

    // WEEKEND SLOTS
    {
      name: 'Pagi Weekend',
      startTime: '09:00',
      endTime: '11:00',
      dayType: DayType.WEEKEND,
      price: 300000,
      description: 'Lapangan mini soccer 2 jam - Sabtu dan Minggu',
    },
    {
      name: 'Siang Weekend',
      startTime: '11:00',
      endTime: '13:00',
      dayType: DayType.WEEKEND,
      price: 300000,
      description: 'Lapangan mini soccer 2 jam - Sabtu dan Minggu',
    },
    {
      name: 'Sore Weekend',
      startTime: '13:00',
      endTime: '15:00',
      dayType: DayType.WEEKEND,
      price: 300000,
      description: 'Lapangan mini soccer 2 jam - Sabtu dan Minggu',
    },
    {
      name: 'Sore Akhir Weekend',
      startTime: '15:00',
      endTime: '17:00',
      dayType: DayType.WEEKEND,
      price: 300000,
      description: 'Lapangan mini soccer 2 jam - Sabtu dan Minggu',
    },
  ];

  for (const slot of timeSlots) {
    await prisma.timeSlot.create({
      data: slot,
    });
    console.log(
      `Time slot created: ${slot.name} (${slot.startTime}-${slot.endTime})`,
    );
  }

  console.log('\n Seed completed successfully!');
  console.log('\n Summary:');
  console.log(`   - Admins: 1`);
  console.log(`   - Time Slots: ${timeSlots.length} (4 Weekday + 4 Weekend)`);
  console.log('\n Default Admin Credentials:');
  console.log('   Username: admin');
  console.log('   Password: admin123');
  console.log('\n Pricing:');
  console.log('   Weekday: Rp 200,000 per 2 jam');
  console.log('   Weekend: Rp 300,000 per 2 jam');
  console.log('\n You can now start the application!');
}

main()
  .catch((e) => {
    console.error(' Error during seed:');
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
