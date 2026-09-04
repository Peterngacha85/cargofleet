import { Schema, model, Document, Types } from 'mongoose';
import { UserRole } from '../types';

export interface IUser extends Document {
  _id: Types.ObjectId;
  email: string;
  password: string;
  role: UserRole;
  firstName: string;
  lastName: string;
  phone?: string;
  profilePhoto?: string;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
    },
    password: { type: String, required: true, minlength: 6 },
    role: { type: String, enum: ['driver', 'manager', 'admin'], required: true },
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    // Not required: Google OAuth sign-up only gives us name + email, never a phone number.
    // Format is still enforced whenever a value is actually provided.
    phone: {
      type: String,
      default: '',
      validate: {
        validator: (v: string) => !v || /^\+?[0-9]{10,}$/.test(v),
        message: 'Invalid phone number format',
      },
    },
    profilePhoto: { type: String },
  },
  { timestamps: true }
);

userSchema.index({ phone: 1 });
userSchema.index({ role: 1 });
userSchema.index({ createdAt: -1 });

export default model<IUser>('User', userSchema);
