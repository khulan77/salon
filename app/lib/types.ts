export type Service = {
  id: string;
  name: string;
  description: string;
  category: string;
  durationMin: number;
  price: number; // MNT — жирийн үнэ
  salePercent: number; // 0 = хямдралгүй, 1–90 = хямдралын хувь
  emoji: string;
  active: boolean;
};

export type Staff = {
  id: string;
  name: string;
  title: string;
  bio: string;
  serviceIds: string[]; // services this staff can perform ([] = all)
  emoji: string; // fallback avatar when no photo
  imageUrl?: string; // uploaded photo path, e.g. /uploads/abc.jpg
  email?: string; // login email — matches their Supabase Auth account
  active: boolean;
};

export type BookingStatus =
  | "pending"
  | "confirmed"
  | "cancelled"
  | "done"
  | "no_show";

export type Booking = {
  id: string;
  serviceId: string;
  staffId: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  customerName: string;
  customerPhone: string;
  note: string;
  status: BookingStatus;
  code: string; // үйлчлүүлэгчид өгөх 6 тэмдэгт хайх код, ж: "K7F2QX"
  createdAt: string; // ISO
};

/** Үйлчлүүлэгчид /my хуудсанд буцаах аюулгүй хэлбэр (утас, тэмдэглэлгүй). */
export type MyBooking = {
  code: string;
  date: string;
  time: string;
  status: BookingStatus;
  customerName: string;
  serviceName: string;
  serviceEmoji: string;
  staffName: string;
  price: number;
  durationMin: number;
  cancellable: boolean;
};

export type Review = {
  id: string;
  customerName: string;
  rating: number; // 1–5
  text: string;
  active: boolean;
  createdAt: string; // ISO
};

export type Settings = {
  openTime: string; // "10:00"
  closeTime: string; // "20:00"
  slotMinutes: number; // interval between slot start times
  closedDays: number[]; // weekday numbers closed, 0=Ням … 6=Бямба
};

export type Database = {
  services: Service[];
  staff: Staff[];
  bookings: Booking[];
  reviews: Review[];
  settings: Settings;
};
