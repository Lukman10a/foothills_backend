import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IService extends Document {
  name: string;
  description?: string;
  category: Types.ObjectId;
  price: number;
  provider: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const serviceSchema = new Schema<IService>({
  name: {
    type: String,
    required: [true, 'Service name is required'],
    trim: true,
    maxlength: [100, 'Service name cannot exceed 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  category: {
    type: Schema.Types.ObjectId,
    ref: 'Category',
    required: [true, 'Category is required']
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price must be a positive number']
  },
  provider: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Provider is required']
  }
}, {
  timestamps: true
});

serviceSchema.index({ category: 1 });
serviceSchema.index({ provider: 1 });

const Service = mongoose.model<IService>('Service', serviceSchema);

export default Service; 