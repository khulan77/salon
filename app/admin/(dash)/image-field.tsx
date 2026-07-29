"use client";

import { useRef, useState } from "react";

/**
 * Зураг оруулах талбар — мастер, үйлчилгээ, нүүр хуудасны hero зурагт хамт
 * ашиглана. Сонгосон файлыг шууд урьдчилан харуулж, "устгах" тэмдэглэснээр
 * эможи дүрслэл рүү буцаана.
 */
export default function ImageField({
  currentUrl,
  fallbackEmoji,
  name = "image",
  removeName = "removeImage",
  shape = "circle",
  hint,
}: {
  currentUrl?: string;
  fallbackEmoji: string;
  name?: string;
  removeName?: string;
  shape?: "circle" | "wide";
  hint?: string;
}) {
  const [preview, setPreview] = useState<string | null>(null);
  const [removed, setRemoved] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const showUrl = preview ?? (removed ? undefined : currentUrl);
  const box =
    shape === "circle" ? "h-20 w-20 rounded-full" : "h-24 w-40 rounded-2xl";

  return (
    <div className="flex items-center gap-4">
      <div className={`${box} shrink-0 overflow-hidden border border-border`}>
        {showUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={showUrl} alt="" className={`${box} object-cover`} />
        ) : (
          <span
            className={`${box} flex items-center justify-center bg-gradient-to-br from-primary-soft to-surface-2 text-2xl`}
          >
            {fallbackEmoji}
          </span>
        )}
      </div>
      <div className="flex flex-col gap-2">
        <input
          ref={inputRef}
          type="file"
          name={name}
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
              name={removeName}
              checked={removed}
              onChange={(e) => setRemoved(e.target.checked)}
              className="h-3.5 w-3.5 accent-[var(--primary)]"
            />
            Зургийг устгах
          </label>
        )}
        <p className="text-xs text-muted">
          {hint ?? "JPG, PNG, WEBP · дээд тал нь 5MB"}
        </p>
      </div>
    </div>
  );
}
