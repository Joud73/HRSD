import { useNavigate } from "react-router-dom";
import { ChevronDown, LogOut, type LucideIcon } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { copy } from "@/lib/copy";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface UserMenuItem {
  label: string;
  to: string;
  icon: LucideIcon;
}

interface UserDropdownProps {
  name: string;
  items: UserMenuItem[];
  /** Where to send the user after sign-out */
  logoutRedirect?: string;
}

/** Account menu shared by AppHeader and AppShell. */
const UserDropdown = ({ name, items, logoutRedirect = "/" }: UserDropdownProps) => {
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
    navigate(logoutRedirect, { replace: true });
  };

  return (
    <DropdownMenu dir="rtl" modal={false}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="group flex h-10 max-w-[220px] items-center gap-2 rounded-md border border-border bg-background ps-2 pe-3 text-small text-foreground transition-colors duration-micro ease-standard hover:bg-section-alt active:scale-[0.98] data-[state=open]:bg-section-alt"
        >
          <span
            aria-hidden
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-caption font-hrsd-bold text-primary-foreground"
          >
            {name.trim().charAt(0)}
          </span>
          <span className="truncate font-hrsd-medium">{name}</span>
          <ChevronDown aria-hidden className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-ui ease-standard group-data-[state=open]:rotate-180" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={8} collisionPadding={16} className="w-56 rounded-lg p-1">
        <DropdownMenuLabel className="truncate px-2 py-2 text-caption font-hrsd-regular text-muted-foreground">
          {name}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {items.map(({ label, to, icon: Icon }) => (
          <DropdownMenuItem
            key={to}
            onSelect={() => navigate(to)}
            className="cursor-pointer gap-2 rounded-md px-2 py-2 font-hrsd-medium focus:bg-section-alt focus:text-primary"
          >
            <Icon aria-hidden className="h-4 w-4 text-muted-foreground" />
            {label}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={handleLogout}
          className="cursor-pointer gap-2 rounded-md px-2 py-2 font-hrsd-medium text-danger focus:text-danger"
        >
          <LogOut aria-hidden className="h-4 w-4" />
          {copy.logout}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserDropdown;
