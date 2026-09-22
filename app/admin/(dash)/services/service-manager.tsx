"use client";

import { useState } from "react";
import type { Service } from "@/app/lib/types";
import {
  createServiceAction,
  deleteServiceAction,
  updateServiceAction,
} from "@/app/lib/actions";
import {
  effectivePrice,
  formatDuration,
  formatPrice,
  hasSale,
} from "@/app/lib/format";
import ImageField from "../image-field";

export default function ServiceManager({ services }: { services: Service[] }) {
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const onSaleCount = services.filter(hasSale).length;

  return (
    <div>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="font-display text-2xl font-semibold text-foreground sm:text-3xl">Үйлчилгээ</h1>
          <p className="mt-1 text-sm leading-5 text-muted sm:text-base">
            Нийт {services.length} үйлчилгээ
            {onSaleCount > 0 && (
              <>
                , үүнээс{" "}
                <b className="text-rose-600">{onSaleCount} нь хямдралтай</b>
              </>
            )}
            .
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setAdding((v) => !v);
            setEditingId(null);
          }}
          className="min-h-11 shrink-0 whitespace-nowrap rounded-full bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-hover sm:px-5"
        >
          {adding ? "Болих" : "+ Нэмэх"}
        </button>
      </div>

      {adding && (
        <div className="mt-6 rounded-2xl border border-border bg-surface p-6">
          <h2 className="font-display text-lg font-semibold text-foreground">
            Шинэ үйлчилгээ
          </h2>
          <ServiceFields
            action={async (fd) => {
              await createServiceAction(fd);
              setAdding(false);
            }}
            submitLabel="Хадгалах"
          />
        </div>
      )}

      <div className="mt-6 space-y-3 sm:mt-8">
        {services.map((s) =>
          editingId === s.id ? (
            <div key={s.id} className="rounded-2xl border border-primary bg-surface p-6">
              <h2 className="font-display text-lg font-semibold text-foreground">
                Засах: {s.name}
              </h2>
              <ServiceFields
                service={s}
                action={async (fd) => {
                  await updateServiceAction(fd);
                  setEditingId(null);
                }}
                submitLabel="Шинэчлэх"
                onCancel={() => setEditingId(null)}
              />
            </div>
          ) : (
            <div
              key={s.id}
              className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-3 sm:gap-4 sm:p-4"
            >
              {s.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={s.imageUrl}
                  alt=""
                  className="h-12 w-12 shrink-0 rounded-xl object-cover"
                />
              ) : (
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-soft text-2xl">
                  {s.emoji}
                </span>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex min-w-0 items-center gap-1.5 sm:gap-2">
                  <h3 className="truncate font-medium text-foreground">{s.name}</h3>
                  {hasSale(s) && (
                    <span className="rounded-full bg-rose-100 px-2 py-0.5 text-xs font-semibold text-rose-700">
                      🔥 −{s.salePercent}%
                    </span>
                  )}
                  {!s.active && (
                    <span className="rounded-full bg-surface-2 px-2 py-0.5 text-xs text-muted">
                      Идэвхгүй
                    </span>
                  )}
                </div>
                <p className="truncate text-xs text-muted">
                  {s.category} ·{" "}
                  {hasSale(s) ? (
                    <>
                      <s>{formatPrice(s.price)}</s>{" "}
                      <b className="text-rose-600">{formatPrice(effectivePrice(s))}</b>
                    </>
                  ) : (
                    formatPrice(s.price)
                  )}{" "}
                  · {formatDuration(s.durationMin)}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1 sm:gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setEditingId(s.id);
                    setAdding(false);
                  }}
                  className="rounded-full border border-border px-3 py-1.5 text-xs font-medium hover:border-primary hover:text-primary sm:px-4"
                >
                  Засах
                </button>
                <form
                  action={deleteServiceAction}
                  onSubmit={(e) => {
                    if (!confirm(`"${s.name}"-г устгах уу?`)) e.preventDefault();
                  }}
                >
                  <input type="hidden" name="id" value={s.id} />
                  <button
                    type="submit"
                    className="rounded-full px-2 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50 sm:px-4"
                  >
                    Устгах
                  </button>
                </form>
              </div>
            </div>
          ),
        )}
      </div>
    </div>
  );
}

