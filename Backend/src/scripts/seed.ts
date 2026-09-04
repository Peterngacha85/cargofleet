import mongoose from 'mongoose';
import { config } from '../config/environment';
import Branch from '../models/Branch';

const branches = [
  { name: 'Nairobi', city: 'Nairobi', latitude: -1.2865, longitude: 36.8172, address: 'Nairobi, Kenya', phone: '+254712345678' },
  { name: 'Mombasa', city: 'Mombasa', latitude: -4.0435, longitude: 39.6682, address: 'Mombasa, Kenya', phone: '+254712345679' },
  { name: 'Kisumu', city: 'Kisumu', latitude: -0.1022, longitude: 34.7617, address: 'Kisumu, Kenya', phone: '+254712345680' },
  { name: 'Nyeri', city: 'Nyeri', latitude: -0.4142, longitude: 36.9506, address: 'Nyeri, Kenya', phone: '+254712345681' },
  { name: 'Nakuru', city: 'Nakuru', latitude: -0.3031, longitude: 36.08, address: 'Nakuru, Kenya', phone: '+254712345682' },
];

async function seedDatabase() {
  try {
    await mongoose.connect(config.mongodbUri);
    console.log('✓ Connected to MongoDB');

    await Branch.deleteMany({});
    await Branch.insertMany(branches);
    console.log(`✓ Seeded ${branches.length} branches`);

    await mongoose.connection.close();
    console.log('✓ Database seeding complete');
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
}

seedDatabase();
