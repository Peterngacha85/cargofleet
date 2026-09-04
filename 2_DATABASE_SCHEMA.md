# 2️⃣ DATABASE SCHEMA & DATA MODELS

**Complete MongoDB collection structure for CargoFleet**

---

## 📊 Collections Overview

1. **users** - All users (drivers, managers, admins)
2. **drivers** - Driver profiles and details
3. **managers** - Manager profiles and details
4. **branches** - Branch/location information
5. **vehicles** - Trucks and vehicle details
6. **trips** - Delivery trips
7. **deliveries** - Individual delivery items in a trip
8. **locations_history** - Real-time location tracking
9. **driver_ratings** - Performance ratings and reviews
10. **photos** - Proof of delivery photos metadata
11. **approvals** - Driver/manager approval records

---

## 🔑 Collection Schemas (TypeScript Interfaces + MongoDB)

### 1. Users Collection

```typescript
// src/models/User.ts
interface IUser {
  _id: ObjectId;
  email: string;                    // Unique
  password: string;                 // Hashed (bcryptjs)
  role: 'driver' | 'manager' | 'admin';
  firstName: string;
  lastName: string;
  phone: string;
  profilePhoto?: string;            // Cloudflare R2 URL
  createdAt: Date;
  updatedAt: Date;
}

// MongoDB Schema with validation
db.createCollection('users', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['email', 'password', 'role', 'firstName', 'lastName', 'phone'],
      properties: {
        _id: { bsonType: 'objectId' },
        email: { 
          bsonType: 'string',
          pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$'
        },
        password: { bsonType: 'string', minLength: 60 }, // Hashed
        role: { enum: ['driver', 'manager', 'admin'] },
        firstName: { bsonType: 'string' },
        lastName: { bsonType: 'string' },
        phone: { bsonType: 'string', pattern: '^\\+?[0-9]{10,}$' },
        profilePhoto: { bsonType: 'string' },
        createdAt: { bsonType: 'date' },
        updatedAt: { bsonType: 'date' }
      }
    }
  }
});

// Indexes
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ phone: 1 });
db.users.createIndex({ role: 1 });
db.users.createIndex({ createdAt: -1 });
```

### 2. Drivers Collection

```typescript
// src/models/Driver.ts
interface IDriver {
  _id: ObjectId;
  userId: ObjectId;                 // Reference to users collection
  drivingLicenseNumber: string;     // Unique
  licenseExpiry: Date;
  licensePhotoUrl?: string;         // Cloudflare R2
  emergencyContactName: string;
  emergencyContactPhone: string;
  status: 'pending_approval' | 'active' | 'rejected' | 'suspended';
  rejectionReason?: string;
  approvedBy?: ObjectId;            // Manager who approved
  approvedAt?: Date;
  branchId?: ObjectId;              // Assigned branch (null until approved)
  assignedVehicleId?: ObjectId;     // Assigned vehicle (null until manager assigns)
  totalTrips: number;               // Counter
  completedTrips: number;
  avgRating: number;                // 0-5 stars
  totalEarnings: number;
  advanceAmount: number;            // Driver advances/loans
  createdAt: Date;
  updatedAt: Date;
}

// MongoDB Schema
db.createCollection('drivers', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['userId', 'drivingLicenseNumber', 'licenseExpiry', 
                 'emergencyContactName', 'emergencyContactPhone', 'status'],
      properties: {
        _id: { bsonType: 'objectId' },
        userId: { bsonType: 'objectId' },
        drivingLicenseNumber: { bsonType: 'string' },
        licenseExpiry: { bsonType: 'date' },
        licensePhotoUrl: { bsonType: 'string' },
        emergencyContactName: { bsonType: 'string' },
        emergencyContactPhone: { bsonType: 'string' },
        status: { enum: ['pending_approval', 'active', 'rejected', 'suspended'] },
        rejectionReason: { bsonType: 'string' },
        approvedBy: { bsonType: 'objectId' },
        approvedAt: { bsonType: 'date' },
        branchId: { bsonType: 'objectId' },
        assignedVehicleId: { bsonType: 'objectId' },
        totalTrips: { bsonType: 'int', minimum: 0 },
        completedTrips: { bsonType: 'int', minimum: 0 },
        avgRating: { bsonType: 'double', minimum: 0, maximum: 5 },
        totalEarnings: { bsonType: 'double', minimum: 0 },
        advanceAmount: { bsonType: 'double', minimum: 0 },
        createdAt: { bsonType: 'date' },
        updatedAt: { bsonType: 'date' }
      }
    }
  }
});

// Indexes
db.drivers.createIndex({ userId: 1 }, { unique: true });
db.drivers.createIndex({ drivingLicenseNumber: 1 }, { unique: true });
db.drivers.createIndex({ status: 1 });
db.drivers.createIndex({ branchId: 1 });
db.drivers.createIndex({ assignedVehicleId: 1 });
db.drivers.createIndex({ avgRating: -1 });
db.drivers.createIndex({ createdAt: -1 });
```

