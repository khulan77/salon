import MyBookings from "./my-bookings";

// Толгой/хөлд гарах салоны нэр Тохиргооноос ирдэг тул build үед хөлдөөхгүй.
export const dynamic = "force-dynamic";

export const metadata = { title: "Миний захиалга" };

export default function MyBookingsPage() {
  return (
    <div className="mx-auto w-full max-w-2xl px-5 py-12 sm:py-16">
      <header>
        <p className="eyebrow">Захиалга шалгах</p>
        <h1 className="mt-2 font-display text-3xl font-semibold text-foreground sm:text-4xl">
          Миний захиалга
        </h1>
        <p className="mt-4 leading-7 text-muted sm:leading-8">
          Захиалга өгөхөд өгсөн <b>6 тэмдэгт код</b> болон утасны дугаараа оруулаад
          цагаа шалгах, шаардлагатай бол цуцлах боломжтой.
        </p>
      </header>

      <MyBookings />
    </div>
  );
}
