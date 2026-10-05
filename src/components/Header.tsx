import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { HaloIcon, SearchIcon, MenuIcon, CloseIcon } from "./icons";
import { trackEvent } from "../lib/analytics";

export default function Header() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);

  const nav = [
    { to: "/explorar", label: t("nav.explore") },
    { to: "/categorias", label: t("nav.tags") },
    { to: "/ordenes", label: t("nav.orders") },
    { to: "/siglos", label: t("nav.centuries") },
    { to: "/estadisticas", label: t("nav.statistics") },
  ];

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!q.trim()) return;
    trackEvent("search_performed", { query: q.trim().slice(0, 60) });
    navigate(`/explorar?q=${encodeURIComponent(q.trim())}`);
    setMenuOpen(false);
  };

  const linkCls = ({ isActive }: { isActive: boolean }) =>
    `px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
      isActive ? "text-accent-deep bg-accent-soft" : "text-ink-soft hover:text-ink hover:bg-black/5"
    }`;

  return (
    <header className="sticky top-0 z-40 bg-paper/90 backdrop-blur border-b border-line">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex items-center gap-3 h-16">
          <Link to="/" className="flex items-center gap-2.5 shrink-0" aria-label="Vidas de Santos">
            <span className="text-accent-deep">
              <HaloIcon className="w-8 h-8" />
            </span>
            <span className="text-xl font-bold tracking-tight hidden xs:block sm:block">
              Vidas de Santos
            </span>
          </Link>

          <nav className="hidden lg:flex items-center gap-1 ml-4" aria-label="Primary">
            {nav.map((n) => (
              <NavLink key={n.to} to={n.to} className={linkCls}>
                {n.label}
              </NavLink>
            ))}
          </nav>

          <form onSubmit={submit} className="hidden md:flex items-center ml-auto" role="search">
            <div className="relative">
              <SearchIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={t("nav.searchPlaceholder")}
                aria-label={t("common.search")}
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck={false}
                enterKeyHint="search"
                className="w-48 focus:w-64 transition-all text-sm bg-white border border-line rounded-full pl-9 pr-3 py-2 placeholder:text-muted/70 focus:border-accent focus:outline-none"
              />
            </div>
          </form>

          <div className="ml-auto md:ml-0" />

          <button
            className="lg:hidden p-2 -mr-2 text-ink-soft"
            onClick={() => setMenuOpen((v) => !v)}
            aria-expanded={menuOpen}
            aria-label={t("nav.menu")}
          >
            {menuOpen ? <CloseIcon className="w-6 h-6" /> : <MenuIcon className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="lg:hidden border-t border-line bg-paper px-4 py-3">
          <form onSubmit={submit} className="md:hidden mb-2" role="search">
            <div className="relative">
              <SearchIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={t("nav.searchPlaceholder")}
                aria-label={t("common.search")}
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck={false}
                enterKeyHint="search"
                className="w-full text-sm bg-white border border-line rounded-full pl-9 pr-3 py-2.5 placeholder:text-muted/70 focus:border-accent focus:outline-none"
              />
            </div>
          </form>
          <nav className="flex flex-col" aria-label="Mobile">
            {nav.map((n) => (
              <NavLink key={n.to} to={n.to} className={linkCls} onClick={() => setMenuOpen(false)}>
                {n.label}
              </NavLink>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
