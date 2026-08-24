import Link from "next/link";
import type { Service, Staff } from "@/app/lib/types";

/**
 * Мастерын карт — хүрээтэй цагаан хайрцаг ашиглахгүй: зураг өөрөө хэлбэрээ
 * барина. Ингэснээр утсан дээр хоёр баганаар нягт багтаж, урт цуваа үүсэхгүй.
 * Бүтэн карт нь холбоос тул хаана ч дарахад тухайн мастерын захиалга руу ороно.
 *
 * Зураг нь бүх дэлгэцэд энгийн дөрвөлжин (1:1), булан нь бараг мэдэгдэхгүй.
 * Өмнө нь арк (бөмбөгөр) хэлбэртэй байсан нь хэт өндөр, хоосон талбайтай
 * харагддаг байв.
 */
export default function StaffCard({
  staff,
  services,
}: {
  staff: Staff;
  services: Service[];
}) {
  const specialties =
    staff.serviceIds.length === 0
      ? ["Бүх үйлчилгээ"]
      : services
          .filter((s) => staff.serviceIds.includes(s.id))
          .map((s) => s.name);

  return (
    <Link href={`/book?staff=${staff.id}`} className="group flex h-full flex-col">
      <div className="relative aspect-square overflow-hidden rounded-xl bg-surface-2">
        {staff.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={staff.imageUrl}
            alt={staff.name}
            /* Хөрөг тул нүүр таслагдахгүйн тулд зургийн дээд хэсгийг барина. */
            className="h-full w-full object-cover object-[center_25%] transition-transform duration-700 ease-out group-hover:scale-[1.06]"
          />
        ) : (
          <span className="flex h-full w-full items-center justify-center bg-gradient-to-b from-primary-soft to-surface-2 text-5xl transition-transform duration-700 ease-out group-hover:scale-[1.06] sm:text-6xl">
            {staff.emoji}
          </span>
        )}
      </div>

      <div className="mt-4 flex flex-1 flex-col px-0.5">
        <p className="truncate text-[0.6rem] font-medium uppercase tracking-[0.18em] text-primary sm:text-[0.66rem]">
          {staff.title}
        </p>
        <h3 className="mt-1.5 font-display text-lg leading-snug text-foreground transition-colors group-hover:text-primary sm:text-xl">
          {staff.name}
        </h3>
        {staff.bio && (
          <p className="mt-1.5 hidden text-sm leading-6 text-muted sm:line-clamp-2">
            {staff.bio}
          </p>
        )}

        {/*
          Нарийн карт дээр бүх мэргэжлийг жагсаавал үг дундуураа тасардаг тул
          нэгийг нь бүтнээр, үлдсэнийг "+N" гэж товчилно.

          `mt-auto` — танилцуулга нь мастер бүрт өөр өөр урттай тул үүнгүйгээр
          сумны товч эгнээ бүрт өөр өндөрт унжиж, эмх замбараагүй харагдана.
        */}
        <div className="mt-auto flex items-center gap-2 pt-3">
          <span className="min-w-0 flex-1 truncate text-xs text-muted">
            <span className="sm:hidden">
              {specialties[0]}
              {specialties.length > 1 && ` +${specialties.length - 1}`}
            </span>
            <span className="hidden sm:inline">
              {specialties.slice(0, 3).join(" · ")}
            </span>
          </span>
          <span
            aria-hidden
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-soft text-sm text-primary transition-colors group-hover:bg-primary group-hover:text-white"
          >
            →
          </span>
        </div>
      </div>
    </Link>
  );
}
