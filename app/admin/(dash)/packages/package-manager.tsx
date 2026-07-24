"use client";

import { useMemo, useState } from "react";
import type { Service, ServicePackage } from "@/app/lib/types";
import {
  createPackageAction,
  deletePackageAction,
  updatePackageAction,
} from "@/app/lib/actions";
import { formatPrice, packageTotals } from "@/app/lib/format";

export default function PackageManager({
  packages,
  services,
}: {
  packages: ServicePackage[];
  services: Service[];
}) {
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-semibold text-foreground">Багц</h1>
          <p className="mt-1 text-muted">
            Нийт {packages.length} багц. Хэд хэдэн үйлчилгээг нэг багц болгож
            хямдралтай үнээр зарна.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setAdding((v) => !v);
            setEditingId(null);
          }}
          className="rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-hover"
        >
          {adding ? "Болих" : "+ Нэмэх"}
        </button>
      </div>

      {services.length === 0 && (
        <p className="mt-6 rounded-2xl border border-border bg-surface p-6 text-sm text-muted">
          Багц үүсгэхийн тулд эхлээд{" "}
          <a href="/admin/services" className="text-primary hover:underline">
            Үйлчилгээ
          </a>{" "}
          нэмнэ үү.
        </p>
      )}

      {adding && (
        <div className="mt-6 rounded-2xl border border-border bg-surface p-6">
          <h2 className="font-display text-lg font-semibold text-foreground">Шинэ багц</h2>
          <PackageFields
            services={services}
            action={async (fd) => {
              await createPackageAction(fd);
              setAdding(false);
            }}
            submitLabel="Хадгалах"
            onCancel={() => setAdding(false)}
          />
        </div>
      )}

      <div className="mt-8 space-y-3">
        {packages.map((p) => {
          const t = packageTotals(p, services);
          return editingId === p.id ? (
            <div key={p.id} className="rounded-2xl border border-primary bg-surface p-6">
              <h2 className="font-display text-lg font-semibold text-foreground">
                Засах: {p.name}
              </h2>
              <PackageFields
                pkg={p}
                services={services}
                action={async (fd) => {
                  await updatePackageAction(fd);
                  setEditingId(null);
                }}
                submitLabel="Шинэчлэх"
                onCancel={() => setEditingId(null)}
              />
            </div>
          ) : (
            <div
              key={p.id}
              className="flex flex-wrap items-center gap-4 rounded-2xl border border-border bg-surface p-4"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary-soft text-xl">
                {p.emoji}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="truncate font-medium text-foreground">{p.name}</h3>
                  {!p.active && (
                    <span className="rounded-full bg-surface-2 px-2 py-0.5 text-xs text-muted">
                      Идэвхгүй
                    </span>
                  )}
                  {t.savePercent > 0 && (
                    <span className="rounded-full bg-rose-500 px-2 py-0.5 text-xs font-semibold text-white">
                      −{t.savePercent}%
                    </span>
                  )}
                </div>
                <p className="truncate text-xs text-muted">
                  {p.serviceIds.length} үйлчилгээ · {formatPrice(p.price)}
                  {t.saved > 0 && ` (${formatPrice(t.saved)} хэмнэнэ)`}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setEditingId(p.id);
                    setAdding(false);
                  }}
                  className="rounded-full border border-border px-4 py-1.5 text-xs font-medium hover:border-primary hover:text-primary"
                >
                  Засах
                </button>
                <form
                  action={deletePackageAction}
                  onSubmit={(e) => {
                    if (!confirm(`"${p.name}" багцыг устгах уу?`)) e.preventDefault();
                  }}
                >
                  <input type="hidden" name="id" value={p.id} />
                  <button
                    type="submit"
                    className="rounded-full px-4 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50"
                  >
                    Устгах
                  </button>
                </form>
              </div>
            </div>
          );
        })}
      </div>

      <style>{`
        .pinput {
          width: 100%;
          border-radius: 0.75rem;
          border: 1px solid var(--border);
          background: var(--background);
          padding: 0.625rem 0.875rem;
          font-size: 0.875rem;
          outline: none;
        }
        .pinput:focus {
          border-color: var(--primary);
          box-shadow: 0 0 0 3px rgba(217,167,173,0.35);
        }
      `}</style>
    </div>
  );
}

