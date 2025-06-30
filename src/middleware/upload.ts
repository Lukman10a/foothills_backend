import multer from 'multer';
import path from 'path';
import fs from 'fs';
import sharp from 'sharp';
import { Request } from 'express';

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(process.cwd(), 'uploads');
const imagesDir = path.join(uploadsDir, 'images');
const propertiesDir = path.join(imagesDir, 'properties');

[uploadsDir, imagesDir, propertiesDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Configure multer storage
const storage = multer.diskStorage({
  destination: (req: Request, _file: Express.Multer.File, cb) => {
    const propertyId = req.params['id'];
    if (!propertyId) {
      return cb(new Error('Property ID is required'), '');
    }
    const propertyDir = path.join(propertiesDir, propertyId);
    
    // Create property-specific directory
    if (!fs.existsSync(propertyDir)) {
      fs.mkdirSync(propertyDir, { recursive: true });
    }
    
    cb(null, propertyDir);
  },
  filename: (_req: Request, file: Express.Multer.File, cb) => {
    // Generate unique filename with timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `image-${uniqueSuffix}${ext}`);
  }
});

// File filter for images only
const fileFilter = (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, and WebP images are allowed.'));
  }
};

// Configure multer
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 10 // Maximum 10 files per upload
  }
});

// Image processing utility
export const processImage = async (filePath: string, sizes: { width: number; height: number; suffix: string }[]) => {
  const processedImages: string[] = [];
  const dir = path.dirname(filePath);
  const name = path.parse(filePath).name;
  const ext = path.parse(filePath).ext;

  for (const size of sizes) {
    const outputPath = path.join(dir, `${name}_${size.suffix}${ext}`);
    
    await sharp(filePath)
      .resize(size.width, size.height, {
        fit: 'cover',
        position: 'center'
      })
      .jpeg({ quality: 85 })
      .toFile(outputPath);
    
    processedImages.push(outputPath);
  }

  return processedImages;
};

// Delete image file utility
export const deleteImageFile = (filePath: string): void => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (error) {
    console.error('Error deleting image file:', error);
  }
};

// Delete all images in a property directory
export const deletePropertyImages = (propertyId: string | undefined): void => {
  if (!propertyId) return;
  const propertyDir = path.join(propertiesDir, propertyId);
  
  try {
    if (fs.existsSync(propertyDir)) {
      fs.rmSync(propertyDir, { recursive: true, force: true });
    }
  } catch (error) {
    console.error('Error deleting property images:', error);
  }
};

// Generate image URL
export const generateImageUrl = (propertyId: string, filename: string): string => {
  return `/api/images/properties/${propertyId}/${filename}`;
};

// Extract filename from URL
export const extractFilenameFromUrl = (url: string | undefined): string | null => {
  if (!url) return null;
  const match = url.match(/\/([^\/]+)$/);
  return match ? (match[1] ?? null) : null;
};

export const uploadSingle = upload.single('image');
export const uploadMultiple = upload.array('images', 10);
export default upload; 