function ServiceFields({
  service,
  action,
  submitLabel,
  onCancel,
}: {
  service?: Service;
  action: (fd: FormData) => void | Promise<void>;
  submitLabel: string;
  onCancel?: () => void;
}) {
  // Үнэ болон хямдралын хувийг state-д барьж, доор шууд урьдчилан харуулна.
  // Үнийг мөрөөр хадгална — ингэснээр талбарыг бүрэн цэвэрлэж бичих боломжтой.
  const [priceText, setPriceText] = useState(service ? String(service.price) : "");
  const price = Number(priceText) || 0;
  const [onSale, setOnSale] = useState((service?.salePercent ?? 0) > 0);
  const [percent, setPercent] = useState(service?.salePercent || 20);

  return (
    <form action={action} className="mt-4 grid gap-4 sm:grid-cols-2">
      {service && <input type="hidden" name="id" value={service.id} />}
      <div className="sm:col-span-2">
        <span className="mb-1.5 block text-sm font-medium text-foreground">Зураг</span>
        <ImageField
          currentUrl={service?.imageUrl}
          fallbackEmoji={service?.emoji ?? "✨"}
          shape="wide"
          hint="Сайт дээр картын толгойд харагдана. JPG, PNG, WEBP · 5MB хүртэл"
        />
      </div>
      <L label="Нэр">
        <input name="name" required defaultValue={service?.name} className="field" />
      </L>
      <L label="Ангилал">
        <input
          name="category"
          defaultValue={service?.category}
          placeholder="Үс, Хумс, Арьс…"
          className="field"
        />
      </L>
      <L label="Тайлбар" full>
        <textarea
          name="description"
          rows={2}
          defaultValue={service?.description}
          className="field resize-none"
        />
      </L>
      <L label="Үнэ (₮)">
        <input
          name="price"
          type="number"
          min={0}
          required
          value={priceText}
          onChange={(e) => setPriceText(e.target.value)}
          className="field"
        />
      </L>
      <L label="Үргэлжлэх (мин)">
        <input
          name="durationMin"
          type="number"
          min={15}
          step={15}
          defaultValue={service?.durationMin ?? 60}
          className="field"
        />
      </L>
      <L label="Эможи (зураг байхгүй үед)">
        <input
          name="emoji"
          defaultValue={service?.emoji ?? "✨"}
          maxLength={4}
          className="field"
        />
      </L>
      <label className="flex items-center gap-2 self-end pb-3 text-sm text-foreground">
        <input
          type="checkbox"
          name="active"
          defaultChecked={service ? service.active : true}
          className="h-4 w-4 accent-[var(--primary)]"
        />
        Идэвхтэй (сайтад харагдана)
      </label>

      <SaleBox
        price={price}
        onSale={onSale}
        setOnSale={setOnSale}
        percent={percent}
        setPercent={setPercent}
      />

      <div className="col-span-full flex gap-2">
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

const QUICK_PERCENTS = [10, 15, 20, 30, 50];

/** Хямдрал тохируулах хэсэг — асаах/унтраах, хувь, шууд харагдах үр дүн. */
function SaleBox({
  price,
  onSale,
  setOnSale,
  percent,
  setPercent,
}: {
  price: number;
  onSale: boolean;
  setOnSale: (v: boolean) => void;
  percent: number;
  setPercent: (v: number) => void;
}) {
  const newPrice = effectivePrice({ price, salePercent: percent });
  const saved = price - newPrice;

  return (
    <div
      className={`col-span-full rounded-2xl border p-5 transition-colors ${
        onSale ? "border-rose-300 bg-rose-50/60" : "border-dashed border-border bg-surface-2/40"
      }`}
    >
      <label className="flex cursor-pointer items-center gap-3">
        <input
          type="checkbox"
          name="onSale"
          checked={onSale}
          onChange={(e) => setOnSale(e.target.checked)}
          className="h-4 w-4 accent-rose-500"
        />
        <span className="text-sm font-semibold text-foreground">
          🔥 Хямдралтай болгох
        </span>
        <span className="text-xs text-muted">
          {onSale ? "Сайт дээр хуучин үнэ нь зураастай харагдана" : "Одоогоор хямдралгүй"}
        </span>
      </label>

      {onSale && (
        <div className="mt-5 space-y-4">
          <div>
            <span className="mb-2 block text-sm font-medium text-foreground">
              Хэдэн хувиар хямдруулах вэ?
            </span>
            <div className="flex flex-wrap items-center gap-2">
              {QUICK_PERCENTS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPercent(p)}
                  className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                    percent === p
                      ? "bg-rose-500 text-white"
                      : "border border-border bg-surface hover:border-rose-300"
                  }`}
                >
                  {p}%
                </button>
              ))}
              <span className="ml-1 flex items-center gap-1.5 text-sm text-muted">
                эсвэл
                <input
                  name="salePercent"
                  type="number"
                  min={1}
                  max={90}
                  value={percent}
                  onChange={(e) => setPercent(Number(e.target.value) || 0)}
                  className="field w-20"
                />
                %
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 rounded-xl border border-rose-200 bg-surface p-4">
            <span className="text-sm text-muted">Үйлчлүүлэгчид харагдах үнэ:</span>
            <s className="text-sm text-muted">{formatPrice(price)}</s>
            <span className="font-display text-2xl font-semibold text-rose-600">
              {formatPrice(newPrice)}
            </span>
            {saved > 0 && (
              <span className="rounded-full bg-rose-100 px-3 py-1 text-xs font-medium text-rose-700">
                {formatPrice(saved)} хэмнэнэ
              </span>
            )}
          </div>
          <p className="text-xs text-muted">
            Хямдарсан үнийг ойролцоох 100₮ рүү дугуйрган тооцно.
          </p>
        </div>
      )}
    </div>
  );
}

function L({
  label,
  children,
  full,
}: {
  label: string;
  children: React.ReactNode;
  full?: boolean;
}) {
  return (
    <label className={`block ${full ? "sm:col-span-2" : ""}`}>
      <span className="mb-1.5 block text-sm font-medium text-foreground">{label}</span>
      {children}
    </label>
  );
}
