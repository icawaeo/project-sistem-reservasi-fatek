import { Bell } from "lucide-react";

type NavbarNotificationButtonProps = {
  onClick?: () => void;
  unreadCount?: number;
};

export default function NavbarNotificationButton({ onClick, unreadCount = 0 }: NavbarNotificationButtonProps) {
  return (
    <button
      onClick={onClick}
      className="relative p-2 rounded hover:bg-gray-100 focus:outline-none"
      aria-label="Notifications"
    >
      <Bell className="h-4 w-4" />
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-2 flex h-3 w-3 items-center justify-center text-xs font-bold bg-red-500 text-white rounded-full">
          {unreadCount}
        </span>
      )}
    </button>
  );
}
