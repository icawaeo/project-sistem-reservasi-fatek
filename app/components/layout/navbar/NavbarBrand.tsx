import Link from "next/link";
import Image from "next/image";

import { brandSubtitleClassName, brandTitleClassName } from "./styles";

export default function NavbarBrand() {
  return (
    <div className="flex items-center gap-3 shrink-0">
      <Link href="/landingpage" aria-label="Ke halaman beranda">
        <Image
          src="/Logo_Fatek_Unsrat.png"
          alt="Logo Fakultas Teknik Unsrat"
          width={36}
          height={36}
          className="h-7 w-7 sm:h-8 sm:w-8 lg:h-9 lg:w-9 object-contain"
          priority
        />
      </Link>
      <div className="min-w-0">
        <div className={brandTitleClassName}>Fakultas Teknik</div>
        <div className={brandSubtitleClassName}>Universitas Sam Ratulangi</div>
      </div>
    </div>
  );
}