### 3. Managers Collection

```typescript
// src/models/Manager.ts
interface IManager {
  _id: ObjectId;
  userId: ObjectId;                 // Reference to users collection
  status: 'pending_verification' | 'active' | 'rejected' | 'inactive';
  rejectionReason?: string;
  verifiedBy?: ObjectId;            // Super Admin who verified
  verifiedAt?: Date;
  assignedBranchId: ObjectId;       // Manager cannot choose - Super Admin assigns
  totalDriversManaged: number;
  totalTripsOverseen: number;
  createdAt: Date;
  updatedAt: Date;
}

// MongoDB Schema
db.createCollection('managers', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['userId', 'status', 'assignedBranchId'],
      properties: {
        _id: { bsonType: 'objectId' },
        userId: { bsonType: 'objectId' },
        status: { enum: ['pending_verification', 'active', 'rejected', 'inactive'] },
        rejectionReason: { bsonType: 'string' },
        verifiedBy: { bsonType: 'objectId' },
        verifiedAt: { bsonType: 'date' },
        assignedBranchId: { bsonType: 'objectId' },
        totalDriversManaged: { bsonType: 'int', minimum: 0 },
        totalTripsOverseen: { bsonType: 'int', minimum: 0 },
        createdAt: { bsonType: 'date' },
        updatedAt: { bsonType: 'date' }
      }
    }
  }
});

// Indexes
db.managers.createIndex({ userId: 1 }, { unique: true });
db.managers.createIndex({ status: 1 });
db.managers.createIndex({ assignedBranchId: 1 });
db.managers.createIndex({ createdAt: -1 });
```

### 4. Branches Collection

```typescript
// src/models/Branch.ts
interface IBranch {
  _id: ObjectId;
  name: string;                     // Nairobi, Mombasa, etc.
  city: string;
  latitude: number;
  longitude: number;
  address: string;
  phone: string;
  managerIds: ObjectId[];           // Multiple managers per branch (optional)
  vehicleCount: number;
  driverCount: number;
  createdAt: Date;
  updatedAt: Date;
}

// Seed data
db.branches.insertMany([
  {
    name: "Nairobi",
    city: "Nairobi",
    latitude: -1.2865,
    longitude: 36.8172,
    address: "Nairobi, Kenya",
    phone: "+254712345678",
    managerIds: [],
    vehicleCount: 0,
    driverCount: 0,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: "Mombasa",
    city: "Mombasa",
    latitude: -4.0435,
    longitude: 39.6682,
    address: "Mombasa, Kenya",
    phone: "+254712345679",
    managerIds: [],
    vehicleCount: 0,
    driverCount: 0,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: "Kisumu",
    city: "Kisumu",
    latitude: -0.1022,
    longitude: 34.7617,
    address: "Kisumu, Kenya",
    phone: "+254712345680",
    managerIds: [],
    vehicleCount: 0,
    driverCount: 0,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: "Nyeri",
    city: "Nyeri",
    latitude: -0.4142,
    longitude: 36.9506,
    address: "Nyeri, Kenya",
    phone: "+254712345681",
    managerIds: [],
    vehicleCount: 0,
    driverCount: 0,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: "Nakuru",
    city: "Nakuru",
    latitude: -0.3031,
    longitude: 36.0800,
    address: "Nakuru, Kenya",
    phone: "+254712345682",
    managerIds: [],
    vehicleCount: 0,
    driverCount: 0,
    createdAt: new Date(),
    updatedAt: new Date()
  }
]);

// Indexes
db.branches.createIndex({ name: 1 }, { unique: true });
db.branches.createIndex({ city: 1 });
db.branches.createIndex({ managerIds: 1 });
```

