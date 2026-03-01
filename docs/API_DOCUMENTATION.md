# API Documentation

Complete REST API documentation for Cangkir Mini Soccer Backend.

**Base URL**: `http://localhost:3000/api`

**Interactive Documentation**: http://localhost:3000/api/docs (Swagger UI)

## Table of Contents

- [Authentication](#authentication)
- [Error Handling](#error-handling)
- [Rate Limiting](#rate-limiting)
- [Public Endpoints](#public-endpoints)
  - [Time Slots](#time-slots)
  - [Bookings](#bookings)
  - [Health](#health)
- [Admin Endpoints](#admin-endpoints)
  - [Admin Authentication](#admin-authentication)
  - [Admin Booking Management](#admin-booking-management)
  - [Admin Time Slot Management](#admin-time-slot-management)

---

## Authentication

### Admin Authentication

Admin endpoints require JWT token authentication.

**Header Format:**

```
Authorization: Bearer <jwt_token>
```

**How to obtain token:**

1. Call `POST /api/admin/auth/login` with credentials
2. Extract `accessToken` from response
3. Include in Authorization header for protected endpoints

**Token Expiration:**

- Default: 7 days
- Configurable via `JWT_EXPIRATION` environment variable

---

## Error Handling

All errors follow a consistent format:

### Error Response Structure

```json
{
  "statusCode": 400,
  "message": "Detailed error message",
  "error": "Bad Request",
  "timestamp": "2024-02-28T10:30:00.000Z",
  "path": "/api/bookings"
}
```

### HTTP Status Codes

| Code | Description                               |
| ---- | ----------------------------------------- |
| 200  | Success                                   |
| 201  | Created                                   |
| 400  | Bad Request (validation error)            |
| 401  | Unauthorized (missing/invalid token)      |
| 403  | Forbidden (insufficient permissions)      |
| 404  | Not Found                                 |
| 409  | Conflict (e.g., time slot already booked) |
| 429  | Too Many Requests (rate limit exceeded)   |
| 500  | Internal Server Error                     |

---

## Rate Limiting

**Default Limit**: 10 requests per minute per IP address

**Headers:**

- `X-RateLimit-Limit`: Maximum requests allowed
- `X-RateLimit-Remaining`: Remaining requests in current window
- `X-RateLimit-Reset`: Timestamp when limit resets

**Rate Limit Exceeded Response:**

```json
{
  "statusCode": 429,
  "message": "Too Many Requests",
  "error": "ThrottlerException"
}
```

---

# Public Endpoints

## Time Slots

### Get All Time Slots

Retrieve all active time slots grouped by day type.

**Endpoint:** `GET /api/time-slots`

**Authentication:** None

**Query Parameters:** None

**Response:** `200 OK`

```json
{
  "weekday": [
    {
      "id": 1,
      "startTime": "08:00",
      "endTime": "09:00",
      "dayType": "WEEKDAY",
      "price": 200000,
      "isActive": true
    }
  ],
  "weekend": [
    {
      "id": 5,
      "startTime": "08:00",
      "endTime": "09:00",
      "dayType": "WEEKEND",
      "price": 300000,
      "isActive": true
    }
  ]
}
```

---

### Get Time Slots by Day Type

Filter time slots by WEEKDAY or WEEKEND.

**Endpoint:** `GET /api/time-slots/by-day-type/:dayType`

**Authentication:** None

**Path Parameters:**

- `dayType` (string, required): `WEEKDAY` or `WEEKEND`

**Example:** `GET /api/time-slots/by-day-type/WEEKEND`

**Response:** `200 OK`

```json
[
  {
    "id": 5,
    "startTime": "08:00",
    "endTime": "09:00",
    "dayType": "WEEKEND",
    "price": 300000,
    "isActive": true
  }
]
```

**Errors:**

- `400`: Invalid dayType (must be WEEKDAY or WEEKEND)

---

### Get Time Slot by ID

Retrieve a specific time slot by ID.

**Endpoint:** `GET /api/time-slots/:id`

**Authentication:** None

**Path Parameters:**

- `id` (number, required): Time slot ID

**Example:** `GET /api/time-slots/1`

**Response:** `200 OK`

```json
{
  "id": 1,
  "startTime": "08:00",
  "endTime": "09:00",
  "dayType": "WEEKDAY",
  "price": 200000,
  "isActive": true
}
```

**Errors:**

- `404`: Time slot not found

---

## Bookings

### Check Availability

Check which time slots are available for a specific date.

**Endpoint:** `GET /api/bookings/availability`

**Authentication:** None

**Query Parameters:**

- `date` (string, required): Booking date in `YYYY-MM-DD` format

**Example:** `GET /api/bookings/availability?date=2024-12-25`

**Response:** `200 OK`

```json
{
  "date": "2024-12-25",
  "dayType": "WEEKEND",
  "availableSlots": [
    {
      "id": 5,
      "startTime": "08:00",
      "endTime": "09:00",
      "price": 300000,
      "isBooked": false
    },
    {
      "id": 6,
      "startTime": "09:00",
      "endTime": "10:00",
      "price": 300000,
      "isBooked": true
    }
  ]
}
```

**Errors:**

- `400`: Invalid date format
- `400`: Date cannot be in the past

---

### Create Booking

Create a new booking for one or multiple consecutive hours.

**Endpoint:** `POST /api/bookings`

**Authentication:** None

**Request Body:**

```json
{
  "customerName": "John Doe",
  "customerPhone": "628123456789",
  "bookingDate": "2024-12-25",
  "timeSlotIds": [1, 2, 3],
  "paymentMethod": "CASH"
}
```

**Field Validation:**

- `customerName`: Required, 3-100 characters
- `customerPhone`: Required, valid Indonesian phone (08xxx or 628xxx)
- `bookingDate`: Required, format `YYYY-MM-DD`, cannot be in past
- `timeSlotIds`: Required, array of 1-8 slot IDs
- `paymentMethod`: Required, either `CASH` or `TRANSFER`

**Response:** `201 Created`

```json
{
  "bookingCode": "BKG-20241225-001",
  "bookings": [
    {
      "id": 1,
      "bookingCode": "BKG-20241225-001",
      "customerName": "John Doe",
      "customerPhone": "628123456789",
      "bookingDate": "2024-12-25",
      "timeSlot": {
        "id": 1,
        "startTime": "08:00",
        "endTime": "09:00"
      },
      "price": 300000,
      "totalPrice": 900000,
      "bookingStatus": "PENDING",
      "paymentMethod": "CASH",
      "paymentStatus": "UNPAID",
      "createdAt": "2024-02-28T10:30:00.000Z"
    }
  ],
  "totalPrice": 900000,
  "whatsappUrl": "https://wa.me/628123456789?text=Hi%20Admin%2C%20I%20want%20to%20confirm%20my%20booking%20BKG-20241225-001"
}
```

**Business Rules:**

- Minimum 1 hour, maximum 8 hours per booking
- Cannot book more than 30 days in advance (configurable)
- Cannot book in the past
- All selected time slots must be available
- Time slots must be for the same day type (all WEEKDAY or all WEEKEND)

**Errors:**

- `400`: Validation error (invalid input)
- `409`: One or more time slots already booked
- `400`: Exceeds maximum booking hours
- `400`: Date exceeds maximum advance booking days
- `404`: One or more time slot IDs not found

---

### Get Booking by Code

Retrieve booking details using booking code.

**Endpoint:** `GET /api/bookings/:bookingCode`

**Authentication:** None

**Path Parameters:**

- `bookingCode` (string, required): Booking code (e.g., `BKG-20241225-001`)

**Example:** `GET /api/bookings/BKG-20241225-001`

**Response:** `200 OK`

```json
{
  "bookingCode": "BKG-20241225-001",
  "customerName": "John Doe",
  "customerPhone": "628123456789",
  "bookingDate": "2024-12-25",
  "bookingStatus": "CONFIRMED",
  "paymentMethod": "CASH",
  "paymentStatus": "PAID",
  "totalPrice": 900000,
  "bookings": [
    {
      "id": 1,
      "timeSlot": {
        "id": 1,
        "startTime": "08:00",
        "endTime": "09:00"
      },
      "price": 300000
    }
  ],
  "createdAt": "2024-02-28T10:30:00.000Z",
  "updatedAt": "2024-02-28T11:00:00.000Z"
}
```

**Errors:**

- `404`: Booking not found

---

### Cancel Booking

Cancel a booking by booking code.

**Endpoint:** `POST /api/bookings/:bookingCode/cancel`

**Authentication:** None

**Path Parameters:**

- `bookingCode` (string, required): Booking code

**Request Body:**

```json
{
  "cancellationReason": "Change of plans"
}
```

**Field Validation:**

- `cancellationReason`: Optional, max 500 characters

**Example:** `POST /api/bookings/BKG-20241225-001/cancel`

**Response:** `200 OK`

```json
{
  "message": "Booking cancelled successfully",
  "bookingCode": "BKG-20241225-001",
  "refundEligible": true
}
```

**Business Rules:**

- Can only cancel bookings with status `PENDING` or `CONFIRMED`
- Must cancel at least 24 hours before booking date (configurable)
- Cannot cancel `COMPLETED` or already `CANCELLED` bookings

**Errors:**

- `404`: Booking not found
- `400`: Cannot cancel booking less than 24 hours before booking date
- `400`: Cannot cancel booking with status COMPLETED or CANCELLED

---

## Health

### Health Check

Comprehensive health check including memory and disk usage.

**Endpoint:** `GET /api/health`

**Authentication:** None

**Response:** `200 OK`

```json
{
  "status": "ok",
  "info": {
    "database": {
      "status": "up"
    },
    "memory_heap": {
      "status": "up"
    },
    "memory_rss": {
      "status": "up"
    },
    "storage": {
      "status": "up"
    }
  },
  "error": {},
  "details": {
    "database": {
      "status": "up"
    },
    "memory_heap": {
      "status": "up"
    },
    "memory_rss": {
      "status": "up"
    },
    "storage": {
      "status": "up"
    }
  }
}
```

**Response:** `503 Service Unavailable` (if any service is down)

---

### Ping

Simple ping endpoint for basic health check.

**Endpoint:** `GET /api/health/ping`

**Authentication:** None

**Response:** `200 OK`

```json
{
  "status": "ok",
  "timestamp": "2024-02-28T10:30:00.000Z"
}
```

---

# Admin Endpoints

All admin endpoints require JWT authentication via `Authorization: Bearer <token>` header.

## Admin Authentication

### Admin Login

Authenticate admin and receive JWT token.

**Endpoint:** `POST /api/admin/auth/login`

**Authentication:** None

**Request Body:**

```json
{
  "username": "admin",
  "password": "admin123"
}
```

**Response:** `200 OK`

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "admin": {
    "id": 1,
    "username": "admin"
  },
  "expiresIn": "7d"
}
```

**Errors:**

- `401`: Invalid username or password

---

### Get Admin Profile

Retrieve authenticated admin's profile.

**Endpoint:** `GET /api/admin/auth/profile`

**Authentication:** Required (Bearer token)

**Response:** `200 OK`

```json
{
  "id": 1,
  "username": "admin",
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

**Errors:**

- `401`: Unauthorized (missing or invalid token)

---

## Admin Booking Management

### List Bookings

List all bookings with advanced filtering and pagination.

**Endpoint:** `GET /api/admin/bookings`

**Authentication:** Required

**Query Parameters:**

| Parameter       | Type   | Description                                                        | Example                   |
| --------------- | ------ | ------------------------------------------------------------------ | ------------------------- |
| `page`          | number | Page number (default: 1)                                           | `page=2`                  |
| `limit`         | number | Items per page (default: 10, max: 100)                             | `limit=20`                |
| `search`        | string | Search by customer name, phone, or booking code                    | `search=John`             |
| `bookingStatus` | string | Filter by status: `PENDING`, `CONFIRMED`, `COMPLETED`, `CANCELLED` | `bookingStatus=CONFIRMED` |
| `paymentStatus` | string | Filter by payment: `PAID`, `UNPAID`                                | `paymentStatus=PAID`      |
| `paymentMethod` | string | Filter by payment method: `CASH`, `TRANSFER`                       | `paymentMethod=CASH`      |
| `startDate`     | string | Filter from date (YYYY-MM-DD)                                      | `startDate=2024-01-01`    |
| `endDate`       | string | Filter to date (YYYY-MM-DD)                                        | `endDate=2024-12-31`      |
| `sortBy`        | string | Sort field: `bookingDate`, `createdAt`, `totalPrice`               | `sortBy=bookingDate`      |
| `sortOrder`     | string | Sort direction: `asc`, `desc` (default: `desc`)                    | `sortOrder=asc`           |

**Example:** `GET /api/admin/bookings?page=1&limit=10&bookingStatus=CONFIRMED&sortBy=bookingDate`

**Response:** `200 OK`

```json
{
  "data": [
    {
      "id": 1,
      "bookingCode": "BKG-20241225-001",
      "customerName": "John Doe",
      "customerPhone": "628123456789",
      "bookingDate": "2024-12-25",
      "bookingStatus": "CONFIRMED",
      "paymentMethod": "CASH",
      "paymentStatus": "PAID",
      "totalPrice": 900000,
      "hoursBooked": 3,
      "createdAt": "2024-02-28T10:30:00.000Z",
      "updatedAt": "2024-02-28T11:00:00.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 50,
    "totalPages": 5,
    "hasNextPage": true,
    "hasPreviousPage": false
  }
}
```

---

### Get Booking Statistics

Get dashboard statistics for bookings and revenue.

**Endpoint:** `GET /api/admin/bookings/statistics`

**Authentication:** Required

**Query Parameters:**

- `startDate` (optional): Filter from date (YYYY-MM-DD)
- `endDate` (optional): Filter to date (YYYY-MM-DD)

**Example:** `GET /api/admin/bookings/statistics?startDate=2024-01-01&endDate=2024-12-31`

**Response:** `200 OK`

```json
{
  "totalBookings": 150,
  "bookingsByStatus": {
    "PENDING": 20,
    "CONFIRMED": 80,
    "COMPLETED": 40,
    "CANCELLED": 10
  },
  "revenue": {
    "total": 45000000,
    "paid": 40000000,
    "unpaid": 5000000
  },
  "revenueByPaymentMethod": {
    "CASH": 25000000,
    "TRANSFER": 15000000
  },
  "averageBookingValue": 300000,
  "popularTimeSlots": [
    {
      "timeSlotId": 3,
      "startTime": "10:00",
      "endTime": "11:00",
      "bookingCount": 45
    }
  ]
}
```

---

### Get Booking Details

Get detailed information about a specific booking.

**Endpoint:** `GET /api/admin/bookings/:id`

**Authentication:** Required

**Path Parameters:**

- `id` (number, required): Booking ID

**Example:** `GET /api/admin/bookings/1`

**Response:** `200 OK`

```json
{
  "id": 1,
  "bookingCode": "BKG-20241225-001",
  "bookingGroupId": "uuid-here",
  "customerName": "John Doe",
  "customerPhone": "628123456789",
  "bookingDate": "2024-12-25",
  "timeSlot": {
    "id": 1,
    "startTime": "08:00",
    "endTime": "09:00",
    "dayType": "WEEKEND"
  },
  "price": 300000,
  "totalPrice": 900000,
  "bookingStatus": "CONFIRMED",
  "paymentMethod": "CASH",
  "paymentStatus": "PAID",
  "adminNotes": "Customer paid in full",
  "cancellationReason": null,
  "createdAt": "2024-02-28T10:30:00.000Z",
  "updatedAt": "2024-02-28T11:00:00.000Z",
  "relatedBookings": [
    {
      "id": 2,
      "timeSlot": {
        "startTime": "09:00",
        "endTime": "10:00"
      }
    }
  ]
}
```

**Errors:**

- `404`: Booking not found

---

### Update Booking Status

Update the status of a booking.

**Endpoint:** `PATCH /api/admin/bookings/:id/status`

**Authentication:** Required

**Path Parameters:**

- `id` (number, required): Booking ID

**Request Body:**

```json
{
  "bookingStatus": "CONFIRMED",
  "adminNotes": "Customer called to confirm booking"
}
```

**Field Validation:**

- `bookingStatus`: Required, one of: `PENDING`, `CONFIRMED`, `COMPLETED`, `CANCELLED`
- `adminNotes`: Optional, max 1000 characters

**Response:** `200 OK`

```json
{
  "id": 1,
  "bookingCode": "BKG-20241225-001",
  "bookingStatus": "CONFIRMED",
  "adminNotes": "Customer called to confirm booking",
  "updatedAt": "2024-02-28T11:00:00.000Z"
}
```

**Note:** This updates ALL bookings in the same booking group (same `bookingCode`).

**Errors:**

- `404`: Booking not found
- `400`: Invalid booking status

---

### Update Payment Status

Update payment status and method for a booking.

**Endpoint:** `PATCH /api/admin/bookings/:id/payment`

**Authentication:** Required

**Path Parameters:**

- `id` (number, required): Booking ID

**Request Body:**

```json
{
  "paymentStatus": "PAID",
  "paymentMethod": "TRANSFER",
  "adminNotes": "Transfer confirmed via bank statement"
}
```

**Field Validation:**

- `paymentStatus`: Required, either `PAID` or `UNPAID`
- `paymentMethod`: Optional, either `CASH` or `TRANSFER`
- `adminNotes`: Optional, max 1000 characters

**Response:** `200 OK`

```json
{
  "id": 1,
  "bookingCode": "BKG-20241225-001",
  "paymentStatus": "PAID",
  "paymentMethod": "TRANSFER",
  "adminNotes": "Transfer confirmed via bank statement",
  "updatedAt": "2024-02-28T11:00:00.000Z"
}
```

**Note:** This updates ALL bookings in the same booking group (same `bookingCode`).

**Errors:**

- `404`: Booking not found
- `400`: Invalid payment status or method

---

## Admin Time Slot Management

### List All Time Slots (Admin)

List all time slots including inactive ones.

**Endpoint:** `GET /api/admin/time-slots`

**Authentication:** Required

**Response:** `200 OK`

```json
[
  {
    "id": 1,
    "startTime": "08:00",
    "endTime": "09:00",
    "dayType": "WEEKDAY",
    "price": 200000,
    "isActive": true,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
]
```

---

### Get Time Slot Details (Admin)

Get detailed information about a time slot.

**Endpoint:** `GET /api/admin/time-slots/:id`

**Authentication:** Required

**Path Parameters:**

- `id` (number, required): Time slot ID

**Response:** `200 OK`

```json
{
  "id": 1,
  "startTime": "08:00",
  "endTime": "09:00",
  "dayType": "WEEKDAY",
  "price": 200000,
  "isActive": true,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z",
  "bookingCount": 45
}
```

**Errors:**

- `404`: Time slot not found

---

### Create Time Slot

Create a new time slot.

**Endpoint:** `POST /api/admin/time-slots`

**Authentication:** Required

**Request Body:**

```json
{
  "startTime": "08:00",
  "endTime": "09:00",
  "dayType": "WEEKDAY",
  "price": 200000
}
```

**Field Validation:**

- `startTime`: Required, format `HH:mm` (24-hour)
- `endTime`: Required, format `HH:mm` (24-hour), must be after startTime
- `dayType`: Required, either `WEEKDAY` or `WEEKEND`
- `price`: Required, positive number, minimum 0

**Response:** `201 Created`

```json
{
  "id": 9,
  "startTime": "08:00",
  "endTime": "09:00",
  "dayType": "WEEKDAY",
  "price": 200000,
  "isActive": true,
  "createdAt": "2024-02-28T11:00:00.000Z",
  "updatedAt": "2024-02-28T11:00:00.000Z"
}
```

**Business Rules:**

- Cannot overlap with existing time slots for the same day type
- End time must be after start time
- Time format must be valid 24-hour format

**Errors:**

- `400`: Validation error
- `409`: Time slot overlaps with existing slot for the same day type

---

### Update Time Slot

Update an existing time slot.

**Endpoint:** `PUT /api/admin/time-slots/:id`

**Authentication:** Required

**Path Parameters:**

- `id` (number, required): Time slot ID

**Request Body:**

```json
{
  "startTime": "08:00",
  "endTime": "09:00",
  "dayType": "WEEKDAY",
  "price": 250000
}
```

**Response:** `200 OK`

```json
{
  "id": 1,
  "startTime": "08:00",
  "endTime": "09:00",
  "dayType": "WEEKDAY",
  "price": 250000,
  "isActive": true,
  "updatedAt": "2024-02-28T11:30:00.000Z"
}
```

**Business Rules:**

- Cannot change time if there are active future bookings for this slot
- Cannot create overlap with other time slots
- Price changes only affect new bookings

**Errors:**

- `404`: Time slot not found
- `400`: Cannot update time slot with active future bookings
- `409`: Updated time overlaps with another slot

---

### Toggle Time Slot Active Status

Activate or deactivate a time slot.

**Endpoint:** `PATCH /api/admin/time-slots/:id/toggle-active`

**Authentication:** Required

**Path Parameters:**

- `id` (number, required): Time slot ID

**Response:** `200 OK`

```json
{
  "id": 1,
  "isActive": false,
  "updatedAt": "2024-02-28T11:45:00.000Z"
}
```

**Business Rules:**

- Deactivating a slot hides it from public API
- Does not affect existing bookings
- Cannot deactivate if there are pending bookings

**Errors:**

- `404`: Time slot not found
- `400`: Cannot deactivate time slot with pending bookings

---

### Delete Time Slot

Delete a time slot permanently.

**Endpoint:** `DELETE /api/admin/time-slots/:id`

**Authentication:** Required

**Path Parameters:**

- `id` (number, required): Time slot ID

**Response:** `200 OK`

```json
{
  "message": "Time slot deleted successfully"
}
```

**Business Rules:**

- Can only delete if no active bookings exist
- This is a hard delete (permanent)
- Consider deactivating instead of deleting

**Errors:**

- `404`: Time slot not found
- `400`: Cannot delete time slot with active bookings

---

## Webhooks & Events

Currently not implemented. Future versions may include:

- Booking confirmation webhooks
- Payment notification webhooks
- Real-time updates via WebSocket

---

## Data Models

### Booking Status Enum

- `PENDING`: Initial state after booking creation
- `CONFIRMED`: Admin confirmed the booking
- `COMPLETED`: Booking finished successfully
- `CANCELLED`: Booking cancelled by guest or admin

### Payment Status Enum

- `UNPAID`: Payment not received
- `PAID`: Payment confirmed by admin

### Payment Method Enum

- `CASH`: Cash payment
- `TRANSFER`: Bank transfer

### Day Type Enum

- `WEEKDAY`: Monday to Friday
- `WEEKEND`: Saturday and Sunday

---

## Best Practices

### For Frontend Integration

1. **Always check availability** before showing booking form
2. **Store booking code** securely after creation
3. **Handle WhatsApp redirect** properly on mobile/desktop
4. **Validate phone numbers** client-side before submission
5. **Show cancellation policy** clearly (24-hour rule)
6. **Handle rate limiting** with exponential backoff

### For Admin Integration

1. **Store JWT token** securely (httpOnly cookie recommended)
2. **Refresh token** before expiration
3. **Handle 401 errors** by redirecting to login
4. **Use pagination** for large datasets
5. **Implement search debouncing** (300ms recommended)
6. **Cache statistics** with reasonable TTL

### Security Considerations

1. **Never expose JWT secret** in client-side code
2. **Validate all inputs** on both client and server
3. **Use HTTPS** in production
4. **Implement CSRF protection** for admin panel
5. **Rate limit login attempts**
6. **Log all admin actions** for audit trail

---

## Changelog

### Version 0.0.1 (Current)

- Initial API release
- Guest booking functionality
- Admin authentication & management
- Time slot CRUD operations
- Health check endpoints

---

## Support

For API issues or questions:

- Check Swagger documentation: `/api/docs`
- Review this documentation
- Contact development team
- Create issue in repository

---

**Last Updated**: February 28, 2024
