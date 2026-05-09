import { guideButtonClassName } from "./styles";

type NavbarGuideButtonProps = {
  onClick: () => void;
};

export default function NavbarGuideButton({ onClick }: NavbarGuideButtonProps) {
  return (
    <button type="button" className={guideButtonClassName} onClick={onClick}>
      Lihat Panduan
    </button>
  );
}
