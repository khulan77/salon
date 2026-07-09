import { getSettings } from "@/app/lib/db";
import { updateSettingsAction } from "@/app/lib/actions";

export const metadata = { title: "Тохиргоо — Lumière Admin" };

const WEEKDAYS = [
  { n: 1, label: "Даваа" },
  { n: 2, label: "Мягмар" },
  { n: 3, label: "Лхагва" },
  { n: 4, label: "Пүрэв" },
  { n: 5, label: "Баасан" },
  { n: 6, label: "Бямба" },
  { n: 0, label: "Ням" },
];

const SLOT_OPTIONS = [15, 20, 30, 45, 60];

export default async function AdminSettingsPage() {
  const settings = await getSettings();

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold text-foreground">Тохиргоо</h1>
      <p className="mt-1 text-muted">
        Салоны ажлын цаг ба амралтын өдрийг тохируулна. Энэ нь захиалгын боломжит
        цагийг тодорхойлно.
      </p>

      <form
        action={updateSettingsAction}
        className="mt-8 max-w-2xl space-y-8 rounded-2xl border border-border bg-surface p-6 sm:p-8"
      >
        <section>
          <h2 className="font-display text-lg font-semibold text-foreground">Ажлын цаг</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-foreground">Нээх</span>
              <input
                type="time"
                name="openTime"
                defaultValue={settings.openTime}
                className="sinput"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-foreground">Хаах</span>
              <input
                type="time"
                name="closeTime"
                defaultValue={settings.closeTime}
                className="sinput"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-foreground">
                Цагийн алхам
              </span>
              <select name="slotMinutes" defaultValue={settings.slotMinutes} className="sinput">
                {SLOT_OPTIONS.map((m) => (
                  <option key={m} value={m}>
                    {m} мин
                  </option>
                ))}
              </select>
            </label>
          </div>
        </section>

        <section>
          <h2 className="font-display text-lg font-semibold text-foreground">
            Амралтын өдрүүд
          </h2>
          <p className="mt-1 text-sm text-muted">Тэмдэглэсэн өдрүүдэд захиалга авахгүй.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {WEEKDAYS.map((d) => (
              <label
                key={d.n}
                className="flex cursor-pointer items-center gap-2 rounded-xl border border-border bg-background px-3.5 py-2 text-sm has-[:checked]:border-primary has-[:checked]:bg-primary-soft"
              >
                <input
                  type="checkbox"
                  name="closedDays"
                  value={d.n}
                  defaultChecked={settings.closedDays.includes(d.n)}
                  className="h-4 w-4 accent-[var(--primary)]"
                />
                {d.label}
              </label>
            ))}
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
