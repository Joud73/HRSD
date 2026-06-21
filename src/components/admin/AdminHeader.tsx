import { ChevronLeft, UserCircle, LogOut, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import hrsdLogo from "@/assets/logos/hrsd-colored.png";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const AdminHeader = () => {
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
    navigate("/login", { replace: true });
  };

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-card px-6">
      <img src={hrsdLogo} alt="HRSD" className="h-9 object-contain" />

      <DropdownMenu dir="rtl">
        <DropdownMenuTrigger asChild>
          <button className="flex items-center gap-2 rounded-xl px-3 py-1.5 text-sm font-hrsd-medium text-foreground hover:bg-muted transition-colors">
            <UserCircle className="h-5 w-5 text-primary" />
            <span>مدير النظام</span>
            <ChevronLeft className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuItem onClick={() => navigate("/admin/profile")} className="gap-2 cursor-pointer">
            <User className="h-4 w-4" />
            الملف الشخصي
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout} className="gap-2 cursor-pointer text-destructive focus:text-destructive">
            <LogOut className="h-4 w-4" />
            تسجيل الخروج
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
};

export default AdminHeader;
