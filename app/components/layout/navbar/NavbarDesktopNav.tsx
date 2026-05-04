import Link from "next/link";

import { linkActive, linkBase, linkInactive, navMenuClassName } from "./styles";

type NavbarDesktopNavProps = {
  isHomeActive: boolean;
  isHistoryActive: boolean;
};

export default function NavbarDesktopNav({ isHomeActive, isHistoryActive }: NavbarDesktopNavProps) {
  return (
    <div className="hidden lg:flex flex-1 justify-center px-4">
      <nav className={navMenuClassName}>
        <Link href="/landingpage" className={`${linkBase} ${isHomeActive ? linkActive : linkInactive}`}>
          Beranda
        </Link>

        <Link href="/riwayat" className={`${linkBase} ${isHistoryActive ? linkActive : linkInactive}`}>
          Riwayat
        </Link>
      </nav>
    </div>
  );
}
