import { Children } from "react";


export default function ScrollRow({
  children,
  itemWidth = "w-[clamp(14rem,72vw,17rem)]",
  cols = "sm:grid-cols-2 lg:grid-cols-3",
}: {
  children: React.ReactNode;
  itemWidth?: string;
  cols?: string;
}) {
  return (
    <div
      className={`no-scrollbar -mx-5 flex snap-x snap-proximity gap-5 overflow-x-auto overscroll-x-contain px-5 pb-4 [scroll-padding-inline:1.25rem] touch-pan-x sm:mx-0 sm:grid sm:gap-x-6 sm:gap-y-10 sm:overflow-visible sm:px-0 sm:pb-1 ${cols}`}
    >
      {Children.map(children, (child) => (
        <div className={`${itemWidth} shrink-0 snap-start sm:w-auto sm:max-w-none`}>
          {child}
        </div>
      ))}
    </div>
  );
}
