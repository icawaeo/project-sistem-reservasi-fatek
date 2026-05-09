import { hamburgerButtonClassName } from "./styles";
import type { RefObject } from "react";

type NavbarHamburgerButtonProps = {
  isMobileMenuOpen: boolean;
  buttonRef: RefObject<HTMLButtonElement | null>;
  onClick: () => void;
};

export default function NavbarHamburgerButton({
  isMobileMenuOpen,
  buttonRef,
  onClick,
}: NavbarHamburgerButtonProps) {
  return (
    <div className="lg:hidden flex items-center gap-2 shrink-0">
      <button
        ref={buttonRef}
        type="button"
        className={hamburgerButtonClassName}
        aria-label={isMobileMenuOpen ? "Tutup menu" : "Buka menu"}
        aria-expanded={isMobileMenuOpen}
        aria-controls="mobile-menu"
        onClick={onClick}
      >
        <span className="sr-only">Menu</span>
        <span className="relative block h-4 w-4">
          <span
            className={`absolute left-0 right-0 top-0.5 h-0.5 rounded bg-slate-900 transition-transform duration-200 ${
              isMobileMenuOpen ? "translate-y-1.5 rotate-45" : ""
            }`}
          />
          <span
            className={`absolute left-0 right-0 top-1/2 h-0.5 -translate-y-1/2 rounded bg-slate-900 transition-opacity duration-200 ${
              isMobileMenuOpen ? "opacity-0" : "opacity-100"
            }`}
          />
          <span
            className={`absolute left-0 right-0 bottom-0.5 h-0.5 rounded bg-slate-900 transition-transform duration-200 ${
              isMobileMenuOpen ? "-translate-y-1.5 -rotate-45" : ""
            }`}
          />
        </span>
      </button>
    </div>
  );
}
