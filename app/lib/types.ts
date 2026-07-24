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

/** Салбар (хаяг). Салон нэгээс олон салбартай байж болно. */
export type Location = {
  id: string;
  name: string; // товч нэр, ж: "Төв салбар", "Зайсан салбар"
  address: string;
  phone: string;
  mapCoords: string; // хаягаас автоматаар олдсон "47.9185,106.9177"
  openTime: string; // "10:00"
  closeTime: string; // "20:00"
  slotMinutes: number; // цагийн алхам
  closedDays: number[]; // амардаг гаригууд, 0=Ням … 6=Бямба
  sortOrder: number; // жагсаалтын дараалал
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
  locationId?: string; // хамаарах салбар (хоосон = бүх салбар)
  active: boolean;
};

/** Багц — хэд хэдэн үйлчилгээг нэгтгэсэн, багцын үнээр зарагдах санал. */
export type ServicePackage = {
  id: string;
  name: string;
  description: string;
  serviceIds: string[]; // багцад багтах үйлчилгээнүүд
  price: number; // MNT — багцын үнэ (ихэвчлэн нийлбэрээс хямд)
  emoji: string;
  sortOrder: number;
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
  locationId?: string; // захиалга хийгдсэн салбар
  packageId?: string; // багцаар захиалсан бол багцын id (serviceId хоосон байна)
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

  // Салоны танилцуулга — сайтын толгой, хөл, нүүр хуудас эндээс уншина.
  salonName: string;
  tagline: string;
  phone: string;
  email: string;
  address: string;
  about: string;
  mapCoords: string; // хаягаас автоматаар олдсон "47.9185,106.9177"
};

export type Database = {
  services: Service[];
  staff: Staff[];
  bookings: Booking[];
  reviews: Review[];
  locations: Location[];
  packages: ServicePackage[];
  settings: Settings;
};
