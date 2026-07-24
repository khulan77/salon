"use client";

import { useState } from "react";
import type { Location } from "@/app/lib/types";
import {
  createLocationAction,
  deleteLocationAction,
  updateLocationAction,
} from "@/app/lib/actions";

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

export default function LocationManager({ locations }: { locations: Location[] }) {
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-semibold text-foreground">Салбарууд</h1>
          <p className="mt-1 text-muted">
            Нийт {locations.length} салбар. Салбар бүр өөрийн хаяг, утас, ажлын цагтай.
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

      {locations.length === 0 && !adding && (
        <p className="mt-6 rounded-2xl border border-border bg-surface p-6 text-sm text-muted">
          Одоогоор салбар бүртгэгдээгүй байна. Салбар нэмэхэд сайтын толгойд салбар
          сонгох цэс гарч, үйлчлүүлэгч хүссэн салбараа сонгож захиална.
        </p>
      )}

      {adding && (
        <div className="mt-6 rounded-2xl border border-border bg-surface p-6">
          <h2 className="font-display text-lg font-semibold text-foreground">Шинэ салбар</h2>
          <LocationFields
            action={async (fd) => {
              await createLocationAction(fd);
              setAdding(false);
            }}
            submitLabel="Хадгалах"
            onCancel={() => setAdding(false)}
          />
        </div>
      )}

      <div className="mt-8 space-y-3">
        {locations.map((l) =>
          editingId === l.id ? (
            <div key={l.id} className="rounded-2xl border border-primary bg-surface p-6">
              <h2 className="font-display text-lg font-semibold text-foreground">
                Засах: {l.name || l.address || "Салбар"}
              </h2>
              <LocationFields
                location={l}
                action={async (fd) => {
                  await updateLocationAction(fd);
                  setEditingId(null);
                }}
                submitLabel="Шинэчлэх"
                onCancel={() => setEditingId(null)}
              />
            </div>
          ) : (
            <div
              key={l.id}
              className="flex flex-wrap items-center gap-4 rounded-2xl border border-border bg-surface p-4"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary-soft text-xl">
                🏢
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="truncate font-medium text-foreground">
                    {l.name || "Нэргүй салбар"}
                  </h3>
                  {!l.active && (
                    <span className="rounded-full bg-surface-2 px-2 py-0.5 text-xs text-muted">
                      Идэвхгүй
                    </span>
                  )}
                  {l.mapCoords ? (
                    <span className="text-xs text-emerald-600" title="Байршил олдсон">
                      📍✓
                    </span>
                  ) : l.address ? (
                    <span className="text-xs text-amber-600" title="Байршил олдсонгүй">
                      📍?
                    </span>
                  ) : null}
                </div>
                <p className="truncate text-xs text-muted">
                  {l.address || "Хаяг оруулаагүй"} · {l.openTime}–{l.closeTime}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setEditingId(l.id);
                    setAdding(false);
                  }}
                  className="rounded-full border border-border px-4 py-1.5 text-xs font-medium hover:border-primary hover:text-primary"
                >
                  Засах
                </button>
                <form
                  action={deleteLocationAction}
                  onSubmit={(e) => {
                    if (!confirm(`"${l.name || l.address}" салбарыг устгах уу?`))
                      e.preventDefault();
                  }}
                >
                  <input type="hidden" name="id" value={l.id} />
                  <button
                    type="submit"
                    className="rounded-full px-4 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50"
                  >
                    Устгах
                  </button>
                </form>
              </div>
            </div>
          ),
        )}
      </div>

      <style>{`
        .linput {
          width: 100%;
          border-radius: 0.75rem;
          border: 1px solid var(--border);
          background: var(--background);
          padding: 0.625rem 0.875rem;
          font-size: 0.875rem;
          outline: none;
        }
        .linput:focus {
          border-color: var(--primary);
          box-shadow: 0 0 0 3px rgba(217,167,173,0.35);
        }
      `}</style>
    </div>
  );
}

function LocationFields({
  location,
  action,
  submitLabel,
  onCancel,
}: {
  location?: Location;
  action: (fd: FormData) => void | Promise<void>;
  submitLabel: string;
  onCancel?: () => void;
}) {
  return (
    <form action={action} className="mt-4 space-y-5">
      {location && <input type="hidden" name="id" value={location.id} />}

      <div className="grid gap-4 sm:grid-cols-2">
        <L label="Салбарын нэр">
          <input
            name="name"
            defaultValue={location?.name}
            maxLength={60}
            placeholder="Төв салбар"
            className="linput"
          />
        </L>
        <L label="Утасны дугаар">
          <input
            name="phone"
            defaultValue={location?.phone}
            maxLength={40}
            placeholder="+976 8000-0000"
            className="linput"
          />
        </L>
      </div>

      <L label="Хаяг">
        <input
          name="address"
          defaultValue={location?.address}
          maxLength={200}
          placeholder="Улаанбаатар, Сүхбаатар дүүрэг, 1-р хороо"
          className="linput"
        />
        <span className="mt-1.5 block text-xs text-muted">
          {!location?.address
            ? "Хаягаа бичээд хадгалахад газрын зураг өөрөө гарна."
            : location.mapCoords
              ? "✓ Байршил олдсон — сайтад газрын зураг харагдана."
              : "Энэ хаягаар байршил олдсонгүй. Дүүрэг, гудамжаа нэмж бичээд дахин хадгална уу."}
        </span>
      </L>

      <div className="grid gap-4 sm:grid-cols-3">
        <L label="Нээх">
          <input
            type="time"
            name="openTime"
            defaultValue={location?.openTime ?? "10:00"}
            className="linput"
          />
        </L>
        <L label="Хаах">
          <input
            type="time"
            name="closeTime"
            defaultValue={location?.closeTime ?? "20:00"}
            className="linput"
          />
        </L>
        <L label="Цагийн алхам">
          <select
            name="slotMinutes"
            defaultValue={location?.slotMinutes ?? 30}
            className="linput"
          >
            {SLOT_OPTIONS.map((m) => (
              <option key={m} value={m}>
                {m} мин
              </option>
            ))}
          </select>
        </L>
      </div>

      <fieldset>
        <legend className="mb-2 text-sm font-medium text-foreground">Амралтын өдрүүд</legend>
        <div className="flex flex-wrap gap-2">
          {WEEKDAYS.map((d) => (
            <label
              key={d.n}
              className="flex cursor-pointer items-center gap-2 rounded-xl border border-border bg-background px-3.5 py-2 text-sm has-[:checked]:border-primary has-[:checked]:bg-primary-soft"
            >
              <input
                type="checkbox"
                name="closedDays"
                value={d.n}
                defaultChecked={location?.closedDays.includes(d.n)}
                className="h-4 w-4 accent-[var(--primary)]"
              />
              {d.label}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="flex flex-wrap items-center gap-6">
        <L label="Дараалал">
          <input
            type="number"
            name="sortOrder"
            defaultValue={location?.sortOrder ?? 0}
            className="linput w-24"
          />
        </L>
        <label className="flex items-center gap-2 self-end pb-2.5 text-sm text-foreground">
          <input
            type="checkbox"
            name="active"
            defaultChecked={location ? location.active : true}
            className="h-4 w-4 accent-[var(--primary)]"
          />
          Идэвхтэй (сайтад харагдана)
        </label>
      </div>

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

function L({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-foreground">{label}</span>
      {children}
    </label>
  );
}
