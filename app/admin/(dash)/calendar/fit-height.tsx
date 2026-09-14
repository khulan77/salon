"use client";

import { useEffect, useRef, useState } from "react";

/*
  Өдрийн торыг дэлгэцийн доод ирмэг хүртэл сунгана — ажлын бүх цаг доош
  гүйлгэлгүйгээр нэг дэлгэцэнд багтана. Дээрх толгойн өндөр салбар, сонголт,
  цуцлагдсан түүх нээгдсэн эсэхээс хамаарч өөрчлөгддөг тул CSS-ээр тааварлахын
  оронд бодитоор хэмжинэ. Дэлгэц хэт намхан бол `minHeight`-ээс доош шахахгүй.
*/
export default function FitHeight({
  minHeight,
  reserve,
  className,
  children,
}: {
  minHeight: number;
  /** Торын доор үлдээх зай — тайлбар, өдрийн нийт дүнгийн мөр. */
  reserve: number;
  className?: string;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number>();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const fit = () => {
      const top = el.getBoundingClientRect().top + window.scrollY;
      setHeight(Math.max(minHeight, Math.floor(window.innerHeight - top - reserve)));
    };
    fit();
    window.addEventListener("resize", fit);
    const observer = new ResizeObserver(fit);
    observer.observe(document.body);
    return () => {
      window.removeEventListener("resize", fit);
      observer.disconnect();
    };
  }, [minHeight, reserve]);

  return (
    <div
      ref={ref}
      className={className}
      // Хэмжихээс өмнө ойролцоо өндөр — ачаалах үед хэт үсрэхгүй.
      style={{ height: height ?? `max(${minHeight}px, calc(100dvh - 22rem))` }}
    >
      {children}
    </div>
  );
}
