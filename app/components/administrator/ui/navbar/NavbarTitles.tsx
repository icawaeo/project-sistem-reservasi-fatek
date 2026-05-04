type NavbarTitlesProps = {
  title: string;
  subtitle: string;
};

export default function NavbarTitles({ title, subtitle }: NavbarTitlesProps) {
  return (
    <div className="min-w-0">
      <h1 className="truncate text-sm font-bold text-slate-900 sm:text-base lg:text-lg">{title}</h1>
      <p className="truncate text-[11px] leading-tight text-slate-500 sm:text-xs">{subtitle}</p>
    </div>
  );
}
