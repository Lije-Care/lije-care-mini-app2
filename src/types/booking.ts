// types/booking.ts
export interface Booking {
    id: string;
    slotId: string;
    parentId: string;
    expertId: string;
    userPackageId?: string;
    createdAt: string;
    status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED'; // extend as needed
    consultationTimeZone?: string;
    sessionWindowState?: 'upcoming' | 'active' | 'ended' | 'unknown';
    parent: Parent;
    expert: Expert;
    slot: Slot;
    userPackage?: UserPackage;
  }
  
  export interface Parent {
    id: string;
    telegram_username: string;
    firstName: string;
    lastName: string;
    gender: string;
    avatarUrl: string | null;
    address: string;
    city: string;
    phone: string;
    role: string;
    status: string;
    createdAt: string;
    updatedAt: string;
    deletedAt: string | null;
  }
  
export interface Expert {
    id: string;
    telegram_username: string | null;
    firstName: string;
    lastName: string;
    gender: string | null;
    avatarUrl: string | null;
    address: string | null;
    city: string | null;
    phone: string;
    role: string;
    status: string;
    createdAt: string;
    updatedAt: string;
    deletedAt: string | null;
    SpecialistProfile?: {
      timeZone?: string | null;
    } | null;
  }
  
  export interface Slot {
    id: string;
    userId: string;
    date: string;
    startTime: string;
    endTime: string;
    isBooked: boolean;
    createdAt: string;
  }
  
  export interface UserPackage {
    id: string;
    userId: string;
    packageId: string;
    remainingUses: number;
    expiresAt: string;
    purchasedAt: string;
    package: {
      id: string;
      title: string;
      description: string;
      sessionsAllowed: number;
      validityDays: number;
      price: number;
      createdAt: string;
      updatedAt: string;
    };
  }
  
