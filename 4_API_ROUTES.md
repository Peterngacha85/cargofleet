# 4️⃣ REST API ROUTES & ENDPOINTS

**Complete API documentation with request/response examples**

---

## 📍 Base URL
```
Development: http://localhost:5000/api
Production: https://cargofleet-backend.onrender.com/api
```

---

## 🔐 Auth Routes

### POST /auth/super-admin/login
**Super Admin login with 2FA**
```
POST /api/auth/super-admin/login
Content-Type: application/json

{
  "email": "admin1@cargofleet.co.ke",
  "password": "hashed_password",
  "secretCode": "1234"
}

Response:
{
  "success": true,
  "status": "success",
  "message": "Super admin authenticated successfully",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "super_admin_1",
      "email": "admin1@cargofleet.co.ke",
      "role": "admin"
    }
  },
  "errors": null
}
```

### POST /auth/login
**Driver/Manager login**
```
POST /api/auth/login
Content-Type: application/json

{
  "email": "driver@example.com",
  "password": "securePassword123"
}

Response:
{
  "success": true,
  "status": "success",
  "message": "Login successful",
  "data": {
    "accessToken": "...",
    "refreshToken": "...",
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "email": "driver@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "driver",
      "phone": "+254712345678"
    }
  },
  "errors": null
}
```

### POST /auth/google/login
**Google OAuth login**
```
POST /api/auth/google/login?role=driver
Content-Type: application/json

{
  "tokenId": "eyJhbGciOiJSUzI1NiIsImtpZCI6IjEifQ..."
}
```

### POST /auth/register/driver
**Driver registration (pending approval)**
```
POST /api/auth/register/driver
Content-Type: application/json

{
  "email": "driver@example.com",
  "password": "securePassword123",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+254712345678",
  "drivingLicenseNumber": "D12345",
  "licenseExpiry": "2026-12-31",
  "emergencyContactName": "Jane Doe",
  "emergencyContactPhone": "+254787654321"
}

Response:
{
  "success": true,
  "status": "success",
  "message": "Driver registration submitted for approval",
  "data": {
    "driverId": "507f1f77bcf86cd799439012",
    "status": "pending_approval"
  },
  "errors": null
}
```

### POST /auth/register/manager
**Manager registration (pending verification)**
```
POST /api/auth/register/manager
Content-Type: application/json

{
  "email": "manager@example.com",
  "password": "securePassword123",
  "firstName": "Jane",
  "lastName": "Smith",
  "phone": "+254712345678"
}

Response:
{
  "success": true,
  "status": "success",
  "message": "Manager registration submitted for verification",
  "data": {
    "managerId": "507f1f77bcf86cd799439013",
    "status": "pending_verification"
  },
  "errors": null
}
```

### POST /auth/refresh
**Refresh access token**
```
POST /api/auth/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}

Response:
{
  "success": true,
  "status": "success",
  "message": "Access token refreshed",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "errors": null
}
```

---

## 👥 Driver Routes

### GET /drivers/:driverId
**Get driver profile**
```
GET /api/drivers/507f1f77bcf86cd799439011
Authorization: Bearer <accessToken>

Response:
{
  "success": true,
  "data": {
    "driver": {
      "_id": "507f1f77bcf86cd799439011",
      "userId": "507f1f77bcf86cd799439010",
      "drivingLicenseNumber": "D12345",
      "status": "active",
      "branchId": "507f1f77bcf86cd799439100",
      "assignedVehicleId": "507f1f77bcf86cd799439200",
      "totalTrips": 45,
      "completedTrips": 43,
      "avgRating": 4.8,
      "totalEarnings": 125000
    }
  },
  "errors": null
}
```

### GET /drivers/pending-approval
**Get pending driver registrations (Manager endpoint)**
```
GET /api/drivers/pending-approval
Authorization: Bearer <accessToken>

Response:
{
  "success": true,
  "data": {
    "drivers": [
      {
        "_id": "507f1f77bcf86cd799439012",
        "user": {
          "firstName": "John",
          "lastName": "Doe",
          "email": "john@example.com",
          "phone": "+254712345678"
        },
        "drivingLicenseNumber": "D12345",
        "status": "pending_approval",
        "createdAt": "2024-09-04T10:30:00Z"
      }
    ],
    "count": 1
  },
  "errors": null
}
```

