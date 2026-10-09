// ========================================
// CUKING PRO WEB - TYPE DEFINITIONS
// ========================================

// User & Auth Types
export interface User {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image?: string | null;
  createdAt: Date;
}

export interface Session {
  user: User;
  expiresAt: Date;
}

// Profile Types
export interface Profile {
  userId: string;
  whatsapp?: string | null;
  kennelName?: string | null;
  avatarPath?: string | null;
  isBreeder: boolean;
  isStudProvider: boolean;
  emailRemindersEnabled: boolean;
  createdAt: Date;
}

// Cat Types
export interface Cat {
  id: string;
  ownerId: string;
  name: string;
  sex: 'male' | 'female';
  breed?: string | null;
  color?: string | null;
  birthDate?: string | null;
  photoPath?: string | null;
  isNeutered: boolean;
  microchipNo?: string | null;
  pedigreeNo?: string | null;
  sireId?: string | null;
  sireNameManual?: string | null;
  damId?: string | null;
  damNameManual?: string | null;
  litterId?: string | null;
  status: 'active' | 'sold' | 'deceased';
  trackingStatus: 'tracked' | 'frozen';
  notes?: string | null;
  createdAt: Date;
}

// Plan Types
export interface Plan {
  id: string;
  code: string;
  name: string;
  priceIdr: number;
  durationDays: number;
  isActive: boolean;
}

export interface Subscription {
  id: string;
  userId: string;
  planId: string;
  startsAt: Date;
  endsAt: Date;
  createdAt: Date;
}

// Form State Types
export interface FormState<T = Record<string, string[]>> {
  errors?: T;
  message?: string;
  success?: boolean;
}

// API Response Types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    field?: string;
  };
}

// Navigation Types
export interface NavItem {
  href: string;
  label: string;
  icon: string;
  isActive?: boolean;
}

// Reminder Types
export interface Reminder {
  id: string;
  userId: string;
  catId?: string | null;
  title: string;
  dueDate: string;
  sourceType: 'health' | 'pregnancy' | 'booking_planned' | 'booking_due' | 'manual';
  sourceId?: string | null;
  doneAt?: Date | null;
  notifiedH3At?: Date | null;
  notifiedD0At?: Date | null;
}

// Health Record Types
export interface HealthRecord {
  id: string;
  catId: string;
  type: 'vaccine' | 'deworming' | 'flea' | 'vet_visit' | 'medication' | 'weight' | 'other';
  title?: string | null;
  recordDate: string;
  nextDueDate?: string | null;
  weightKg?: number | null;
  vetName?: string | null;
  cost?: number | null;
  photoPath?: string | null;
  notes?: string | null;
}

// Heat Cycle Types
export interface HeatCycle {
  id: string;
  catId: string;
  startDate: string;
  endDate?: string | null;
  notes?: string | null;
}

// Mating Types
export interface Mating {
  id: string;
  ownerId: string;
  queenId?: string | null;
  queenNameManual?: string | null;
  sireId?: string | null;
  sireNameManual?: string | null;
  matingDate: string;
  outcome: 'pending' | 'pregnant' | 'not_pregnant' | 'delivered';
  expectedDueDate?: string | null;
  notes?: string | null;
}

// Litter Types
export interface Litter {
  id: string;
  matingId: string;
  birthDate: string;
  totalBorn: number;
  totalAlive: number;
  notes?: string | null;
}

// Cat Sale Types
export interface CatSale {
  id: string;
  ownerId: string;
  catId?: string | null;
  catName: string;
  status: 'listed' | 'reserved' | 'sold' | 'cancelled';
  askingPrice?: number | null;
  buyerName?: string | null;
  buyerWhatsapp?: string | null;
  finalPrice?: number | null;
  depositAmount?: number | null;
  depositPaid: boolean;
  saleDate?: string | null;
  notes?: string | null;
  createdAt: Date;
}

// Stud Service Types
export interface StudService {
  id: string;
  catId?: string | null;
  catName: string;
  ownerId: string;
  feeAmount?: number | null;
  feeDescription?: string | null;
  notes?: string | null;
  isAvailable: boolean;
}

// Stud Booking Types
export interface StudBooking {
  id: string;
  ownerId: string;
  studServiceId: string;
  clientName: string;
  clientWhatsapp: string;
  queenName: string;
  queenBreed?: string | null;
  queenAgeText?: string | null;
  plannedDate?: string | null;
  status: 'requested' | 'approved' | 'ongoing' | 'completed' | 'rejected' | 'cancelled';
  feeAgreed?: number | null;
  depositAmount?: number | null;
  depositPaid: boolean;
  expectedDueDate?: string | null;
  expectedDueDateManual: boolean;
  queenPregnancyStatus: 'unknown' | 'pregnant' | 'not_pregnant' | 'delivered';
  notes?: string | null;
  createdAt: Date;
}

// Transaction Types
export interface Transaction {
  id: string;
  userId: string;
  type: 'income' | 'expense';
  category: string;
  amount: number;
  txnDate: string;
  catId?: string | null;
  catName?: string | null;
  bookingId?: string | null;
  saleId?: string | null;
  notes?: string | null;
}

// Transfer Types
export interface CatTransfer {
  id: string;
  catId: string;
  catName: string;
  catSummary?: string | null;
  fromUserId: string;
  toEmail: string;
  toUserId?: string | null;
  message?: string | null;
  status: 'pending' | 'accepted' | 'rejected' | 'cancelled' | 'expired';
  createdAt: Date;
  expiresAt: Date;
  respondedAt?: Date | null;
}

// Ownership History Types
export interface OwnershipHistory {
  id: string;
  catId?: string | null;
  catName: string;
  ownerId?: string | null;
  ownerDisplayName: string;
  startedAt: Date;
  endedAt?: Date | null;
  acquiredVia: 'created' | 'transfer';
  transferId?: string | null;
}
