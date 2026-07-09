"use client";

import { useState } from "react";
import type { Review } from "@/app/lib/types";
import {
  createReviewAction,
  deleteReviewAction,
  updateReviewAction,
} from "@/app/lib/actions";

function Stars({ n }: { n: number }) {
  return (
    <span className="text-accent" aria-label={`${n} од`}>
      {"★".repeat(n)}
      <span className="text-border">{"★".repeat(5 - n)}</span>
    </span>
  );
}

export default function ReviewManager({ reviews }: { reviews: Review[] }) {
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-semibold text-foreground">Сэтгэгдэл</h1>
          <p className="mt-1 text-muted">
            Идэвхтэй сэтгэгдэл нүүр хуудсанд харагдана. Нийт {reviews.length}.
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

      {adding && (
        <div className="mt-6 rounded-2xl border border-border bg-surface p-6">
          <h2 className="font-display text-lg font-semibold text-foreground">Шинэ сэтгэгдэл</h2>
          <ReviewFields
            action={async (fd) => {
              await createReviewAction(fd);
              setAdding(false);
            }}
            submitLabel="Хадгалах"
          />
        </div>
      )}

      <div className="mt-8 space-y-3">
        {reviews.map((r) =>
          editingId === r.id ? (
            <div key={r.id} className="rounded-2xl border border-primary bg-surface p-6">
              <h2 className="font-display text-lg font-semibold text-foreground">Засах</h2>
              <ReviewFields
                review={r}
                action={async (fd) => {
                  await updateReviewAction(fd);
                  setEditingId(null);
                }}
                submitLabel="Шинэчлэх"
                onCancel={() => setEditingId(null)}
              />
            </div>
          ) : (
            <div key={r.id} className="rounded-2xl border border-border bg-surface p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-foreground">{r.customerName}</h3>
                    <Stars n={r.rating} />
                    {!r.active && (
                      <span className="rounded-full bg-surface-2 px-2 py-0.5 text-xs text-muted">
                        Нуусан
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-muted">{r.text}</p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingId(r.id);
                      setAdding(false);
                    }}
                    className="rounded-full border border-border px-4 py-1.5 text-xs font-medium hover:border-primary hover:text-primary"
                  >
                    Засах
                  </button>
                  <form
                    action={deleteReviewAction}
                    onSubmit={(e) => {
                      if (!confirm("Энэ сэтгэгдлийг устгах уу?")) e.preventDefault();
                    }}
                  >
                    <input type="hidden" name="id" value={r.id} />
                    <button
                      type="submit"
                      className="rounded-full px-4 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50"
                    >
                      Устгах
                    </button>
                  </form>
                </div>
              </div>
            </div>
          ),
        )}
        {reviews.length === 0 && !adding && (
          <p className="rounded-2xl border border-border bg-surface p-8 text-center text-muted">
            Одоогоор сэтгэгдэл алга байна.
          </p>
        )}
      </div>
    </div>
  );
}

function ReviewFields({
  review,
  action,
  submitLabel,
  onCancel,
}: {
  review?: Review;
  action: (fd: FormData) => void | Promise<void>;
  submitLabel: string;
  onCancel?: () => void;
}) {
  return (
    <form action={action} className="mt-4 grid gap-4 sm:grid-cols-2">
      {review && <input type="hidden" name="id" value={review.id} />}
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-foreground">Нэр</span>
        <input
          name="customerName"
          required
          defaultValue={review?.customerName}
          className="rinput"
        />
      </label>
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-foreground">Үнэлгээ</span>
        <select name="rating" defaultValue={review?.rating ?? 5} className="rinput">
          {[5, 4, 3, 2, 1].map((n) => (
            <option key={n} value={n}>
              {"★".repeat(n)} ({n})
            </option>
          ))}
        </select>
      </label>
      <label className="block sm:col-span-2">
        <span className="mb-1.5 block text-sm font-medium text-foreground">Сэтгэгдэл</span>
        <textarea
          name="text"
          rows={3}
          required
          defaultValue={review?.text}
          className="rinput resize-none"
        />
      </label>
      <label className="flex items-center gap-2 text-sm text-foreground">
        <input
          type="checkbox"
          name="active"
          defaultChecked={review ? review.active : true}
          className="h-4 w-4 accent-[var(--primary)]"
        />
        Нүүр хуудсанд харуулах
      </label>

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
        .rinput {
          width: 100%;
          border-radius: 0.75rem;
          border: 1px solid var(--border);
          background: var(--background);
          padding: 0.625rem 0.875rem;
          font-size: 0.875rem;
          outline: none;
        }
        .rinput:focus {
          border-color: var(--primary);
          box-shadow: 0 0 0 3px rgba(217,167,173,0.35);
        }
      `}</style>
    </form>
  );
}