### POST /drivers/:driverId/approve
**Approve driver registration (Manager only)**
```
POST /api/drivers/507f1f77bcf86cd799439012/approve
Authorization: Bearer <accessToken>
Content-Type: application/json

{
  "approvalReason": "License verified, background check passed"
}

Response:
{
  "success": true,
  "status": "success",
  "message": "Driver approved successfully",
  "data": {
    "driver": {
      "_id": "507f1f77bcf86cd799439012",
      "status": "active",
      "approvedBy": "507f1f77bcf86cd799439050",
      "approvedAt": "2024-09-04T11:00:00Z"
    }
  },
  "errors": null
}
```

### POST /drivers/:driverId/reject
**Reject driver registration (Manager only)**
```
POST /api/drivers/507f1f77bcf86cd799439012/reject
Authorization: Bearer <accessToken>
Content-Type: application/json

{
  "rejectionReason": "License has expired"
}

Response:
{
  "success": true,
  "message": "Driver registration rejected",
  "data": {
    "driver": {
      "status": "rejected",
      "rejectionReason": "License has expired"
    }
  },
  "errors": null
}
```

### POST /drivers/:driverId/assign-vehicle
**Assign vehicle to approved driver (Manager only)**
```
POST /api/drivers/507f1f77bcf86cd799439012/assign-vehicle
Authorization: Bearer <accessToken>
Content-Type: application/json

{
  "vehicleId": "507f1f77bcf86cd799439200"
}

Response:
{
  "success": true,
  "message": "Vehicle assigned to driver",
  "data": {
    "driver": {
      "_id": "507f1f77bcf86cd799439012",
      "assignedVehicleId": "507f1f77bcf86cd799439200"
    }
  },
  "errors": null
}
```

---

## 🚗 Vehicle Routes

### GET /vehicles
**List vehicles (branch-specific)**
```
GET /api/vehicles?branchId=507f1f77bcf86cd799439100&status=active
Authorization: Bearer <accessToken>

Response:
{
  "success": true,
  "data": {
    "vehicles": [
      {
        "_id": "507f1f77bcf86cd799439200",
        "registrationNumber": "KCB123D",
        "make": "Toyota",
        "model": "Hiace",
        "status": "active",
        "currentDriverId": "507f1f77bcf86cd799439012",
        "capacity": 2000,
        "totalTrips": 120
      }
    ],
    "count": 1,
    "pagination": { "page": 1, "limit": 10, "total": 1 }
  },
  "errors": null
}
```

### POST /vehicles
**Create vehicle (Manager/Admin)**
```
POST /api/vehicles
Authorization: Bearer <accessToken>
Content-Type: application/json

{
  "registrationNumber": "KCB123D",
  "vehicleType": "van",
  "make": "Toyota",
  "model": "Hiace",
  "year": 2022,
  "capacity": 2000,
  "branchId": "507f1f77bcf86cd799439100",
  "fuelType": "diesel"
}

Response:
{
  "success": true,
  "message": "Vehicle created",
  "data": {
    "vehicle": {
      "_id": "507f1f77bcf86cd799439200",
      "registrationNumber": "KCB123D",
      "status": "active"
    }
  },
  "errors": null
}
```

---

## 🚚 Trip Routes

### POST /trips
**Create new trip (Manager)**
```
POST /api/trips
Authorization: Bearer <accessToken>
Content-Type: application/json

{
  "driverId": "507f1f77bcf86cd799439012",
  "vehicleId": "507f1f77bcf86cd799439200",
  "branchId": "507f1f77bcf86cd799439100",
  "pickupLocation": {
    "address": "Nairobi CBD",
    "latitude": -1.2865,
    "longitude": 36.8172,
    "contactName": "John",
    "contactPhone": "+254712345678"
  },
  "dropoffLocation": {
    "address": "Westlands",
    "latitude": -1.2441,
    "longitude": 36.7501,
    "contactName": "Jane",
    "contactPhone": "+254787654321"
  },
  "estimatedEndTime": "2024-09-04T14:00:00Z",
  "fare": 2500
}

Response:
{
  "success": true,
  "message": "Trip created",
  "data": {
    "trip": {
      "_id": "507f1f77bcf86cd799439300",
      "tripNumber": "TRP-2024-0001",
      "status": "scheduled"
    }
  },
  "errors": null
}
```

