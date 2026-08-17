/**
 * Төлбөрийн системийн нэгдсэн интерфэйс.
 *
 * Апп нь QPay, банк, эсвэл өөр ямар ч системийн нарийн ширийнийг мэдэхгүй —
 * зөвхөн энэ гэрээг мэднэ. Шинэ систем холбохын тулд `PaymentProvider`-ийг
 * хэрэгжүүлээд `resolveProvider()`-т нэмэхэд хангалттай.
 *
 * Тохируулаагүй үед `mock` идэвхжинэ — салон merchant дансаа авахаас өмнө ч
 * бүх урсгалыг туршиж, үзүүлж болно.
 */

/** Үйлчлүүлэгчид харуулах нэхэмжлэх. Аль нэг талбар нь заавал байна. */
export type Invoice = {
  invoiceId: string;
  /** Банкны аппаар уншуулах QR-ийн текст. */
  qrText?: string;
  /** QR-ийн зураг (data: URL). */
  qrImage?: string;
  /** Утсан дээр шууд нээх төлбөрийн холбоос. */
  payUrl?: string;
};

export type CreateInvoiceInput = {
  paymentId: string;
  amount: number;
  description: string;
  /** Төлбөр баталгаажсаныг мэдэгдэх webhook хаяг. */
  callbackUrl: string;
};

export interface PaymentProvider {
  /** payments.provider баганад бичигдэх нэр. */
  readonly name: string;
  /** Бодит системтэй холбогдох тохиргоо бүрэн эсэх. */
  isConfigured(): boolean;
  createInvoice(input: CreateInvoiceInput): Promise<Invoice>;
  /**
   * Webhook-ийн хүсэлтийг шалгаж, аль төлбөр төлөгдсөнийг буцаана.
   * Хүсэлт хуурамч/танигдахгүй бол null.
   */
  verifyCallback(
    request: Request,
    body: unknown,
  ): Promise<{ paymentId: string; paid: boolean } | null>;
}

/**
 * Туршилтын систем. Бодит мөнгө хөдлөхгүй — нэхэмжлэх үүсгэсэн дүр эсгээд,
 * "Төлбөр төлөгдсөнд тооцох" товчоор л баталгаажина.
 */
const mockProvider: PaymentProvider = {
  name: "mock",
  isConfigured: () => true,
  async createInvoice({ paymentId, amount }) {
    return {
      invoiceId: `mock-${paymentId}`,
      qrText: `MOCK|${paymentId}|${amount}`,
    };
  },
  async verifyCallback(_request, body) {
    const data = body as { paymentId?: string; paid?: boolean } | null;
    if (!data?.paymentId) return null;
    return { paymentId: data.paymentId, paid: data.paid !== false };
  },
};

/** Идэвхтэй систем. Тохируулаагүй бол mock. */
export function resolveProvider(): PaymentProvider {
  // QPay (эсвэл өөр систем) холбогдох үед энд нэмнэ:
  //   const qpay = createQpayProvider();
  //   if (qpay.isConfigured()) return qpay;
  return mockProvider;
}

/** Бодит мөнгө хөдөлж байгаа эсэх — UI дээр анхааруулга харуулахад хэрэглэнэ. */
export function isMockPayment(): boolean {
  return resolveProvider().name === "mock";
}

/** Webhook-ийн бүтэн хаяг. Vercel дээр NEXT_PUBLIC_SITE_URL-ээс авна. */
export function callbackUrl(): string {
  const base = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:4444").replace(
    /\/$/,
    "",
  );
  return `${base}/api/payments/callback`;
}
