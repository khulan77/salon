"use client";

import { useRef, useState } from "react";
import type { Location, Service, Staff } from "@/app/lib/types";
import {
  createStaffAction,
  deleteStaffAction,
  updateStaffAction,
} from "@/app/lib/actions";

function Avatar({
  imageUrl,
  emoji,
  className,
}: {
  imageUrl?: string;
  emoji: string;
  className: string;
}) {
  if (imageUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={imageUrl}
        alt=""
        className={`${className} object-cover`}
      />
    );
  }
  return (
    <span
      className={`${className} flex items-center justify-center bg-gradient-to-br from-primary-soft to-surface-2 text-2xl`}
    >
      {emoji}
    </span>
  );
}

function ImageField({
  currentUrl,
  fallbackEmoji,
}: {
  currentUrl?: string;
  fallbackEmoji: string;
}) {
  const [preview, setPreview] = useState<string | null>(null);
  const [removed, setRemoved] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const showUrl = preview ?? (removed ? undefined : currentUrl);

  return (
    <div className="flex items-center gap-4">
      <div className="h-20 w-20 shrink-0 overflow-hidden rounded-full border border-border">
        <Avatar imageUrl={showUrl} emoji={fallbackEmoji} className="h-20 w-20" />
      </div>
      <div className="flex flex-col gap-2">
        <input
          ref={inputRef}
          type="file"
          name="image"
          accept="image/png,image/jpeg,image/webp,image/gif"
          onChange={(e) => {
            const file = e.target.files?.[0];
            setPreview(file ? URL.createObjectURL(file) : null);
            if (file) setRemoved(false);
          }}
          className="block w-full text-sm text-muted file:mr-3 file:cursor-pointer file:rounded-full file:border-0 file:bg-primary-soft file:px-4 file:py-2 file:text-sm file:font-medium file:text-primary-hover"
        />
        {currentUrl && !preview && (
          <label className="flex items-center gap-2 text-xs text-muted">
            <input
              type="checkbox"
              name="removeImage"
              checked={removed}
              onChange={(e) => setRemoved(e.target.checked)}
              className="h-3.5 w-3.5 accent-[var(--primary)]"
            />
            Зургийг устгах (эможи руу буцна)
          </label>
        )}
        <p className="text-xs text-muted">JPG, PNG, WEBP · дээд тал нь 5MB</p>
      </div>
    </div>
  );
}

export default function StaffManager({
  staff,
  services,
  locations,
}: {
  staff: Staff[];
  services: Service[];
  locations: Location[];
}) {
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const locationName = (id?: string) =>
    locations.find((l) => l.id === id)?.name || (id ? "Тодорхойгүй салбар" : "");

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-semibold text-foreground">Мастерууд</h1>
          <p className="mt-1 text-muted">Нийт {staff.length} мастер.</p>
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

      {adding && (
        <div className="mt-6 rounded-2xl border border-border bg-surface p-6">
          <h2 className="font-display text-lg font-semibold text-foreground">Шинэ мастер</h2>
          <StaffFields
            services={services}
            locations={locations}
            action={async (fd) => {
              await createStaffAction(fd);
              setAdding(false);
            }}
            submitLabel="Хадгалах"
          />
        </div>
      )}

      <div className="mt-8 space-y-3">
        {staff.map((m) =>
          editingId === m.id ? (
            <div key={m.id} className="rounded-2xl border border-primary bg-surface p-6">
              <h2 className="font-display text-lg font-semibold text-foreground">
                Засах: {m.name}
              </h2>
              <StaffFields
                member={m}
                services={services}
                locations={locations}
                action={async (fd) => {
                  await updateStaffAction(fd);
                  setEditingId(null);
                }}
                submitLabel="Шинэчлэх"
                onCancel={() => setEditingId(null)}
              />
            </div>
          ) : (
            <div
              key={m.id}
              className="flex flex-wrap items-center gap-4 rounded-2xl border border-border bg-surface p-4"
            >
              <div className="h-12 w-12 shrink-0 overflow-hidden rounded-full">
                <Avatar imageUrl={m.imageUrl} emoji={m.emoji} className="h-12 w-12" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="truncate font-medium text-foreground">{m.name}</h3>
                  {!m.active && (
                    <span className="rounded-full bg-surface-2 px-2 py-0.5 text-xs text-muted">
                      Идэвхгүй
                    </span>
                  )}
                </div>
                <p className="truncate text-xs text-muted">
                  {m.title}
                  {locations.length > 0 && locationName(m.locationId) && (
                    <span className="ml-1">· 🏢 {locationName(m.locationId)}</span>
                  )}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setEditingId(m.id);
                    setAdding(false);
                  }}
                  className="rounded-full border border-border px-4 py-1.5 text-xs font-medium hover:border-primary hover:text-primary"
                >
                  Засах
                </button>
                <form
                  action={deleteStaffAction}
                  onSubmit={(e) => {
                    if (!confirm(`"${m.name}"-г устгах уу?`)) e.preventDefault();
                  }}
                >
                  <input type="hidden" name="id" value={m.id} />
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
    </div>
  );
}

