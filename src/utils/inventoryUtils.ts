import { Types } from 'mongoose';
import Service from '../models/Service';
import Booking from '../models/Booking';
import { IService } from '../types';

/**
 * Check if a property has sufficient inventory for a date range
 */
export const checkInventoryAvailability = async (
  serviceId: string | Types.ObjectId,
  startDate: Date,
  endDate: Date,
  requestedUnits: number = 1
): Promise<{
  available: boolean;
  availableUnits: number;
  totalUnits: number;
  conflictingBookings?: any[];
}> => {
  try {
    // Get the service/property
    const service = await Service.findById(serviceId);
    if (!service) {
      throw new Error('Property not found');
    }

    if (!service.inventory) {
      throw new Error('Property inventory not configured');
    }

    // Check if requested units exceed total inventory
    if (requestedUnits > service.inventory.totalUnits) {
      return {
        available: false,
        availableUnits: service.inventory.availableUnits,
        totalUnits: service.inventory.totalUnits
      };
    }

    // Get all bookings for this property in the date range
    const conflictingBookings = await Booking.find({
      service: serviceId,
      date: {
        $gte: startDate,
        $lte: endDate
      },
      status: { $in: ['pending', 'confirmed'] }
    });

    // Calculate total units booked in this date range
    const totalBookedUnits = conflictingBookings.reduce((sum) => {
      // For now, each booking uses 1 unit
      // This can be enhanced later to support multiple units per booking
      return sum + 1;
    }, 0);

    // Calculate available units for this date range
    const availableUnitsForRange = service.inventory.totalUnits - totalBookedUnits;

    return {
      available: availableUnitsForRange >= requestedUnits,
      availableUnits: Math.max(0, availableUnitsForRange),
      totalUnits: service.inventory.totalUnits,
      conflictingBookings: conflictingBookings || []
    };
  } catch (error) {
    throw new Error(`Inventory availability check failed: ${(error as Error).message}`);
  }
};

/**
 * Update property inventory after booking creation/cancellation
 */
export const updateInventoryAfterBooking = async (
  serviceId: string | Types.ObjectId,
  action: 'reserve' | 'release',
  units: number = 1
): Promise<{
  success: boolean;
  newAvailableUnits: number;
  message: string;
}> => {
  try {
    const service = await Service.findById(serviceId);
    if (!service) {
      throw new Error('Property not found');
    }

    if (!service.inventory) {
      throw new Error('Property inventory not configured');
    }

    let newAvailableUnits = service.inventory.availableUnits;

    if (action === 'reserve') {
      // Reserve units (decrease available units)
      if (service.inventory.availableUnits < units) {
        throw new Error(`Insufficient inventory. Available: ${service.inventory.availableUnits}, Requested: ${units}`);
      }
      newAvailableUnits = service.inventory.availableUnits - units;
    } else if (action === 'release') {
      // Release units (increase available units)
      newAvailableUnits = Math.min(
        service.inventory.totalUnits,
        service.inventory.availableUnits + units
      );
    }

    // Update the service inventory
    await Service.findByIdAndUpdate(serviceId, {
      'inventory.availableUnits': newAvailableUnits
    });

    return {
      success: true,
      newAvailableUnits,
      message: `Inventory ${action === 'reserve' ? 'reserved' : 'released'} successfully`
    };
  } catch (error) {
    throw new Error(`Inventory update failed: ${(error as Error).message}`);
  }
};

/**
 * Validate booking duration against property's min/max booking days
 */
export const validateBookingDuration = (
  service: IService,
  startDate: Date,
  endDate: Date
): {
  valid: boolean;
  message?: string;
  actualDays: number;
  minDays: number;
  maxDays: number;
} => {
  if (!service.inventory) {
    return {
      valid: false,
      message: 'Property inventory not configured',
      actualDays: 0,
      minDays: 0,
      maxDays: 0
    };
  }

  const actualDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  const minDays = service.inventory.minBookingDays;
  const maxDays = service.inventory.maxBookingDays;

  if (actualDays < minDays) {
    return {
      valid: false,
      message: `Minimum booking duration is ${minDays} days`,
      actualDays,
      minDays,
      maxDays
    };
  }

  if (actualDays > maxDays) {
    return {
      valid: false,
      message: `Maximum booking duration is ${maxDays} days`,
      actualDays,
      minDays,
      maxDays
    };
  }

  return {
    valid: true,
    actualDays,
    minDays,
    maxDays
  };
};

/**
 * Get inventory statistics for a property
 */
export const getInventoryStatistics = async (
  serviceId: string | Types.ObjectId
): Promise<{
  totalUnits: number;
  availableUnits: number;
  bookedUnits: number;
  utilizationRate: number;
  upcomingBookings: number;
  revenue: number;
}> => {
  try {
    const service = await Service.findById(serviceId);
    if (!service || !service.inventory) {
      throw new Error('Property or inventory not found');
    }

    // Get upcoming bookings
    const upcomingBookings = await Booking.find({
      service: serviceId,
      date: { $gte: new Date() },
      status: { $in: ['pending', 'confirmed'] }
    });

    // Calculate booked units (for now, each booking = 1 unit)
    const bookedUnits = upcomingBookings.length;

    // Calculate utilization rate
    const utilizationRate = service.inventory.totalUnits > 0 
      ? (bookedUnits / service.inventory.totalUnits) * 100 
      : 0;

    // Calculate revenue from upcoming bookings
    const revenue = upcomingBookings.reduce((sum) => {
      return sum + (service.price || 0);
    }, 0);

    return {
      totalUnits: service.inventory.totalUnits,
      availableUnits: service.inventory.availableUnits,
      bookedUnits,
      utilizationRate: Math.round(utilizationRate * 100) / 100,
      upcomingBookings: upcomingBookings.length,
      revenue
    };
  } catch (error) {
    throw new Error(`Inventory statistics failed: ${(error as Error).message}`);
  }
};

/**
 * Bulk update inventory for multiple properties
 */
export const bulkUpdateInventory = async (
  updates: Array<{
    serviceId: string | Types.ObjectId;
    totalUnits?: number;
    availableUnits?: number;
    minBookingDays?: number;
    maxBookingDays?: number;
  }>
): Promise<{
  success: boolean;
  updated: number;
  errors: string[];
}> => {
  const errors: string[] = [];
  let updated = 0;

  for (const update of updates) {
    try {
      const service = await Service.findById(update.serviceId);
      if (!service) {
        errors.push(`Property ${update.serviceId} not found`);
        continue;
      }

      const updateData: any = {};
      if (update.totalUnits !== undefined) updateData['inventory.totalUnits'] = update.totalUnits;
      if (update.availableUnits !== undefined) updateData['inventory.availableUnits'] = update.availableUnits;
      if (update.minBookingDays !== undefined) updateData['inventory.minBookingDays'] = update.minBookingDays;
      if (update.maxBookingDays !== undefined) updateData['inventory.maxBookingDays'] = update.maxBookingDays;

      await Service.findByIdAndUpdate(update.serviceId, updateData);
      updated++;
    } catch (error) {
      errors.push(`Failed to update property ${update.serviceId}: ${(error as Error).message}`);
    }
  }

  return {
    success: errors.length === 0,
    updated,
    errors
  };
}; 