### 5. Vehicles Collection

```typescript
// src/models/Vehicle.ts
interface IVehicle {
  _id: ObjectId;
  registrationNumber: string;       // Unique
  vehicleType: 'motorcycle' | 'van' | 'truck' | 'lorry';
  make: string;                     // e.g., "Toyota"
  model: string;                    // e.g., "Hiace"
  year: number;
  capacity: number;                 // Kg or liters
  currentDriverId?: ObjectId;       // Currently assigned driver
  branchId: ObjectId;               // Home branch
  status: 'active' | 'maintenance' | 'retired';
  maintenanceDue?: Date;
  fuelType: 'petrol' | 'diesel' | 'electric';
  lastServiceDate?: Date;
  totalTrips: number;
  totalKilometers: number;
  mileagePerLiter: number;          // Fuel efficiency
  documents: {
    insuranceExpiry: Date;
    registrationExpiry: Date;
    inspectionExpiry: Date;
  };
  createdAt: Date;
  updatedAt: Date;
}

// Indexes
db.vehicles.createIndex({ registrationNumber: 1 }, { unique: true });
db.vehicles.createIndex({ currentDriverId: 1 });
db.vehicles.createIndex({ branchId: 1 });
db.vehicles.createIndex({ status: 1 });
```

### 6. Trips Collection

```typescript
// src/models/Trip.ts
interface ITrip {
  _id: ObjectId;
  tripNumber: string;               // Unique, auto-generated
  driverId: ObjectId;
  vehicleId: ObjectId;
  branchId: ObjectId;               // Branch managing this trip
  pickupLocation: {
    address: string;
    latitude: number;
    longitude: number;
    contactName: string;
    contactPhone: string;
  };
  dropoffLocation: {
    address: string;
    latitude: number;
    longitude: number;
    contactName: string;
    contactPhone: string;
  };
  status: 'scheduled' | 'in_transit' | 'completed' | 'cancelled';
  deliveryItems: ObjectId[];        // References to deliveries collection
  tripStartTime?: Date;
  tripEndTime?: Date;
  estimatedEndTime: Date;
  distance: number;                 // Kilometers
  fuelUsed?: number;                // Liters
  expenses: number;                 // Total expenses (tolls, etc.)
  fare: number;                     // Base fare for trip
  totalEarnings: number;            // Fare - deductions
  driverComment?: string;
  managerComment?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Indexes
db.trips.createIndex({ tripNumber: 1 }, { unique: true });
db.trips.createIndex({ driverId: 1 });
db.trips.createIndex({ vehicleId: 1 });
db.trips.createIndex({ status: 1 });
db.trips.createIndex({ branchId: 1 });
db.trips.createIndex({ createdAt: -1 });
```

### 7. Deliveries Collection

```typescript
// src/models/Delivery.ts
interface IDelivery {
  _id: ObjectId;
  tripId: ObjectId;
  deliveryNumber: string;           // Unique
  description: string;              // What's being delivered
  quantity: number;
  weight: number;                   // KG
  receiverName: string;
  receiverPhone: string;
  deliveryAddress: string;
  latitude: number;
  longitude: number;
  status: 'pending' | 'in_transit' | 'delivered' | 'failed' | 'returned';
  condition: {
    initial: 'good' | 'damaged' | 'not_inspected';
    final: 'good' | 'damaged' | 'not_inspected';
  };
  proofOfDeliveryPhoto?: ObjectId;  // Reference to photos collection
  customerSignatureRequired: boolean;
  signatureProvided?: boolean;
  deliveredAt?: Date;
  failureReason?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Indexes
db.deliveries.createIndex({ deliveryNumber: 1 }, { unique: true });
db.deliveries.createIndex({ tripId: 1 });
db.deliveries.createIndex({ status: 1 });
```

