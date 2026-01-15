import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { ChevronDown, HelpCircle, FileText, Video, Headphones } from "lucide-react";
import hrsdWhiteLogo from "@/assets/logos/hrsd-white.png";
import hrsdColoredLogo from "@/assets/logos/hrsd-colored.png";
import vision2030White from "@/assets/logos/vision-2030-white.webp";
import vision2030Colored from "@/assets/logos/vision-2030-colored.png";
import { useAuth } from "@/context/AuthContext";
import UserDropdown from "./UserDropdown";

const Header = () => {
  const location = useLocation();
  const [isGuideDropdownOpen, setIsGuideDropdownOpen] = useState(false);
  
  // Pages that should always show white header (no transparent hero)
  const alwaysWhitePages = ['/dashboard', '/settings', '/login', '/register', '/technical-indicators', '/contact-us'];
  const shouldAlwaysBeWhite = alwaysWhitePages.some(page => location.pathname.startsWith(page));
  
  const [isScrolled, setIsScrolled] = useState(shouldAlwaysBeWhite);
  const { user, loading } = useAuth();

  useEffect(() => {
    // On pages with transparent hero, listen for scroll
    if (!shouldAlwaysBeWhite) {
      const handleScroll = () => {
        setIsScrolled(window.scrollY > 100);
      };
      window.addEventListener('scroll', handleScroll);
      return () => window.removeEventListener('scroll', handleScroll);
    } else {
      // Always white on dashboard/settings/login pages
      setIsScrolled(true);
    }
  }, [shouldAlwaysBeWhite]);

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-white shadow-sm' : 'bg-transparent'}`}>
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Right side - Logos */}
          <div className="flex items-center gap-6">
            {/* HRSD Logo - switches based on scroll */}
            <img src={isScrolled ? hrsdColoredLogo : hrsdWhiteLogo} alt="وزارة الموارد البشرية والتنمية الاجتماعية" className="h-14 w-auto" />
            <div className={`h-12 w-px ${isScrolled ? 'bg-border' : 'bg-white/30'}`} />
            <img 
              src={isScrolled ? vision2030Colored : vision2030White} 
              alt="رؤية 2030" 
              className="h-12 w-auto" 
            />
          </div>

          {/* Left side - Navigation */}
          <nav className="flex items-center gap-6">
            {/* Technical Guide Link */}
            <a href="#" className={`flex items-center gap-2 text-sm font-hrsd-medium transition-colors ${isScrolled ? 'text-foreground hover:text-primary' : 'text-white hover:text-white/80'}`}>
              <FileText className="w-5 h-5" />
              دليل الكفاءة الفنية
            </a>

            {/* Usage Guide Dropdown */}
            <div className="relative">
              <button onClick={() => setIsGuideDropdownOpen(!isGuideDropdownOpen)} className={`flex items-center gap-2 text-sm font-hrsd-medium transition-colors ${isScrolled ? 'text-foreground hover:text-primary' : 'text-white hover:text-white/80'}`}>
                <HelpCircle className={`w-5 h-5 ${isScrolled ? 'text-primary' : 'text-white'}`} />
                دليل استخدام الأداة
                <ChevronDown className={`w-4 h-4 transition-transform ${isGuideDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {isGuideDropdownOpen && (
                <div className="dropdown-menu mt-2">
                  <a href="#" className="dropdown-item">
                    <Video className="w-5 h-5 text-primary" />
                    <span>الفيديو التعريفي</span>
                  </a>
                  <a href="#" className="dropdown-item">
                    <FileText className="w-5 h-5 text-primary" />
                    <span>دليل المستخدم</span>
                  </a>
                  <Link to="/contact-us" className="dropdown-item" onClick={() => setIsGuideDropdownOpen(false)}>
                    <Headphones className="w-5 h-5 text-primary" />
                    <span>تواصل معنا</span>
                  </Link>
                </div>
              )}
            </div>

            {/* Login Button or User Dropdown based on auth state */}
            {!loading && (
              user ? (
                <UserDropdown isScrolled={isScrolled} />
              ) : (
                <Link to="/login" className="login-button">
                  تسجيل الدخول
                </Link>
              )
            )}
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;
