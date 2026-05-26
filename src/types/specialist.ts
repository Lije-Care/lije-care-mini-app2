export interface SpecialistProfile {
  email: string;
  dateOfBirth: string; // ISO date string
  nationality: string;
  countryOfResidence: string;
  timeZone: string;
  specialty: string;
  /** General fallback fee (backward-compatible) */
  consultationFee: number;
  /** Price for text / chat consultation — null means not configured */
  textPrice?: number | null;
  /** Price for audio / voice call consultation — null means not configured */
  callPrice?: number | null;
  /** Price for video call consultation — null means not configured */
  videoCallPrice?: number | null;
  licenseNumber: string;
  issuingAuthority: string;
  yearsOfExperience: number;
  cvUrl: string;
  certificatesUrl: string;
  licenseProofUrl: string;
  linkedIn: string;
  passportPhotoUrl: string;
  profilePhotoUrl: string;
  languages: string[];
  consultationTopics: string[];
  communicationChannels: string[];
  bio: string;
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
  userId: string;
}

export type AvailabilitySlot = {
  id: string;
  userId: string;
  date: string; // or Date if parsed
  startTime: string;
  endTime: string;
  isBooked: boolean;
  createdAt: string; // or Date if parsed
};


export interface User {
  id: string;
  AvailabilitySlots?: AvailabilitySlot[];
  telegram_username: string;
  firstName: string;
  lastName: string;
  gender: 'MALE' | 'FEMALE' | string;
  avatarUrl: string;
  address: string;
  city: string;
  phone: string;
  password: string;
  role: 'NUTRITIONIST' | 'CONTENT_MANAGER' | string;
  status: 'ACTIVE' | 'INACTIVE' | string;
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
  deletedAt: string | null;
  SpecialistProfile: SpecialistProfile;
  availabilitySlots: AvailabilitySlot[];
}

export interface Meta {
  total: number;
  lastPage: number;
  currentPage: number;
  perPage: number;
  prev: number | null;
  next: number | null;
}

export interface UserListResponse {
  data: User[];
  meta: Meta;
}
