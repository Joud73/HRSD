import { Menu, X } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

const TrainingHeader = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50" dir="rtl">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <a
            href="https://aspire.aol.edu.sa/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3"
            aria-label="الانتقال إلى الصفحة الرئيسية لطموحي"
          >
            <div className="w-10 h-10 md:w-12 md:h-12 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-white font-hrsd-bold text-lg md:text-xl">ط</span>
            </div>
            <span className="font-hrsd-title text-primary text-lg md:text-xl hidden sm:block">
              طموحي
            </span>
          </a>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <Link
              to="/training-stage"
              className="text-foreground hover:text-primary transition-colors font-hrsd-medium"
            >
              التأهيل والتدريب
            </Link>
            <Link
              to="/dashboard"
              className="text-foreground hover:text-primary transition-colors font-hrsd-medium"
            >
              لوحة التحكم
            </Link>
            <Link
              to="/settings"
              className="text-foreground hover:text-primary transition-colors font-hrsd-medium"
            >
              الإعدادات
            </Link>
          </nav>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-foreground hover:text-primary transition-colors"
            aria-label={mobileMenuOpen ? "إغلاق القائمة" : "فتح القائمة"}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <nav className="md:hidden py-4 border-t border-border animate-fade-in">
            <div className="flex flex-col gap-4">
              <Link
                to="/training-stage"
                className="text-foreground hover:text-primary transition-colors font-hrsd-medium py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                التأهيل والتدريب
              </Link>
              <Link
                to="/dashboard"
                className="text-foreground hover:text-primary transition-colors font-hrsd-medium py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                لوحة التحكم
              </Link>
              <Link
                to="/settings"
                className="text-foreground hover:text-primary transition-colors font-hrsd-medium py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                الإعدادات
              </Link>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
};

export default TrainingHeader;
