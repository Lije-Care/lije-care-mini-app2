export type ShopPaymentReviewStatus =
  | "PENDING_ADMIN_CONFIRMATION"
  | "CONFIRMED"
  | "REJECTED";

export interface ShopOrderPaymentReview {
  id: string;
  orderId: string;
  amountPaid: number;
  paymentScreenshotUrl: string;
  status: ShopPaymentReviewStatus;
  rejectionReason?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ShopOrderItem {
  id: string;
  orderId: string;
  productId: string;
  quantity: number;
  priceAtPurchase: number;
  productNameSnapshot: string;
  productImageSnapshot?: string | null;
}

export interface ShopOrder {
  id: string;
  parentId?: string | null;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  city: string;
  paymentMethod: string;
  deliveryMethod: string;
  deliveryFee: number;
  pickupLocation?: string | null;
  paymentStatus: string;
  fulfillmentStatus: string;
  subtotal: number;
  tax: number;
  total: number;
  createdAt: string;
  updatedAt: string;
  paymentReview?: ShopOrderPaymentReview | null;
  orderItems: ShopOrderItem[];
}