### GET /trips/:tripId
**Get trip details**
```
GET /api/trips/507f1f77bcf86cd799439300
Authorization: Bearer <accessToken>

Response:
{
  "success": true,
  "data": {
    "trip": {
      "_id": "507f1f77bcf86cd799439300",
      "tripNumber": "TRP-2024-0001",
      "status": "in_transit",
      "driverId": "507f1f77bcf86cd799439012",
      "vehicleId": "507f1f77bcf86cd799439200",
      "deliveryItems": ["507f1f77bcf86cd799439401", "507f1f77bcf86cd799439402"],
      "tripStartTime": "2024-09-04T12:30:00Z",
      "estimatedEndTime": "2024-09-04T14:00:00Z",
      "distance": 12.5,
      "fare": 2500
    }
  },
  "errors": null
}
```

### PUT /trips/:tripId/status
**Update trip status**
```
PUT /api/trips/507f1f77bcf86cd799439300/status
Authorization: Bearer <accessToken>
Content-Type: application/json

{
  "status": "completed",
  "tripEndTime": "2024-09-04T14:15:00Z",
  "fuelUsed": 5.5
}

Response:
{
  "success": true,
  "message": "Trip status updated",
  "data": {
    "trip": {
      "status": "completed",
      "tripEndTime": "2024-09-04T14:15:00Z"
    }
  },
  "errors": null
}
```

---

## ⭐ Rating Routes

### POST /ratings
**Rate driver (Manager or Customer via Manager)**
```
POST /api/ratings
Authorization: Bearer <accessToken>
Content-Type: application/json

{
  "driverId": "507f1f77bcf86cd799439012",
  "tripId": "507f1f77bcf86cd799439300",
  "rating": 5,
  "ratedBy": "manager",
  "comment": "Excellent delivery, professional",
  "deliveryQuality": "excellent",
  "timeliness": "on_time",
  "professionalism": "excellent"
}

Response:
{
  "success": true,
  "message": "Driver rated successfully",
  "data": {
    "rating": {
      "_id": "507f1f77bcf86cd799439500",
      "rating": 5,
      "ratingImpact": {
        "bonusPercentage": 10,
        "adjustedEarnings": 2750
      }
    }
  },
  "errors": null
}
```

### GET /drivers/:driverId/ratings
**Get driver ratings history**
```
GET /api/drivers/507f1f77bcf86cd799439012/ratings
Authorization: Bearer <accessToken>

Response:
{
  "success": true,
  "data": {
    "ratings": [
      {
        "_id": "507f1f77bcf86cd799439500",
        "rating": 5,
        "comment": "Excellent",
        "ratedBy": "manager",
        "createdAt": "2024-09-04T14:30:00Z"
      }
    ],
    "avgRating": 4.8,
    "totalRatings": 45,
    "ratingDistribution": {
      "5": 40,
      "4": 4,
      "3": 1
    }
  },
  "errors": null
}
```

---

## 📸 Photo Routes

### POST /photos/upload
**Upload proof of delivery photo**
```
POST /api/photos/upload
Authorization: Bearer <accessToken>
Content-Type: multipart/form-data

Form Data:
- file: <image file>
- deliveryId: 507f1f77bcf86cd799439401
- tripId: 507f1f77bcf86cd799439300
- photoType: proof_of_delivery

Response:
{
  "success": true,
  "message": "Photo uploaded",
  "data": {
    "photo": {
      "_id": "507f1f77bcf86cd799439600",
      "cloudflareUrl": "https://cargofleet.r2.cloudflareclient.com/...",
      "uploadedAt": "2024-09-04T14:30:00Z",
      "scheduledDeleteAt": "2024-10-04T14:30:00Z"
    }
  },
  "errors": null
}
```

