import { ToastProvider } from "@/app/components/ui/toast";

export default function AdministratorLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return <ToastProvider>{children}</ToastProvider>;
}
