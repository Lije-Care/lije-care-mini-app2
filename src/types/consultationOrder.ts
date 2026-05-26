export type ConsultationOrderStatus =
  | 'PENDING_ADMIN_CONFIRMATION'
  | 'CONFIRMED'
  | 'REJECTED';

export type ConsultationOrderType = 'TEXT' | 'AUDIO' | 'VIDEO';

export interface ConsultationOrder {
  id: string;
  bookingId: string | null;
  status: ConsultationOrderStatus;
  consultationType: ConsultationOrderType;
  pricePaid: number;
  expert: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    avatarUrl: string | null;
  };
  createdAt: string;
}