### POST /photos/:photoId/approve-deletion
**Approve photo deletion (Super Admin)**
```
POST /api/photos/507f1f77bcf86cd799439600/approve-deletion
Authorization: Bearer <accessToken>
Content-Type: application/json

{
  "archiveStatus": "deleted",
  "archiveReason": "Delivered successfully, no disputes"
}

Response:
{
  "success": true,
  "message": "Photo deletion approved",
  "data": {
    "photo": {
      "archiveStatus": "deleted",
      "deletedAt": "2024-09-04T15:00:00Z"
    }
  },
  "errors": null
}
```

### POST /photos/:photoId/archive
**Archive photo permanently (Super Admin)**
```
POST /api/photos/507f1f77bcf86cd799439600/archive
Authorization: Bearer <accessToken>

Response:
{
  "success": true,
  "message": "Photo archived",
  "data": {
    "photo": {
      "archiveStatus": "archived"
    }
  },
  "errors": null
}
```

---

## 🏢 Branch Routes

### GET /branches
**List all branches**
```
GET /api/branches
Authorization: Bearer <accessToken>

Response:
{
  "success": true,
  "data": {
    "branches": [
      {
        "_id": "507f1f77bcf86cd799439100",
        "name": "Nairobi",
        "city": "Nairobi",
        "latitude": -1.2865,
        "longitude": 36.8172,
        "vehicleCount": 25,
        "driverCount": 30
      }
    ],
    "count": 5
  },
  "errors": null
}
```

### POST /branches (Super Admin)
```
POST /api/branches
Authorization: Bearer <accessToken>
Content-Type: application/json

{
  "name": "Eldoret",
  "city": "Eldoret",
  "latitude": 0.5143,
  "longitude": 35.2707,
  "address": "Eldoret, Kenya",
  "phone": "+254712345683"
}
```

### PUT /branches/:branchId (Super Admin)
**Update branch details**
```
PUT /api/branches/507f1f77bcf86cd799439100
```

### DELETE /branches/:branchId (Super Admin)
**Delete branch**
```
DELETE /api/branches/507f1f77bcf86cd799439100
Authorization: Bearer <accessToken>
```

---

## 👤 Manager Routes

### GET /managers/pending-verification
**Get pending manager verifications (Super Admin)**
```
GET /api/managers/pending-verification
Authorization: Bearer <accessToken>

Response:
{
  "success": true,
  "data": {
    "managers": [
      {
        "_id": "507f1f77bcf86cd799439013",
        "user": {
          "firstName": "Jane",
          "lastName": "Smith",
          "email": "jane@example.com"
        },
        "status": "pending_verification",
        "createdAt": "2024-09-04T10:00:00Z"
      }
    ],
    "count": 1
  },
  "errors": null
}
```

### POST /managers/:managerId/verify
**Verify manager and assign branch (Super Admin)**
```
POST /api/managers/507f1f77bcf86cd799439013/verify
Authorization: Bearer <accessToken>
Content-Type: application/json

{
  "branchId": "507f1f77bcf86cd799439100",
  "verificationReason": "Credentials verified"
}

Response:
{
  "success": true,
  "message": "Manager verified and assigned to branch",
  "data": {
    "manager": {
      "status": "active",
      "assignedBranchId": "507f1f77bcf86cd799439100",
      "verifiedAt": "2024-09-04T11:00:00Z"
    }
  },
  "errors": null
}
```

---

## 📊 Analytics Routes

### GET /analytics/branch/:branchId
**Get branch analytics (Manager or Admin)**
```
GET /api/analytics/branch/507f1f77bcf86cd799439100?period=month
Authorization: Bearer <accessToken>

Response:
{
  "success": true,
  "data": {
    "analytics": {
      "period": "month",
      "totalTrips": 450,
      "completedTrips": 445,
      "completionRate": 98.9,
      "totalEarnings": 1125000,
      "totalKilometers": 12500,
      "averageRating": 4.7,
      "topDriver": { "name": "John Doe", "trips": 52, "rating": 4.9 }
    }
  },
  "errors": null
}
```

---

## ✅ Next Steps

→ **[5_WEBSOCKET_EVENTS.md](./5_WEBSOCKET_EVENTS.md)** - Real-time WebSocket events

---

*Last Updated: September 2026*  
*Contact: info@fastweb.co.ke | Fastweb Technologies | fastweb.co.ke*
