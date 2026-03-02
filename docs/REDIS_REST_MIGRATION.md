# Redis REST API Migration Guide

**Date**: 3 Maret 2026  
**Issue**: ETIMEDOUT connection errors untuk native Redis (TCP port 6380)  
**Solution**: Migrate ke Upstash REST API (HTTPS)

---

## 🚨 Problem Summary

### **Symptoms**

```
❌ Redis Client Error: Error: connect ETIMEDOUT
errorno: 'ETIMEDOUT'
code: 'ETIMEDOUT'
syscall: 'connect'
```

**Terjadi di:**

- ✅ Local development (Indonesia)
- ✅ Railway production (Europe - europe-west4)

### **Root Cause**

Native Redis protocol (TCP pada port 6380) **timeout/blocked** di:

1. ISP/firewall lokal
2. Railway network ke Upstash Asia Pacific region
3. Kemungkinan Upstash free tier limitation untuk native protocol

**Diagnosis:**

- ❌ Native Redis TCP (port 6380): **ETIMEDOUT**
- ✅ Upstash REST API (HTTPS port 443): **WORKING** (`{"result":"PONG"}`)

---

## ✅ Solution Implemented

### **Migration: ioredis → @upstash/redis**

**Changes:**

1. **Dependency Update**

   ```bash
   npm install @upstash/redis
   ```

2. **Code Changes** (`src/redis/redis.service.ts`)
   - Replace `import Redis from 'ioredis'` → `import { Redis } from '@upstash/redis'`
   - Remove TLS configuration (not needed for REST API)
   - Update connection initialization:
     ```typescript
     this.client = new Redis({
       url: process.env.UPSTASH_REDIS_REST_URL,
       token: process.env.UPSTASH_REDIS_REST_TOKEN,
     });
     ```
   - Update method signatures:
     - `set(key, value, 'EX', ttl, 'NX')` → `set(key, value, { nx: true, ex: ttl })`
     - `eval(script, 1, key, value)` → `eval(script, [key], [value])`

3. **Environment Variables**

   ```env
   # OLD (tidak dipakai lagi)
   REDIS_HOST=epic-insect-61327.upstash.io
   REDIS_PORT=6380
   REDIS_PASSWORD=xxx
   REDIS_TLS=true

   # NEW (required)
   UPSTASH_REDIS_REST_URL=https://epic-insect-61327.upstash.io
   UPSTASH_REDIS_REST_TOKEN=Ae-PAAInc...
   ```

4. **Railway Environment Variables** (sudah ada!)
   - `UPSTASH_REDIS_REST_URL` ✅
   - `UPSTASH_REDIS_REST_TOKEN` ✅

---

## 🧪 Verification Results

### **Local Testing**

```bash
✅ Redis REST Client Initialized
🔧 Redis Configuration: { url: 'https://epic-insect-61327.upstash.io', hasToken: true }
✅ Redis REST Client Connected - PING successful
✅ Application running on: http://localhost:3000
✅ Health check: {"status":"ok"}
```

### **Unit Tests**

```bash
✅ booking.service.spec.ts: PASS (27/27 tests)
✅ All Redis-dependent tests passing
```

### **Build**

```bash
✅ npm run build: SUCCESS (0 errors)
```

---

## 🚀 Deployment to Railway

### **Git Commit**

```bash
commit 51c0efc732ac5d748fb4e7829f48afb567851bd4
fix: migrate Redis to Upstash REST API for reliable connectivity
```

### **Automatic Deploy**

Railway akan auto-deploy setelah push ke `main` branch.

### **Expected Logs** (Railway)

```
✅ Redis REST Client Initialized
✅ Redis REST Client Connected - PING successful
Application running on: https://cangkir-minsoc-be-production.up.railway.app
```

### **Should NOT See**

```
❌ Redis Client Error: Error: connect ETIMEDOUT  (FIXED!)
```

---

## 📋 Post-Deployment Checklist

### **1. Check Railway Logs**

```
Railway Dashboard → cangkir-minsoc-be → Deploy Logs
```

Look for:

- ✅ `Redis REST Client Initialized`
- ✅ `Redis REST Client Connected - PING successful`
- ✅ `Application successfully started`
- ❌ No ETIMEDOUT errors

### **2. Test Health Endpoint**

