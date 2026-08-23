/**
 * Хөл болон холбоо барих хэсгийн жижиг дүрсүүд. Эможи нь төхөөрөмж бүр дээр
 * өөр өөрөөр дүрслэгддэг, суурь шугамдаа тэгширдэггүй тул нэг иж бүрдэл
 * SVG ашиглана. Бүгд currentColor-оор будагдана.
 */
const base = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.7,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

type Props = { className?: string };

export function PinIcon({ className }: Props) {
  return (
    <svg {...base} className={className}>
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 1 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

export function PhoneIcon({ className }: Props) {
  return (
    <svg {...base} className={className}>
      <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2Z" />
    </svg>
  );
}

export function MailIcon({ className }: Props) {
  return (
    <svg {...base} className={className}>
      <rect x="2" y="4.5" width="20" height="15" rx="2.5" />
      <path d="m2.5 7.5 9.5 6 9.5-6" />
    </svg>
  );
}

export function ClockIcon({ className }: Props) {
  return (
    <svg {...base} className={className}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5.2l3.2 1.9" />
    </svg>
  );
}

export function BranchIcon({ className }: Props) {
  return (
    <svg {...base} className={className}>
      <path d="M3 21h18M5 21V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v16M15 21V10h4a2 2 0 0 1 2 2v9" />
      <path d="M9 7.5h2M9 11.5h2M9 15.5h2" />
    </svg>
  );
}
