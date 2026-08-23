import Link from "next/link";
import { getSettings } from "@/app/lib/db";
import { updateSettingsAction } from "@/app/lib/actions";
import ImageField from "../image-field";

export const metadata = { title: "Тохиргоо" };

export default async function AdminSettingsPage() {
  const settings = await getSettings();

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold text-foreground">Тохиргоо</h1>
      <p className="mt-1 text-muted">
        Салоны ерөнхий мэдээлэл. Хаяг, утас, ажлын цаг нь салбар бүрт хамаарах тул{" "}
        <Link href="/admin/locations" className="text-primary hover:underline">
          Салбарууд
        </Link>{" "}
        хуудаснаас засагдана.
      </p>

      <form
        action={updateSettingsAction}
        className="mt-8 max-w-2xl space-y-8 rounded-2xl border border-border bg-surface p-6 sm:p-8"
      >
        <section>
          <h2 className="font-display text-lg font-semibold text-foreground">
            Салоны мэдээлэл
          </h2>
          <p className="mt-1 text-sm text-muted">
            Нэр болон танилцуулга нь сайтын толгой, хөл, нүүр хуудсанд гарна.
          </p>

          <div className="mt-4 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-foreground">
                  Салоны нэр
                </span>
                <input
                  name="salonName"
                  defaultValue={settings.salonName}
                  maxLength={60}
                  placeholder="Lumière"
                  className="field"
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-foreground">
                  Богино тодорхойлолт
                </span>
                <input
                  name="tagline"
                  defaultValue={settings.tagline}
                  maxLength={80}
                  placeholder="Гоо сайхны салон"
                  className="field"
                />
              </label>
              <label className="block sm:col-span-2">
                <span className="mb-1.5 block text-sm font-medium text-foreground">
                  И-мэйл
                </span>
                <input
                  name="email"
                  defaultValue={settings.email}
                  maxLength={80}
                  placeholder="hello@salon.mn"
                  className="field"
                />
              </label>
            </div>

            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-foreground">
                Бидний тухай
              </span>
              <textarea
                name="about"
                defaultValue={settings.about}
                maxLength={1000}
                rows={4}
                placeholder="Салоны танилцуулга — нүүр хуудсанд гарна."
                className="field resize-none"
              />
            </label>
          </div>
        </section>

        <section>
          <h2 className="font-display text-lg font-semibold text-foreground">
            Урьдчилгаа төлбөр
          </h2>
          <p className="mt-1 text-sm text-muted">
            Захиалга бүрт авах урьдчилгаа. <b>0 бол урьдчилгаа авахгүй</b> — цаг
            шууд захиалагдана. Дүн тавьсан үед үйлчлүүлэгч төлбөрөө хийтэл цаг
            баталгаажихгүй тул ирэхгүй өнжих (no-show) багасна.
          </p>
          <div className="mt-4 max-w-xs">
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-foreground">
                Урьдчилгааны дүн (₮)
              </span>
              <input
                name="depositAmount"
                inputMode="numeric"
                defaultValue={settings.depositAmount}
                placeholder="10000"
                className="field"
              />
            </label>
          </div>
          <p className="mt-3 rounded-xl bg-surface-2/70 px-4 py-3 text-xs leading-5 text-muted">
            ⚠️ Төлбөрийн систем хараахан холбогдоогүй байна — одоогоор{" "}
            <b>туршилтын горимд</b> ажиллана (бодит мөнгө хөдлөхгүй). QPay
            merchant данс авмагц холбоно.{" "}
            <Link href="/admin/payments" className="text-primary hover:underline">
              Төлбөрүүд
            </Link>{" "}
            хуудаснаас явцыг харна.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg font-semibold text-foreground">
            Нүүр хуудасны зураг
          </h2>
          <p className="mt-1 text-sm text-muted">
            Нүүр хуудсын дээд хэсэгт дугуй хүрээнд харагдана. Салоны дотоод
            орчин, ажлын үр дүнгээ тавихад тохиромжтой. Хоосон бол эможи дүрслэл
            гарна.
          </p>
          <div className="mt-4">
            <ImageField
              currentUrl={settings.heroImageUrl}
              fallbackEmoji="💇‍♀️"
              shape="wide"
              hint="Дөрвөлжинд ойр зураг илүү тохирно · JPG, PNG, WEBP · 5MB хүртэл"
            />
          </div>
        </section>

        <button
          type="submit"
          className="rounded-full bg-primary px-7 py-3 text-sm font-medium text-white hover:bg-primary-hover"
        >
          Хадгалах
        </button>
      </form>
    </div>
  );
}
