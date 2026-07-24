import Link from "next/link";
import { getSettings } from "@/app/lib/db";
import { updateSettingsAction } from "@/app/lib/actions";

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
                  className="sinput"
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
                  className="sinput"
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
                  className="sinput"
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
                className="sinput resize-none"
              />
            </label>
          </div>
        </section>

        <button
          type="submit"
          className="rounded-full bg-primary px-7 py-3 text-sm font-medium text-white hover:bg-primary-hover"
        >
          Хадгалах
        </button>
      </form>

      <style>{`
        .sinput {
          width: 100%;
          border-radius: 0.75rem;
          border: 1px solid var(--border);
          background: var(--background);
          padding: 0.625rem 0.875rem;
          font-size: 0.875rem;
          outline: none;
        }
        .sinput:focus {
          border-color: var(--primary);
          box-shadow: 0 0 0 3px rgba(217,167,173,0.35);
        }
      `}</style>
    </div>
  );
}
