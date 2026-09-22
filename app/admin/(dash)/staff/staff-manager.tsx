"use client";

import { useState } from "react";
import type { Location, Service, Staff } from "@/app/lib/types";
import {
  createStaffAction,
  deleteStaffAction,
  updateStaffAction,
} from "@/app/lib/actions";
import ImageField from "../image-field";

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
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={imageUrl} alt="" className={`${className} object-cover`} />
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

const WEEKDAYS = ["Ня", "Да", "Мя", "Лх", "Пү", "Ба", "Бя"];

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? parts[0]?.[1] ?? "")).toUpperCase();
}

function avatarColor(id: string): string {
  const colors = ["#bf7588", "#69a99d", "#8d79aa", "#c59a51", "#77a1bf", "#ad8198"];
  return colors[[...id].reduce((sum, char) => sum + char.charCodeAt(0), 0) % colors.length];
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
  const groups = [
    ...locations.map((location) => ({
      location,
      members: staff.filter((member) => member.locationId === location.id),
    })),
    {
      location: undefined,
      members: staff.filter((member) => !member.locationId),
    },
  ].filter((group) => group.members.length > 0 || Boolean(group.location));

  return (
    <div>
      <div className="flex items-center justify-between border-b border-border/60 pb-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-foreground">Ажилтан ба хуваарь</h1>
          <p className="mt-1 text-sm text-muted">{staff.length} ажилтан · {locations.length} салбар</p>
        </div>
        <button
          type="button"
          onClick={() => {
            setAdding((v) => !v);
            setEditingId(null);
          }}
          className="rounded-xl bg-[#31533f] px-5 py-3 text-sm font-medium text-white shadow-sm hover:bg-[#294735]"
        >
          {adding ? "Болих" : "+ Ажилтан нэмэх"}
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

      <div className="mt-7 space-y-8">
        {groups.map(({ location, members }) => (
          <section key={location?.id ?? "all"}>
            <div className="mb-3 flex items-center justify-between gap-4">
              <h2 className="font-display text-lg font-semibold text-foreground">
                {location?.name || "Бүх салбар"}
                {location && <span className="ml-2 font-sans text-sm font-normal text-muted">{location.openTime}–{location.closeTime}</span>}
              </h2>
              <button type="button" onClick={() => { setAdding(true); setEditingId(null); }} className="text-sm font-medium text-[#31533f]">+ Ажилтан</button>
            </div>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {members.length === 0 && (
          <button
            type="button"
            onClick={() => { setAdding(true); setEditingId(null); }}
            className="min-h-28 rounded-2xl border border-dashed border-border bg-surface/40 text-sm text-muted hover:border-[#31533f] hover:text-[#31533f] md:col-span-2 xl:col-span-3"
          >
            + Энэ салбарт ажилтан нэмэх
          </button>
        )}
        {members.map((m) =>
          editingId === m.id ? (
            <div key={m.id} className="rounded-2xl border border-primary bg-surface p-6 md:col-span-2 xl:col-span-3">
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
            <article key={m.id} className="rounded-2xl border border-border bg-surface p-4">
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 shrink-0 overflow-hidden rounded-full">
                  {m.imageUrl ? <Avatar imageUrl={m.imageUrl} emoji={m.emoji} className="h-11 w-11" /> : <span style={{ backgroundColor: avatarColor(m.id) }} className="flex h-11 w-11 items-center justify-center rounded-full text-xs font-semibold text-white">{initials(m.name)}</span>}
                </div>
                <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="truncate text-base font-semibold text-foreground">{m.name}</h3>
                  {!m.active && (
                    <span className="rounded-full bg-surface-2 px-2 py-0.5 text-xs text-muted">
                      Идэвхгүй
                    </span>
                  )}
                </div>
                <p className="truncate text-xs text-muted">
                  {m.title || "Мастер"}{m.email && <span> · {m.email}</span>}
                </p>
              </div>
              </div>

              <div className="mt-4 grid grid-cols-7 gap-1 text-center">
                {WEEKDAYS.map((day, index) => {
                  const closed = location?.closedDays.includes(index);
                  return <div key={day} className="min-w-0"><span className="block text-[10px] text-muted">{day}</span><span className={`mt-1 block truncate rounded-md px-1 py-1 text-[10px] ${closed ? "bg-background text-border" : "bg-[#f1f4f1] text-[#31533f]"}`}>{closed ? "—" : location?.openTime || "10:00"}</span></div>;
                })}
              </div>

              <div className="mt-4 flex items-center gap-4 border-t border-border/60 pt-3 text-sm">
                <button
                  type="button"
                  onClick={() => {
                    setEditingId(m.id);
                    setAdding(false);
                  }}
                  className="text-muted hover:text-foreground"
                >
                  Засах
                </button>
                <button type="button" onClick={() => setEditingId(m.id)} className="text-muted hover:text-foreground">Чөлөө</button>
                <button type="button" onClick={() => setEditingId(m.id)} className="text-muted hover:text-foreground">Идэвхгүй</button>
                <form
                  action={deleteStaffAction}
                  onSubmit={(e) => {
                    if (!confirm(`"${m.name}"-г устгах уу?`)) e.preventDefault();
                  }}
                >
                  <input type="hidden" name="id" value={m.id} />
                  <button
                    type="submit"
                    className="ml-auto text-rose-600 hover:text-rose-700"
                  >
                    Устгах
                  </button>
                </form>
              </div>
            </article>
          ),
        )}
            </div>
          </section>
        ))}
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
        <input name="name" required defaultValue={member?.name} className="field" />
      </L>
      <L label="Мэргэжил / албан тушаал">
        <input
          name="title"
          defaultValue={member?.title}
          placeholder="Ахлах стилист"
          className="field"
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
          <select name="locationId" defaultValue={member?.locationId ?? ""} className="field">
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
          className="field resize-none"
        />
      </L>
      <L label="Эможи (зураг байхгүй үед)">
        <input
          name="emoji"
          defaultValue={member?.emoji ?? "💇‍♀️"}
          maxLength={4}
          className="field"
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
              className="field"
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
              className="field"
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
