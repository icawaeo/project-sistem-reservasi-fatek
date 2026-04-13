import Navbar from "@/app/components/layout/Navbar";

type LandingNavbarProps = {
  active?: "home";
};

export default function LandingNavbar(_props: LandingNavbarProps) {
  return <Navbar />;
}
