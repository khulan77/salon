/**
 * QPay холболтын суурь. ОДООГООР БҮРЭН БИШ — merchant данс авсны дараа
 * доорх 3 газрыг бөглөнө.
 *
 * Яагаад бэлэн биш вэ: QPay-н эцсийн хаяг, талбарын нэрс merchant гэрээ
 * болон хувилбараас хамаарч ялгаатай байдаг. Тэдгээрийг таамаглаж бичвэл
 * "ажиллаж байгаа мэт" хэрнээ бодит мөнгөн дээр унах эрсдэлтэй. Тиймээс
 * бүтцийг бэлдээд, тодорхой заавартайгаар үлдээв.
 *
 * ХИЙХ ЗҮЙЛС:
 *  1. .env.local (болон Vercel) дээр нэмэх:
 *       QPAY_URL=https://merchant.qpay.mn/v2
 *       QPAY_USERNAME=...
 *       QPAY_PASSWORD=...
 *       QPAY_INVOICE_CODE=...        (merchant-аас өгнө)
 *       NEXT_PUBLIC_SITE_URL=https://<таны-домэйн>
 *  2. Доорх `token()`, `createInvoice()`, `verifyCallback()`-ийг QPay-с өгсөн
 *     баримтын дагуу бөглөх (хүсэлтийн бие, хариуны талбарын нэрс).
 *  3. `provider.ts` доторх `resolveProvider()`-т эдгээр мөрийг нээх:
 *       const qpay = createQpayProvider();
 *       if (qpay.isConfigured()) return qpay;
 *  4. QPay-н самбар дээр callback хаягийг бүртгүүлэх:
 *       https://<таны-домэйн>/api/payments/callback
 *
 * Тохируулаагүй үед энэ систем идэвхжихгүй — апп mock дээр ажиллана.
 */
import type { CreateInvoiceInput, Invoice, PaymentProvider } from "./provider";

const URL_BASE = process.env.QPAY_URL ?? "";
const USERNAME = process.env.QPAY_USERNAME ?? "";
const PASSWORD = process.env.QPAY_PASSWORD ?? "";
const INVOICE_CODE = process.env.QPAY_INVOICE_CODE ?? "";

export function createQpayProvider(): PaymentProvider {
  return {
    name: "qpay",

    isConfigured: () =>
      Boolean(URL_BASE && USERNAME && PASSWORD && INVOICE_CODE),

    async createInvoice(_input: CreateInvoiceInput): Promise<Invoice> {
      // 1) Токен авах:   POST {URL_BASE}/auth/token   (Basic auth: USERNAME:PASSWORD)
      // 2) Нэхэмжлэх:    POST {URL_BASE}/invoice      (Bearer <token>)
      //    Хүсэлтэд: invoice_code, sender_invoice_no = input.paymentId,
      //              invoice_receiver_code, invoice_description = input.description,
      //              amount = input.amount, callback_url = input.callbackUrl
      // 3) Хариунаас: invoice_id, qr_text, qr_image, urls[] → Invoice болгож буцаах.
      throw new Error(
        "QPay холболт бөглөгдөөгүй байна. app/lib/payment/qpay.ts доторх зааврыг үзнэ үү.",
      );
    },

    async verifyCallback(_request: Request, _body: unknown) {
      // QPay callback ирэхэд:
      //  1) sender_invoice_no (= бидний paymentId) болон payment_id-г уншина.
      //  2) POST {URL_BASE}/payment/check-ээр дүнг ЭРГЭЖ БАТАЛГААЖУУЛНА —
      //     callback-ийн биед итгэж болохгүй, хуурамчаар илгээж болно.
      //  3) { paymentId, paid } буцаана. Танигдахгүй бол null.
      throw new Error(
        "QPay callback шалгалт бөглөгдөөгүй байна. app/lib/payment/qpay.ts-г үзнэ үү.",
      );
    },
  };
}
