import { Children } from "react";


export default function ScrollRow({
  children,
  itemWidth = "w-[64vw] max-w-[17rem]",
  cols = "sm:grid-cols-2 lg:grid-cols-3",
}: {
  children: React.ReactNode;
  itemWidth?: string;
  cols?: string;
}) {
  return (
    <div
      className={`no-scrollbar -mx-5 flex snap-x snap-mandatory gap-5 overflow-x-auto px-5 pb-1 sm:mx-0 sm:grid sm:gap-x-6 sm:gap-y-10 sm:overflow-visible sm:px-0 ${cols}`}
    >
      {Children.map(children, (child) => (
        <div className={`${itemWidth} shrink-0 snap-start sm:w-auto sm:max-w-none`}>
          {child}
        </div>
      ))}
    </div>
  );
}