### 8. Locations History Collection

```typescript
// src/models/LocationHistory.ts
interface ILocationHistory {
  _id: ObjectId;
  driverId: ObjectId;
  tripId: ObjectId;
  latitude: number;
  longitude: number;
  accuracy: number;                 // GPS accuracy in meters
  speed: number;                    // KM/h
  heading: number;                  // Direction in degrees
  timestamp: Date;                  // Real-time timestamp
  sourceType: 'gps' | 'network';    // Location source
}

// Indexes (for efficient real-time queries)
db.locations_history.createIndex({ driverId: 1, timestamp: -1 });
db.locations_history.createIndex({ tripId: 1, timestamp: -1 });
db.locations_history.createIndex({ timestamp: 1 }, { expireAfterSeconds: 2592000 }); // Auto-delete after 30 days

// Note: TTL index will automatically delete old location data
```

### 9. Driver Ratings Collection

```typescript
// src/models/DriverRating.ts
interface IDriverRating {
  _id: ObjectId;
  driverId: ObjectId;
  tripId: ObjectId;
  rating: number;                   // 1-5 stars
  ratedBy: 'manager' | 'customer';
  ratedByUserId: ObjectId;          // Manager or customer ID
  comment: string;
  positiveAspects?: string[];       // What went well
  negativeAspects?: string[];       // What needs improvement
  deliveryQuality: 'excellent' | 'good' | 'average' | 'poor';
  timeliness: 'on_time' | 'slightly_late' | 'very_late';
  professionalism: 'excellent' | 'good' | 'average' | 'poor';
  
  // Payment impact
  ratingImpact: {
    deductionPercentage: number;    // 0 for 5-star, 5 for 1-star
    bonusPercentage: number;        // 0 for low, varies for high
    tripEarnings: number;
    adjustedEarnings: number;
  };
  
  // Customer info (if rated by customer)
  customerName?: string;
  customerPhone?: string;
  customerSignature?: string;       // Base64 or R2 URL
  
  createdAt: Date;
  updatedAt: Date;
}

// Indexes
db.driver_ratings.createIndex({ driverId: 1 });
db.driver_ratings.createIndex({ tripId: 1 }, { unique: true });
db.driver_ratings.createIndex({ ratedByUserId: 1 });
db.driver_ratings.createIndex({ createdAt: -1 });
```

### 10. Photos Collection

```typescript
// src/models/Photo.ts
interface IPhoto {
  _id: ObjectId;
  deliveryId: ObjectId;
  tripId: ObjectId;
  driverId: ObjectId;
  photoType: 'proof_of_delivery' | 'damage_report' | 'vehicle_condition';
  cloudflareUrl: string;            // R2 URL
  uploadedAt: Date;
  uploadedBy: ObjectId;             // Driver who uploaded
  approvedBy?: ObjectId;            // Manager who approved
  approvedAt?: Date;
  archiveStatus: 'active' | 'archived' | 'deleted';
  archiveReason?: string;
  scheduledDeleteAt?: Date;         // 30 days after approval
  metadata: {
    filename: string;
    size: number;                   // Bytes
    mimeType: string;
    exifData?: any;
  };
  createdAt: Date;
  updatedAt: Date;
}

// Indexes
db.photos.createIndex({ deliveryId: 1 });
db.photos.createIndex({ tripId: 1 });
db.photos.createIndex({ driverId: 1 });
db.photos.createIndex({ uploadedAt: -1 });
db.photos.createIndex({ scheduledDeleteAt: 1 }, { sparse: true });
```

### 11. Approvals Collection

