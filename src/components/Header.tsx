import { Link } from "react-router-dom";
import { Search, Menu, X } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import hrsdLogo from "@/assets/logos/hrsd-colored.png";

export default function GovHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200" dir="rtl">
      <div className="container mx-auto px-4 md:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Left side - Menu dots and Search */}
          <div className="flex items-center gap-4">
            <button
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="القائمة"
            >
              <div className="flex gap-0.5">
                <span className="w-1 h-1 bg-gray-700 rounded-full"></span>
                <span className="w-1 h-1 bg-gray-700 rounded-full"></span>
                <span className="w-1 h-1 bg-gray-700 rounded-full"></span>
              </div>
            </button>
            <button
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="بحث"
            >
              <Search className="w-5 h-5 text-gray-700" />
            </button>
          </div>

          {/* Center - Logo */}
          <Link to="/" className="flex items-center">
            <img
              src={hrsdLogo}
              alt="وزارة الموارد البشرية والتنمية الاجتماعية"
              className="h-12 md:h-14"
            />
          </Link>

          {/* Right side - Hamburger Menu */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="القائمة الرئيسية"
          >
            {mobileMenuOpen ? (
              <X className="w-6 h-6 text-gray-700" />
            ) : (
              <Menu className="w-6 h-6 text-gray-700" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="absolute top-full left-0 right-0 bg-white border-b border-gray-200 shadow-lg">
          <nav className="container mx-auto px-4 py-6">
            <ul className="space-y-4">
              <li>
                <Link
                  to="/"
                  className="block py-2 text-gray-700 hover:text-primary transition-colors font-hrsd-medium"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  الرئيسية
                </Link>
              </li>
              <li>
                <Link
                  to="/login"
                  className="block py-2 text-gray-700 hover:text-primary transition-colors font-hrsd-medium"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  تسجيل الدخول
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      )}
    </header>
  );
}