function StaffFields({
  member,
  services,
  locations,
  action,
  submitLabel,
  onCancel,
}: {
  member?: Staff;
  services: Service[];
  locations: Location[];
  action: (fd: FormData) => void | Promise<void>;
  submitLabel: string;
  onCancel?: () => void;
}) {
  return (
    <form action={action} className="mt-4 grid gap-4 sm:grid-cols-2">
      {member && <input type="hidden" name="id" value={member.id} />}
      <div className="sm:col-span-2">
        <span className="mb-1.5 block text-sm font-medium text-foreground">Зураг</span>
        <ImageField currentUrl={member?.imageUrl} fallbackEmoji={member?.emoji ?? "💇‍♀️"} />
      </div>
      <L label="Нэр">
        <input name="name" required defaultValue={member?.name} className="ainput" />
      </L>
      <L label="Мэргэжил / албан тушаал">
        <input
          name="title"
          defaultValue={member?.title}
          placeholder="Ахлах стилист"
          className="ainput"
        />
      </L>
      <L label="Салбар">
        {locations.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border bg-background px-3.5 py-2.5 text-xs text-muted">
            Салбар нэмээгүй байна.{" "}
            <a href="/admin/locations" className="text-primary hover:underline">
              Салбарууд
            </a>{" "}
            хуудаснаас нэмнэ үү.
          </p>
        ) : (
          <select name="locationId" defaultValue={member?.locationId ?? ""} className="ainput">
            <option value="">— Бүх салбар —</option>
            {locations.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name || l.address || l.id}
              </option>
            ))}
          </select>
        )}
      </L>
      <L label="Танилцуулга" full>
        <textarea
          name="bio"
          rows={2}
          defaultValue={member?.bio}
          className="ainput resize-none"
        />
      </L>
      <L label="Эможи (зураг байхгүй үед)">
        <input
          name="emoji"
          defaultValue={member?.emoji ?? "💇‍♀️"}
          maxLength={4}
          className="ainput"
        />
      </L>
      <label className="flex items-center gap-2 self-end pb-3 text-sm text-foreground">
        <input
          type="checkbox"
          name="active"
          defaultChecked={member ? member.active : true}
          className="h-4 w-4 accent-[var(--primary)]"
        />
        Идэвхтэй (сайтад харагдана)
      </label>

      <fieldset className="rounded-xl border border-border bg-background p-4 sm:col-span-2">
        <legend className="px-1 text-sm font-medium text-foreground">
          Нэвтрэх эрх{" "}
          <span className="font-normal text-muted">(ажилтан өөрийн цагаа харах)</span>
        </legend>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1.5 block text-sm text-foreground">Имэйл</span>
            <input
              type="email"
              name="email"
              defaultValue={member?.email}
              placeholder="ajilChin@example.com"
              className="ainput"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm text-foreground">
              Нууц үг {member?.email ? "(солих бол)" : "(шинэ)"}
            </span>
            <input
              type="text"
              name="password"
              autoComplete="new-password"
              placeholder="Хоосон = өөрчлөхгүй"
              className="ainput"
            />
          </label>
        </div>
        <p className="mt-2 px-1 text-xs text-muted">
          Имэйл + нууц үг өгвөл тухайн ажилтанд нэвтрэх эрх үүснэ. Тэд{" "}
          <b>/login</b>-ээр нэвтэрч зөвхөн өөрийн захиалгаа харна.
        </p>
      </fieldset>

      <fieldset className="sm:col-span-2">
        <legend className="mb-2 text-sm font-medium text-foreground">
          Хийх үйлчилгээ{" "}
          <span className="font-normal text-muted">(хоосон = бүх үйлчилгээ)</span>
        </legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {services.map((s) => (
            <label
              key={s.id}
              className="flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2 text-sm"
            >
              <input
                type="checkbox"
                name="serviceIds"
                value={s.id}
                defaultChecked={member?.serviceIds.includes(s.id)}
                className="h-4 w-4 accent-[var(--primary)]"
              />
              <span className="text-foreground">
                {s.emoji} {s.name}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

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

      <style>{`
        .ainput {
          width: 100%;
          border-radius: 0.75rem;
          border: 1px solid var(--border);
          background: var(--background);
          padding: 0.625rem 0.875rem;
          font-size: 0.875rem;
          outline: none;
        }
        .ainput:focus {
          border-color: var(--primary);
          box-shadow: 0 0 0 3px rgba(217,167,173,0.35);
        }
      `}</style>
    </form>
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