```typescript
// src/models/Approval.ts
interface IApproval {
  _id: ObjectId;
  
  // Common fields
  approvableId: ObjectId;           // driver_id or manager_id
  approvableType: 'driver' | 'manager';
  status: 'pending' | 'approved' | 'rejected';
  reviewedAt?: Date;
  
  // Reviewer info
  reviewedBy: ObjectId;             // manager_id (for drivers) or admin_id (for managers)
  
  // Approval details
  approvalReason?: string;          // Why approved
  rejectionReason?: string;         // Why rejected
  comments?: string;
  
  // Additional data
  additionalInfo?: any;
  
  createdAt: Date;
  updatedAt: Date;
}

// Indexes
db.approvals.createIndex({ approvableId: 1 });
db.approvals.createIndex({ approvableType: 1, status: 1 });
db.approvals.createIndex({ reviewedBy: 1 });
db.approvals.createIndex({ createdAt: -1 });
```

---

## 🔗 Relationships & Entity Relationship Diagram

```
Users (Base)
├── Drivers (has one)
│   ├── Vehicles (has many via assignments)
│   ├── Trips (has many)
│   ├── LocationHistory (has many - real-time)
│   ├── DriverRatings (has many)
│   └── Approvals (has one - approval record)
│
├── Managers (has one)
│   ├── Branches (assigned to one)
│   ├── Driver Approvals (reviews many)
│   └── Approvals (has one - verification record)
│
└── Admins (Super Admin)
    ├── Branches (manages all)
    ├── Managers (verifies)
    ├── Photos (approves deletion)
    └── System-wide Data

Branches (Location)
├── Managers (has many)
├── Vehicles (has many)
├── Drivers (has many)
└── Trips (has many)

Trips (Journey)
├── Driver (assigned to one)
├── Vehicle (uses one)
├── Deliveries (contains many)
├── LocationHistory (tracks)
├── DriverRatings (gets one after completion)
└── Photos (has many)

Deliveries (Item)
├── Trip (belongs to one)
├── Photos (may have)
└── Ratings (included in trip rating)
```

---

## 🔐 Data Validation Rules

### Driver Registration
- ✅ Email must be unique
- ✅ Driving License Number must be unique
- ✅ Phone number format: +254XXXXXXXXX or 0XXXXXXXXX
- ✅ License expiry must be future date
- ✅ Status starts as "pending_approval"

### Manager Registration
- ✅ Email must be unique
- ✅ Status starts as "pending_verification"
- ✅ Cannot assign own branch (Super Admin does this)
- ✅ Phone format validation

### Trips
- ✅ Driver must be "active" status
- ✅ Vehicle must be "active" status
- ✅ Pickup and dropoff must have valid coordinates
- ✅ Estimated end time must be future

### Ratings
- ✅ Stars must be 1-5
- ✅ Cannot rate same trip twice
- ✅ Can only rate after trip "completed"

---

## 📈 Data Migration & Seed Script

```typescript
// backend/src/scripts/seed.ts
import mongoose from 'mongoose';
import Branch from '../models/Branch';

async function seedDatabase() {
  try {
    await mongoose.connect(process.env.MONGODB_URI!);
    console.log('✓ Connected to MongoDB');

    // Clear existing branches
    await Branch.deleteMany({});

    // Seed branches
    const branches = [
      {
        name: 'Nairobi',
        city: 'Nairobi',
        latitude: -1.2865,
        longitude: 36.8172,
        address: 'Nairobi, Kenya',
        phone: '+254712345678',
      },
      // ... other branches
    ];

    await Branch.insertMany(branches);
    console.log('✓ Seeded 5 branches');

    await mongoose.connection.close();
    console.log('✓ Database seeding complete');
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
}

seedDatabase();
```

---

## ✅ Next Steps

→ **[3_AUTHENTICATION.md](./3_AUTHENTICATION.md)** - Implement authentication with JWT and Super Admin 2FA

---

*Last Updated: September 2026*  
*Contact: info@fastweb.co.ke | Fastweb Technologies | fastweb.co.ke*
