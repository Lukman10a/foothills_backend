import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IService extends Document {
  name: string;
  description?: string;
  category: Types.ObjectId;
  price: number;
  provider: Types.ObjectId;
  // Enhanced hospitality fields
  propertyType?: 'apartment' | 'house' | 'condo' | 'villa' | 'studio' | 'loft' | 'other';
  bedrooms?: number;
  bathrooms?: number;
  maxGuests?: number;
  amenities?: string[];
  images?: string[];
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
  unavailableDates?: Date[];
  // Inventory management fields
  inventory?: {
    totalUnits: number;
    availableUnits: number;
    minBookingDays: number;
    maxBookingDays: number;
  };
  isActive?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const serviceSchema = new Schema<IService>({
  name: {
    type: String,
    required: [true, 'Property name is required'],
    trim: true,
    maxlength: [100, 'Property name cannot exceed 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  category: {
    type: Schema.Types.ObjectId,
    ref: 'Category',
    required: [true, 'Category is required']
  },
  price: {
    type: Number,
    required: [true, 'Price per night is required'],
    min: [0, 'Price must be a positive number']
  },
  provider: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Provider is required']
  },
  // Enhanced hospitality fields
  propertyType: {
    type: String,
    enum: ['apartment', 'house', 'condo', 'villa', 'studio', 'loft', 'other'],
    default: 'apartment'
  },
  bedrooms: {
    type: Number,
    min: [0, 'Bedrooms cannot be negative'],
    max: [20, 'Maximum 20 bedrooms allowed']
  },
  bathrooms: {
    type: Number,
    min: [0, 'Bathrooms cannot be negative'],
    max: [20, 'Maximum 20 bathrooms allowed']
  },
  maxGuests: {
    type: Number,
    min: [1, 'Must accommodate at least 1 guest'],
    max: [50, 'Maximum 50 guests allowed']
  },
  amenities: [{
    type: String,
    trim: true
  }],
  images: [{
    type: String,
    trim: true
  }],
  address: {
    street: {
      type: String,
      trim: true,
      maxlength: [200, 'Street address cannot exceed 200 characters']
    },
    city: {
      type: String,
      trim: true,
      maxlength: [100, 'City cannot exceed 100 characters']
    },
    state: {
      type: String,
      trim: true,
      maxlength: [100, 'State cannot exceed 100 characters']
    },
    zipCode: {
      type: String,
      trim: true,
      maxlength: [20, 'Zip code cannot exceed 20 characters']
    },
    country: {
      type: String,
      trim: true,
      maxlength: [100, 'Country cannot exceed 100 characters']
    }
  },
  unavailableDates: [{
    type: Date
  }],
  // Inventory management fields
  inventory: {
    totalUnits: {
      type: Number,
      min: [1, 'Total units must be at least 1'],
      max: [100, 'Maximum 100 units allowed'],
      default: 1
    },
    availableUnits: {
      type: Number,
      min: [0, 'Available units cannot be negative'],
      max: [100, 'Maximum 100 units allowed'],
      default: 1
    },
    minBookingDays: {
      type: Number,
      min: [1, 'Minimum booking days must be at least 1'],
      max: [365, 'Maximum 365 days allowed'],
      default: 1
    },
    maxBookingDays: {
      type: Number,
      min: [1, 'Maximum booking days must be at least 1'],
      max: [365, 'Maximum 365 days allowed'],
      default: 30
    }
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes for better query performance
serviceSchema.index({ category: 1 });
serviceSchema.index({ provider: 1 });
serviceSchema.index({ propertyType: 1 });
serviceSchema.index({ 'address.city': 1 });
serviceSchema.index({ price: 1 });
serviceSchema.index({ isActive: 1 });
serviceSchema.index({ 'inventory.availableUnits': 1 });

const Service = mongoose.model<IService>('Service', serviceSchema);

export default Service; 