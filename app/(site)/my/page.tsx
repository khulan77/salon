import MyBookings from "./my-bookings";

export const metadata = { title: "Миний захиалга — Lumière" };

export default function MyBookingsPage() {
  return (
    <div className="mx-auto w-full max-w-2xl px-5 py-16">
      <header>
        <p className="eyebrow">Захиалга шалгах</p>
        <h1 className="mt-2 font-display text-4xl font-semibold text-foreground">
          Миний захиалга
        </h1>
        <p className="mt-4 leading-8 text-muted">
          Захиалга өгөхөд өгсөн <b>6 тэмдэгт код</b> болон утасны дугаараа оруулаад
          цагаа шалгах, шаардлагатай бол цуцлах боломжтой.
        </p>
      </header>

      <MyBookings />
    </div>
  );
}
