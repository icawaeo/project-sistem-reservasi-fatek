export const SCROLL_PIN_THRESHOLD = 0;

export const navMenuClassName = "flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50/80 p-1";

export const linkBase = "rounded-full px-4 py-1.5 text-sm font-semibold tracking-tight transition-colors";
export const linkActive = "bg-slate-200 text-slate-900";
export const linkInactive = "text-slate-700 hover:bg-white hover:text-slate-900";

export const brandTitleClassName = "text-slate-900 font-bold text-xs sm:text-sm leading-tight";
export const brandSubtitleClassName = "text-slate-700 text-[10px] sm:text-[11px] leading-tight";

export const actionButtonClassName =
  "flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-50 transition-all";

export const loginButtonClassName =
  "flex items-center gap-1.5 rounded-full border border-slate-300 bg-white px-6 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-50 transition-all";

export const guideButtonClassName =
  "inline-flex items-center justify-center rounded-full bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-slate-800";

export const mobileItemBase =
  "block w-full text-left rounded-xl px-4 py-3 text-sm font-semibold tracking-tight transition-colors";
export const mobileItemActive = "bg-slate-100 text-slate-900";
export const mobileItemInactive = "text-slate-700 hover:bg-slate-50 hover:text-slate-900";

export const hamburgerButtonClassName =
  "inline-flex items-center justify-center rounded-full border border-slate-300 bg-white p-2 text-slate-900 hover:bg-slate-50 transition-all";

export const getHeaderClassName = (isScrolled: boolean) =>
  isScrolled
    ? "fixed left-0 right-0 z-50"
    : "fixed left-1/2 z-50 w-[calc(100%-2rem)] max-w-[1700px] -translate-x-1/2";

export const getSurfaceClassName = (isScrolled: boolean) =>
  isScrolled
    ? "mx-auto flex w-full items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6 py-3 text-slate-900 shadow-md backdrop-blur-xl backdrop-saturate-150"
    : "flex w-full items-center justify-between rounded-full bg-white px-4 sm:px-6 lg:px-8 py-3 text-slate-900 backdrop-blur-xl ring-1 ring-slate-200 shadow-lg";

export const getHeaderTopOffset = (isScrolled: boolean) => (isScrolled ? 0 : 24);
