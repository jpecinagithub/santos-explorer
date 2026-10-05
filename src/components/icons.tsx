import type { SVGProps, ReactElement } from "react";
import type { SaintTag } from "../types/saint";

type P = SVGProps<SVGSVGElement>;

/** Minimal geometric halo — the brand mark. */
export function HaloIcon(props: P) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="4.5" strokeWidth={1.2} opacity={0.55} />
    </svg>
  );
}

/** Thin-stroke icons for the saint categories. */
export function MartyrIcon(props: P) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} {...props}>
      <path d="M12 3c1 3-2 4.5-2 7a4.5 4.5 0 0 0 9 .5C19 7 14.5 5 12 3Z" strokeLinejoin="round" />
      <path d="M12 21c-3.5 0-6-2.6-6-6" strokeLinecap="round" />
    </svg>
  );
}

export function DoctorIcon(props: P) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} {...props}>
      <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5Z" strokeLinejoin="round" />
      <path d="M4 20.5V5.5M20 18v3H6.5" strokeLinecap="round" />
      <path d="M9 8h7M9 11.5h5" strokeLinecap="round" />
    </svg>
  );
}

export function PopeIcon(props: P) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} {...props}>
      <circle cx="8.5" cy="12" r="4.5" />
      <circle cx="15.5" cy="12" r="4.5" />
      <path d="M8.5 16.5V20m7-3.5V20" strokeLinecap="round" />
    </svg>
  );
}

export function ApostleIcon(props: P) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 3.5v17M3.5 12h17" strokeLinecap="round" opacity={0.6} />
      <circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function EvangelistIcon(props: P) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} {...props}>
      <path d="M6 3h9l4 4v14H6Z" strokeLinejoin="round" />
      <path d="M15 3v4h4M9 12h7M9 15.5h7" strokeLinecap="round" />
    </svg>
  );
}

export function FounderIcon(props: P) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} {...props}>
      <path d="M12 3v10m0 0-5-5m5 5 5-5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6" strokeLinecap="round" />
    </svg>
  );
}

export function MysticIcon(props: P) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} {...props}>
      <path d="M12 3v4M12 17v4M3 12h4M17 12h4" strokeLinecap="round" />
      <circle cx="12" cy="12" r="2.2" />
    </svg>
  );
}

export function MissionaryIcon(props: P) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M3.5 12h17M12 3.5c2.5 2.3 3.8 5.2 3.8 8.5s-1.3 6.2-3.8 8.5c-2.5-2.3-3.8-5.2-3.8-8.5S9.5 5.8 12 3.5Z" strokeLinejoin="round" />
    </svg>
  );
}

export function VirginIcon(props: P) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} {...props}>
      <path d="M12 3c-4 3-6 6.5-6 10a6 6 0 0 0 12 0c0-3.5-2-7-6-10Z" strokeLinejoin="round" />
      <path d="M12 8v6" strokeLinecap="round" opacity={0.6} />
    </svg>
  );
}

export function HermitIcon(props: P) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} {...props}>
      <path d="M4 20 12 5l8 15" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9 13h6" strokeLinecap="round" />
    </svg>
  );
}

export function TheologianIcon(props: P) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M9.5 9.5a2.5 2.5 0 1 1 3.4 2.3c-.8.4-.9 1-.9 1.7" strokeLinecap="round" />
      <circle cx="12" cy="16.8" r="1.1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export const TAG_ICONS: Record<SaintTag, (p: P) => ReactElement> = {
  martir: MartyrIcon,
  doctor: DoctorIcon,
  papa: PopeIcon,
  apostol: ApostleIcon,
  evangelista: EvangelistIcon,
  fundador: FounderIcon,
  mistico: MysticIcon,
  misionero: MissionaryIcon,
  virgen: VirginIcon,
  ermitano: HermitIcon,
  teologo: TheologianIcon,
};

export function SearchIcon(props: P) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} {...props}>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.8-3.8" strokeLinecap="round" />
    </svg>
  );
}

export function CloseIcon(props: P) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} {...props}>
      <path d="M6 6l12 12M18 6 6 18" strokeLinecap="round" />
    </svg>
  );
}

export function DiceIcon(props: P) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} {...props}>
      <rect x="3.5" y="3.5" width="17" height="17" rx="4" />
      <circle cx="8.5" cy="8.5" r="1.3" fill="currentColor" stroke="none" />
      <circle cx="15.5" cy="15.5" r="1.3" fill="currentColor" stroke="none" />
      <circle cx="15.5" cy="8.5" r="1.3" fill="currentColor" stroke="none" />
      <circle cx="8.5" cy="15.5" r="1.3" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function ArrowRightIcon(props: P) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} {...props}>
      <path d="M4 12h15m-6-7 7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function ExternalIcon(props: P) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} {...props}>
      <path d="M14 4h6v6M20 4 11 13" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M19 13v6a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h6" strokeLinecap="round" />
    </svg>
  );
}

export function MenuIcon(props: P) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} {...props}>
      <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
    </svg>
  );
}

export function FilterIcon(props: P) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} {...props}>
      <path d="M4 5h16l-6 8v5l-4 2v-7L4 5Z" strokeLinejoin="round" />
    </svg>
  );
}
