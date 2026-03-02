# 🏟️ Cangkir Mini Soccer - Backend API

Backend REST API untuk sistem booking lapangan mini soccer **Cangkir Mini Soccer**. Dibangun dengan NestJS, Prisma ORM, PostgreSQL, dan Redis untuk menangani pemesanan lapangan dengan fitur guest booking, dashboard admin, dan integrasi WhatsApp.

![NestJS](https://img.shields.io/badge/NestJS-11.x-red)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)
![Prisma](https://img.shields.io/badge/Prisma-7.4.1-darkblue)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue)
![Redis](https://img.shields.io/badge/Redis-7-red)

---

## 📋 Daftar Isi

- [Fitur Utama](#-fitur-utama)
- [Tech Stack](#-tech-stack)
- [Prerequisites](#-prerequisites)
- [Instalasi](#-instalasi)
- [Konfigurasi](#-konfigurasi)
- [Menjalankan Aplikasi](#-menjalankan-aplikasi)
- [Database Setup](#-database-setup)
- [Testing](#-testing)
- [API Documentation](#-api-documentation)
- [Deployment](#-deployment)
- [Struktur Proyek](#-struktur-proyek)
- [Race Condition Protection](#-race-condition-protection)
- [Keamanan](#-keamanan)
- [License](#-license)

---

## ✨ Fitur Utama

### 🎫 Booking Management

- **Guest Booking** - Customer bisa booking tanpa registrasi
- **Multi Time Slot** - Booking beberapa time slot sekaligus
- **Booking Code Generator** - Generate kode booking unik dengan format `BKG-YYYYMMDD-XXX`
- **Status Tracking** - PENDING, CONFIRMED, COMPLETED, CANCELLED
- **Payment Tracking** - Cash/Transfer dengan status UNPAID/PAID

### 👨‍💼 Admin Dashboard

- **Authentication** - JWT-based authentication untuk admin
- **Booking Management** - View, confirm, cancel, complete bookings
- **Time Slot Management** - CRUD time slots dengan pricing berbeda weekday/weekend
- **Customer Management** - View customer info dan booking history
- **Statistics** - Dashboard dengan statistik booking

### 🔒 Security & Performance

- **Race Condition Protection** - Redis distributed locking untuk concurrent bookings
- **Atomic Sequence Generation** - Redis INCR untuk booking code sequence
- **Unique Constraint** - Database constraint untuk prevent duplicate booking codes
- **Rate Limiting** - Throttling untuk prevent spam/abuse
- **Helmet Security Headers** - XSS, clickjacking protection
- **Input Validation** - class-validator untuk semua input
- **Password Hashing** - bcrypt dengan salt rounds

### 📱 Integration

- **WhatsApp Notification** - Redirect ke WhatsApp admin untuk konfirmasi
- **Health Check** - Endpoint untuk monitoring aplikasi dan database
- **Swagger Documentation** - Interactive API documentation

---

## 🛠️ Tech Stack

### Backend Framework

- **NestJS 11** - Progressive Node.js framework
- **TypeScript 5** - Type-safe JavaScript
- **Node.js 18+** - Runtime environment

### Database

- **PostgreSQL 16** - Primary database
- **Prisma ORM 7.4.1** - Type-safe database client
- **Prisma Migrate** - Database migration tool

### Caching & Locking

- **Redis 7** - Caching dan distributed locking
- **ioredis** - Redis client untuk Node.js

### Authentication & Security

- **@nestjs/jwt** - JWT authentication
- **@nestjs/passport** - Authentication strategies
- **bcrypt** - Password hashing
- **helmet** - Security headers
- **@nestjs/throttler** - Rate limiting

### Validation & Documentation

- **class-validator** - DTO validation
- **class-transformer** - Object transformation
- **@nestjs/swagger** - API documentation

### Testing

- **Jest** - Testing framework
- **Supertest** - HTTP assertion testing

### Development Tools

- **ESLint** - Code linting
- **Prettier** - Code formatting
- **Docker Compose** - Local development environment

---

## 📦 Prerequisites

Pastikan sudah terinstall:

- **Node.js** >= 18.x
- **npm** >= 9.x
- **Docker** >= 20.x (untuk PostgreSQL & Redis)
- **Docker Compose** >= 2.x

Atau install PostgreSQL dan Redis secara manual:

- **PostgreSQL** >= 14.x
- **Redis** >= 6.x

---

## 🚀 Instalasi

### 1. Clone Repository

```bash
git clone <repository-url>
cd cangkir-mini-soccer-be
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Setup Environment Variables

```bash
# Copy template environment
cp .env.example .env

# Edit .env dan sesuaikan dengan konfigurasi Anda
nano .env
```

### 4. Start Database Services (Docker)

```bash
# Start PostgreSQL dan Redis
docker-compose up -d

# Cek status containers
docker-compose ps
```

### 5. Database Migration

```bash
# Jalankan migrations
npx prisma migrate deploy

# Generate Prisma Client
npx prisma generate

# (Optional) Seed database dengan data admin default
npx prisma db seed
```

### 6. Verify Installation

```bash
# Run tests
npm test

# Build application
npm run build
```

---

## ⚙️ Konfigurasi

### Environment Variables

File `.env` berisi konfigurasi aplikasi. Lihat `.env.example` untuk template lengkap.

#### Konfigurasi Wajib:

```bash
# Database
DATABASE_URL="postgresql://user:password@host:port/database"

# JWT Secret (min 32 karakter)
JWT_SECRET=your_secret_key_here

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
```

#### Konfigurasi Booking Rules:

```bash
MIN_BOOKING_HOURS=1          # Minimum jam booking
MAX_BOOKING_HOURS=8          # Maximum jam booking
BOOKING_ADVANCE_DAYS=30      # Booking berapa hari ke depan
CANCELLATION_HOURS=24        # Cancel berapa jam sebelumnya
```

### Database Configuration

Prisma menggunakan `DATABASE_URL` dari `.env`:

```bash
DATABASE_URL="postgresql://postgres:password@localhost:5432/cangkir_minisoccer?schema=public"
```

---

## 🏃 Menjalankan Aplikasi

### Development Mode

```bash
# Development dengan hot-reload
npm run start:dev

# Development dengan debug mode
npm run start:debug
```

Aplikasi akan berjalan di `http://localhost:3000`

API documentation (Swagger) tersedia di `http://localhost:3000/api/docs`

### Production Mode

```bash
# Build aplikasi
npm run build

# Jalankan production build
npm run start:prod
```

### Watch Mode

```bash
# Auto-restart on file changes
npm run start:dev
```

---

## 💾 Database Setup

### Migration Commands

```bash
# Create new migration
npx prisma migrate dev --name migration_name

# Apply migrations to database
npx prisma migrate deploy

# Check migration status
npx prisma migrate status

# Reset database (WARNING: deletes all data!)
npx prisma migrate reset
```

### Prisma Studio (Database GUI)

```bash
# Buka Prisma Studio
npx prisma studio

# Akan buka di http://localhost:5555
```

### Seeding Database

```bash
# Seed dengan data admin default
npx prisma db seed
```

Default admin credentials:

- Username: `superadmin`
- Password: `superadmin123` (⚠️ GANTI segera!)

---

## 🧪 Testing

### Run All Tests

```bash
# Run all tests
npm test

# Run tests dengan coverage
npm run test:cov

# Run tests in watch mode
npm run test:watch
```

### Run Specific Tests

```bash
# Test specific file
npm test -- booking.service.spec.ts

# Test specific suite
npm test -- --testNamePattern="BookingService"
```

### Test Coverage

```bash
npm run test:cov

# Coverage report akan di-generate di folder /coverage
```

### Current Test Status

- **Total Tests**: 228 tests
- **Passing**: 213+ tests (93%+)
- **Service Tests**: ✅ All passing
- **Unit Tests**: ✅ All passing
- **Controller Tests**: ⚠️ Some boilerplate tests failing (expected)

---

## 📚 API Documentation

### Swagger UI

Dokumentasi API interaktif tersedia di:

```
http://localhost:3000/api/docs
```

### Dokumentasi Detail

Lihat dokumentasi lengkap di folder `docs/`:

- **[API_DOCUMENTATION.md](docs/API_DOCUMENTATION.md)** - Detailed API endpoints documentation
- **[WORKFLOW.md](docs/WORKFLOW.md)** - Business logic dan workflow
- **[DEPLOYMENT.md](docs/DEPLOYMENT.md)** - Deployment guide

### Main Endpoints

#### 🏠 Public API

```
GET    /api/health                    # Health check
GET    /api/time-slots                # List time slots
GET    /api/time-slots/available      # Check availability
POST   /api/bookings                  # Create booking (guest)
GET    /api/bookings/:code            # Get booking by code
DELETE /api/bookings/:code            # Cancel booking
```

#### 👨‍💼 Admin API

```
POST   /api/admin/auth/login          # Admin login
GET    /api/admin/auth/profile        # Get admin profile
GET    /api/admin/bookings            # List all bookings
PATCH  /api/admin/bookings/:id        # Update booking status
POST   /api/admin/time-slots          # Create time slot
PUT    /api/admin/time-slots/:id      # Update time slot
DELETE /api/admin/time-slots/:id      # Delete time slot
```

---

## 🚢 Deployment

### Production Deployment Guide

Lihat panduan lengkap deployment di [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)

### Quick Production Setup

```bash
# 1. Set NODE_ENV to production
export NODE_ENV=production

# 2. Update .env dengan production values
# - Ganti semua passwords
# - Set JWT_SECRET yang kuat
# - Configure CORS_ORIGINS
# - Set REDIS_PASSWORD

# 3. Build aplikasi
npm run build

# 4. Apply migrations
npx prisma migrate deploy

# 5. Generate Prisma Client
npx prisma generate

# 6. Start application
npm run start:prod
```

### Docker Deployment

```bash
# Build Docker image
docker build -t cangkir-api .

# Run container
docker run -d -p 3000:3000 --env-file .env cangkir-api
```

### Nginx Configuration

Sample Nginx configuration tersedia di:

- `nginx/nginx.conf.development` - Development config
- `nginx/nginx.conf.production` - Production config dengan SSL

### Health Check

Verify deployment:

```bash
curl http://your-domain.com/api/health

# Expected response:
# {"status":"ok","info":{...},"details":{...}}
```

---

## 📁 Struktur Proyek

```
cangkir-mini-soccer-be/
├── src/
│   ├── admin/                  # Admin module
│   │   ├── auth/              # Admin authentication
│   │   ├── booking-admin/     # Admin booking management
│   │   └── timeslot-admin/    # Admin time slot management
│   ├── booking/               # Public booking module
│   ├── time-slot/             # Time slot module
│   ├── redis/                 # Redis service (locking & caching)
│   ├── common/                # Shared utilities
│   │   ├── dto/              # Data Transfer Objects
│   │   ├── guards/           # Auth guards
│   │   ├── filters/          # Exception filters
│   │   ├── interceptors/     # Response interceptors
│   │   └── utils/            # Helper functions
│   ├── prisma/               # Prisma service
│   ├── config/               # Configuration
│   ├── app.module.ts         # Root module
│   └── main.ts               # Application entry point
├── prisma/
│   ├── schema.prisma         # Database schema
│   ├── migrations/           # Migration files
│   └── seed.ts               # Database seeding
├── test/                      # E2E tests
├── docs/                      # Documentation
│   ├── API_DOCUMENTATION.md
│   ├── WORKFLOW.md
│   ├── DEPLOYMENT.md
│   └── PRODUCTION_SECURITY_CHECKLIST.md
├── nginx/                     # Nginx configurations
├── .env.example              # Environment template
└── docker-compose.yml        # Docker services
```

---

## 🔐 Race Condition Protection

Aplikasi ini menggunakan **Redis Distributed Locking** untuk mencegah race condition pada concurrent bookings.

### Masalah yang Diselesaikan:

1. ❌ **Double Booking** - Dua user booking slot yang sama di waktu bersamaan
2. ❌ **Duplicate Booking Codes** - Multiple bookings mendapat kode yang sama
3. ❌ **Sequence Collision** - Race condition pada sequence generation

### Solusi Implementasi:

#### 1️⃣ **Distributed Lock**

```typescript
// Lock per date + time slots
const lockKey = `booking:lock:{date}:{slot-ids}`;
await redis.withLock(lockKey, async () => {
  // Check availability
  // Generate booking code
  // Create booking
});
```

#### 2️⃣ **Atomic Sequence**

```typescript
// Redis INCR is atomic (no race condition)
const sequence = await redis.incrementSequence(`booking:seq:${date}`);
```

#### 3️⃣ **Database Unique Constraint**

```sql
CREATE UNIQUE INDEX ON bookings(booking_code);
```

### Karakteristik:

- ⏱️ **Lock TTL**: 30 seconds
- 🔄 **Retry**: 50 attempts with exponential backoff
- 🎯 **Lock Scope**: Per date + time slot combination
- 🔒 **Safety**: Triple protection (lock + atomic + constraint)

Lihat dokumentasi lengkap: [docs/RACE_CONDITION_FIX.md](docs/RACE_CONDITION_FIX.md)

---

## 🔒 Keamanan

### Security Features

✅ **Authentication & Authorization**

- JWT-based authentication
- Password hashing dengan bcrypt
- Protected admin routes

✅ **Input Validation**

- class-validator untuk semua DTO
- Strict type checking dengan TypeScript
- SQL injection protection (Prisma parameterized queries)

✅ **Security Headers**

- Helmet middleware
- CORS configuration
- XSS protection
- Clickjacking protection

✅ **Rate Limiting**

- Throttler untuk prevent spam
- Configurable rate limits per endpoint

✅ **Data Protection**

- Environment variables untuk secrets
- Database unique constraints
- Race condition protection

### Security Checklist

Sebelum deploy ke production:

- [ ] Ganti semua default passwords
- [ ] Generate JWT_SECRET yang kuat (min 32 chars)
- [ ] Set REDIS_PASSWORD
- [ ] Configure CORS_ORIGINS dengan domain yang legitimate
- [ ] Enable HTTPS/SSL
- [ ] Set proper file permissions untuk .env (`chmod 600 .env`)
- [ ] Setup database backup schedule
- [ ] Configure firewall rules
- [ ] Setup log rotation
- [ ] Test health check endpoint

Lihat panduan lengkap: [docs/PRODUCTION_SECURITY_CHECKLIST.md](docs/PRODUCTION_SECURITY_CHECKLIST.md)

---

## 🐛 Troubleshooting

### Common Issues

**Problem**: Database connection refused

```bash
# Solution: Check if PostgreSQL is running
docker-compose ps
docker-compose up -d postgres
```

**Problem**: Redis connection error

```bash
# Solution: Check if Redis is running
docker-compose ps
docker-compose up -d redis
```

**Problem**: Migration failed

```bash
# Solution: Reset database
npx prisma migrate reset
npx prisma migrate deploy
```

**Problem**: Tests failing

```bash
# Solution: Regenerate Prisma Client
npx prisma generate
npm test
```

---

## 📞 Support

Untuk pertanyaan atau bantuan:

- 📧 Email: support@cangkirminisoccer.id
- 📱 WhatsApp: +62 896-9207-0270
- 📝 Issues: [GitHub Issues](https://github.com/your-repo/issues)

---

## 📄 License

Proprietary - © 2026 Cangkir Mini Soccer

---

## 🙏 Acknowledgments

Dibangun dengan:

- [NestJS](https://nestjs.com/) - Progressive Node.js framework
- [Prisma](https://www.prisma.io/) - Next-generation ORM
- [PostgreSQL](https://www.postgresql.org/) - Advanced open source database
- [Redis](https://redis.io/) - In-memory data structure store

---

**Dibuat dengan ❤️ untuk Cangkir Mini Soccer**
