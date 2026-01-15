import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LayoutGrid, Settings, LogOut, User } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

interface UserDropdownProps {
  isScrolled?: boolean;
}

const UserDropdown = ({ isScrolled = false }: UserDropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { signOut } = useAuth();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 text-sm font-hrsd-medium transition-colors ${
          isScrolled ? "text-foreground hover:text-primary" : "text-white hover:text-white/80"
        }`}
      >
        <User className="w-5 h-5" />
        <span>مرحبا: مفوض المنظمة</span>
      </button>

      {isOpen && (
        <div className="dropdown-menu mt-2">
          <Link to="/dashboard" className="dropdown-item" onClick={() => setIsOpen(false)}>
            <LayoutGrid className="w-5 h-5" style={{ color: "#f5961e" }} />
            <span>لوحة التحكم</span>
          </Link>
          <Link to="/settings" className="dropdown-item" onClick={() => setIsOpen(false)}>
            <Settings className="w-5 h-5" style={{ color: "#f5961e" }} />
            <span>الإعدادات</span>
          </Link>
          <button onClick={handleLogout} className="dropdown-item w-full text-right">
            <LogOut className="w-5 h-5" style={{ color: "#f5961e" }} />
            <span>تسجيل الخروج</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default UserDropdown;
