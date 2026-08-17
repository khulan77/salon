"use client";

/**
 * Баталгаажуулалт асуудаг форм. Server Component дотроос устгах зэрэг эргэж
 * буцаах боломжгүй үйлдэл хийхэд ашиглана — server action-ыг шууд дамжуулна.
 */
export default function ConfirmForm({
  action,
  message,
  className,
  children,
}: {
  action: (formData: FormData) => void | Promise<void>;
  message: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <form
      action={action}
      className={className}
      onSubmit={(e) => {
        if (!confirm(message)) e.preventDefault();
      }}
    >
      {children}
    </form>
  );
}
