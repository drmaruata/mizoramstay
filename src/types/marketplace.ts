export type UserRole = "TOURIST" | "HOST" | "GUIDE" | "DRIVER" | "OPERATOR" | "ADMIN" | "SUPER_ADMIN";
export type PropertyStatus = "DRAFT" | "PENDING_REVIEW" | "PUBLISHED" | "SUSPENDED";
export type BookingStatus = "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED" | "NO_SHOW" | "REFUND_PENDING" | "REFUNDED";

export type StayCard = {
  name: string;
  location: string;
  price: string;
  rating: string;
  image: string;
};
