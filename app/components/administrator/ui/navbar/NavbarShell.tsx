type NavbarShellProps = {
  children: React.ReactNode;
};

export default function NavbarShell({ children }: NavbarShellProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 px-4 py-6 backdrop-blur supports-backdrop-filter:bg-white/85 lg:px-7 lg:py-4">
      {children}
    </header>
  );
}
