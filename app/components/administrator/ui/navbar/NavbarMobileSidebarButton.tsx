type NavbarMobileSidebarButtonProps = {
  onClick: () => void;
};

export default function NavbarMobileSidebarButton({ onClick }: NavbarMobileSidebarButtonProps) {
  return (
    <button
      type="button"
      className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-600 lg:hidden"
      aria-label="Buka menu"
      onClick={onClick}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M3 6h18M3 12h18M3 18h18"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}