function PackageFields({
  pkg,
  services,
  action,
  submitLabel,
  onCancel,
}: {
  pkg?: ServicePackage;
  services: Service[];
  action: (fd: FormData) => void | Promise<void>;
  submitLabel: string;
  onCancel?: () => void;
}) {
  const [selected, setSelected] = useState<string[]>(pkg?.serviceIds ?? []);
  const [price, setPrice] = useState<number>(pkg?.price ?? 0);

  // Сонголт өөрчлөгдөх бүрд жирийн нийлбэр, хэмнэлтийг шууд харуулна.
  const totals = useMemo(
    () => packageTotals({ serviceIds: selected, price }, services),
    [selected, price, services],
  );

  const toggle = (id: string) =>
    setSelected((cur) =>
      cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id],
    );

  return (
    <form action={action} className="mt-4 space-y-5">
      {pkg && <input type="hidden" name="id" value={pkg.id} />}

      <div className="grid gap-4 sm:grid-cols-[1fr_5rem]">
        <L label="Багцын нэр">
          <input
            name="name"
            required
            defaultValue={pkg?.name}
            placeholder="Сүйн бүсгүйн багц"
            className="pinput"
          />
        </L>
        <L label="Эможи">
          <input name="emoji" defaultValue={pkg?.emoji ?? "🎁"} maxLength={4} className="pinput" />
        </L>
      </div>

      <L label="Тайлбар">
        <textarea
          name="description"
          rows={2}
          defaultValue={pkg?.description}
          placeholder="Багцад юу багтахыг товч бичнэ үү."
          className="pinput resize-none"
        />
      </L>

      <fieldset>
        <legend className="mb-2 text-sm font-medium text-foreground">
          Багтах үйлчилгээ{" "}
          <span className="font-normal text-muted">(2-оос дээшийг сонго)</span>
        </legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {services.map((s) => (
            <label
              key={s.id}
              className="flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2 text-sm has-[:checked]:border-primary has-[:checked]:bg-primary-soft"
            >
              <input
                type="checkbox"
                name="serviceIds"
                value={s.id}
                checked={selected.includes(s.id)}
                onChange={() => toggle(s.id)}
                className="h-4 w-4 accent-[var(--primary)]"
              />
              <span className="min-w-0 flex-1 truncate text-foreground">
                {s.emoji} {s.name}
              </span>
              <span className="shrink-0 text-xs text-muted">{formatPrice(s.price)}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-[1fr_1fr_5rem]">
        <L label="Багцын үнэ (₮)">
          <input
            name="price"
            inputMode="numeric"
            defaultValue={pkg?.price ?? 0}
            onChange={(e) => setPrice(Number(e.target.value.replace(/[^0-9]/g, "")) || 0)}
            className="pinput"
          />
        </L>
        <div>
          <span className="mb-1.5 block text-sm font-medium text-foreground">
            Жирийн нийлбэр
          </span>
          <div className="rounded-xl bg-surface-2/60 px-3.5 py-2.5 text-sm">
            <s className="text-muted">{formatPrice(totals.regular)}</s>
            {totals.saved > 0 && (
              <span className="ml-2 font-medium text-emerald-600">
                −{totals.savePercent}% ({formatPrice(totals.saved)})
              </span>
            )}
          </div>
        </div>
        <L label="Дараалал">
          <input
            type="number"
            name="sortOrder"
            defaultValue={pkg?.sortOrder ?? 0}
            className="pinput"
          />
        </L>
      </div>

      <label className="flex items-center gap-2 text-sm text-foreground">
        <input
          type="checkbox"
          name="active"
          defaultChecked={pkg ? pkg.active : true}
          className="h-4 w-4 accent-[var(--primary)]"
        />
        Идэвхтэй (сайтад харагдана)
      </label>

      <div className="flex gap-2">
        <button
          type="submit"
          className="rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-white hover:bg-primary-hover"
        >
          {submitLabel}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full border border-border px-6 py-2.5 text-sm font-medium hover:border-ring"
          >
            Болих
          </button>
        )}
      </div>
    </form>
  );
}

function L({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-foreground">{label}</span>
      {children}
    </label>
  );
}