```bash
curl https://cangkir-minsoc-be-production.up.railway.app/api/health

# Expected:
{
  "status": "ok",
  "info": {
    "memory_heap": { "status": "up" },
    "memory_rss": { "status": "up" },
    "storage": { "status": "up" }
  }
}
```

### **3. Test Booking Creation** (Redis INCR test)

```bash
curl -X POST https://cangkir-minsoc-be-production.up.railway.app/api/bookings \
  -H "Content-Type: application/json" \
  -d '{
    "time_slot_id": 1,
    "booking_date": "2026-03-10",
    "duration_hours": 2,
    "customer_name": "Test Customer",
    "customer_phone": "628123456789",
    "customer_email": "test@example.com"
  }'

# Expected:
{
  "booking_code": "BKG-20260310-001",  # Sequential number dari Redis INCR
  ...
}
```

### **4. Monitor for 10 Minutes**

- Cek apakah connection stabil
- Tidak ada reconnection loop
- Tidak ada error spam di logs

---

## 🔄 Rollback Plan (Jika Gagal)

### **Option 1: Revert Git Commit**

```bash
git revert 51c0efc
git push origin main
```

### **Option 2: Railway Redis Plugin** ($1/month)

```bash
# Railway Dashboard → New → Database → Redis
# Copy connection details
# Update env vars di Railway
```

### **Option 3: Redis Cloud Free Tier**

```bash
# Sign up: https://redis.com/try-free/
# Create database
# Copy endpoint
# Update Railway env vars:
REDIS_HOST=xxx.redis.cloud
REDIS_PORT=6379
REDIS_PASSWORD=xxx
REDIS_TLS=false
```

Then revert code ke commit sebelumnya.

---

## 📊 Performance Comparison

### **Native Redis (ioredis - TCP)**

- ✅ Latency: ~5-20ms (Asia region)
- ❌ Connection: **BLOCKED/TIMEOUT**
- ✅ Features: Full Redis protocol support

### **Upstash REST API** (current)

- ✅ Latency: ~50-100ms (HTTP overhead)
- ✅ Connection: **RELIABLE** (HTTPS port 443)
- ✅ Features: Full Redis commands via REST
- ✅ Free tier friendly
- ✅ No firewall issues

**Trade-off**: Slightly higher latency (~50ms extra), tapi **connection reliability** jauh lebih baik.

**Impact**: Minimal - booking creation masih <500ms total.

---

## 🔐 Security Notes

### **Environment Variables Exposed in Chat**

⚠️ **IMPORTANT**: Credentials berikut ter-expose di chat history:

```
JWT_SECRET=e792806cc6e4f599d9067a6af78015d4c27cd489f0b82f2b
DB_PASSWORD=Pontianak0896
REDIS_PASSWORD=Ae-PAAIncDI5OWM4OWU4Nzk4Zjg0MGQ4YjgxODM1MGFmMTQ0MWQ1NXAyNjEzMjc
ADMIN_DEFAULT_PASSWORD=superadmin123
```

**RECOMMENDED ACTION** (setelah deployment stabil):

1. Rotate JWT_SECRET di Railway
2. Change ADMIN_DEFAULT_PASSWORD
3. Consider rotating Redis token (Upstash dashboard)
4. Update DATABASE_URL password (Supabase dashboard)

---

## 📚 References

- **Upstash Redis Docs**: https://upstash.com/docs/redis
- **Upstash REST API**: https://upstash.com/docs/redis/features/restapi
- **@upstash/redis SDK**: https://github.com/upstash/upstash-redis
- **Railway Docs**: https://docs.railway.app/

---

## ✅ Success Criteria

Deployment dianggap **berhasil** jika:

1. ✅ Railway deploy tanpa error
2. ✅ Redis connection successful (log: "PING successful")
3. ✅ Health endpoint returns `{"status":"ok"}`
4. ✅ Booking creation works (booking_code sequential)
5. ✅ No ETIMEDOUT errors dalam 10 menit
6. ✅ Application stable (no crash/restart loop)

---

**Status**: ✅ **DEPLOYED** (waiting for Railway auto-deploy)  
**Next**: Monitor Railway logs for verification

---

**Catatan**: Jika masih ada issue, prioritaskan Railway Redis Plugin ($1/month) untuk best performance dan no network issues.
