import { useState, useRef, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, X, ChevronDown, MoreVertical, FileText, HelpCircle, LayoutGrid, Settings, LogOut, User } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import hrsdColoredLogo from "@/assets/logos/hrsd-colored.png";
import vision2030Colored from "@/assets/logos/vision-2030-colored.png";

type HeaderVariant = "main" | "org" | "individual";

interface AppHeaderProps {
  variant?: HeaderVariant;
}

const AppHeader = ({ variant: propVariant }: AppHeaderProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut, loading } = useAuth();
  
  const [hamburgerOpen, setHamburgerOpen] = useState(false);
  const [languageMenuOpen, setLanguageMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  
  const hamburgerRef = useRef<HTMLDivElement>(null);
  const languageRef = useRef<HTMLDivElement>(null);
  const userDropdownRef = useRef<HTMLDivElement>(null);

  // Determine variant based on route and auth state
  const getVariant = (): HeaderVariant => {
    if (propVariant) return propVariant;
    
    // Check if user is logged in
    if (user) {
      // Individual routes
      if (location.pathname.startsWith("/individuals-journey")) {
        return "individual";
      }
      // Org routes (dashboard, settings, training, etc.)
      return "org";
    }
    
    // Public/main page
    return "main";
  };

  const variant = getVariant();

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (hamburgerRef.current && !hamburgerRef.current.contains(event.target as Node)) {
        setHamburgerOpen(false);
      }
      if (languageRef.current && !languageRef.current.contains(event.target as Node)) {
        setLanguageMenuOpen(false);
      }
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target as Node)) {
        setUserDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await signOut();
    setUserDropdownOpen(false);
    navigate("/");
  };

  const closeMenus = () => {
    setHamburgerOpen(false);
    setLanguageMenuOpen(false);
  };

  // Variant A: Main Page (before login)
  if (variant === "main") {
    return (
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200" dir="rtl">
        <div className="container mx-auto px-4 md:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Left side - 3-dots menu for language */}
            <div className="relative" ref={languageRef}>
              <button
                onClick={() => setLanguageMenuOpen(!languageMenuOpen)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="اللغة"
              >
                <MoreVertical className="w-5 h-5 text-gray-700" />
              </button>
              
              {languageMenuOpen && (
                <div className="absolute top-full left-0 mt-2 bg-white rounded-lg shadow-lg border border-gray-200 py-2 min-w-32 z-50">
                  <button className="w-full px-4 py-2 text-right text-sm font-hrsd-medium text-foreground hover:bg-gray-100 transition-colors">
                    العربية
                  </button>
                  <button className="w-full px-4 py-2 text-right text-sm font-hrsd-medium text-foreground hover:bg-gray-100 transition-colors">
                    English
                  </button>
                </div>
              )}
            </div>

            {/* Center - Logo */}
            <Link to="/" className="flex items-center">
              <img
                src={hrsdColoredLogo}
                alt="وزارة الموارد البشرية والتنمية الاجتماعية"
                className="h-12 md:h-14"
              />
            </Link>

            {/* Right side - Hamburger Menu */}
            <div className="relative" ref={hamburgerRef}>
              <button
                onClick={() => setHamburgerOpen(!hamburgerOpen)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="القائمة الرئيسية"
              >
                {hamburgerOpen ? (
                  <X className="w-6 h-6 text-gray-700" />
                ) : (
                  <Menu className="w-6 h-6 text-gray-700" />
                )}
              </button>

              {hamburgerOpen && (
                <div className="absolute top-full right-0 mt-2 bg-white rounded-lg shadow-lg border border-gray-200 py-2 min-w-56 z-50">
                  <a
                    href="#"
                    className="flex items-center gap-3 px-4 py-3 text-sm font-hrsd-medium text-foreground hover:bg-gray-100 transition-colors"
                    onClick={closeMenus}
                  >
                    <FileText className="w-5 h-5 text-primary" />
                    دليل الكفاءة الفنية
                  </a>
                  <a
                    href="#"
                    className="flex items-center gap-3 px-4 py-3 text-sm font-hrsd-medium text-foreground hover:bg-gray-100 transition-colors"
                    onClick={closeMenus}
                  >
                    <HelpCircle className="w-5 h-5 text-primary" />
                    دليل استخدام الأداة
                  </a>
                  <div className="h-px bg-gray-200 my-2" />
                  <Link
                    to="/login"
                    className="flex items-center gap-3 px-4 py-3 text-sm font-hrsd-medium text-primary hover:bg-gray-100 transition-colors"
                    onClick={closeMenus}
                  >
                    <User className="w-5 h-5" />
                    تسجيل الدخول
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>
    );
  }

  // Variant B & C: Dashboard Headers (org/individual)
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white shadow-sm" dir="rtl">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Right side - Logos */}
          <div className="flex items-center gap-3 md:gap-6">
            <img 
              src={hrsdColoredLogo} 
              alt="وزارة الموارد البشرية والتنمية الاجتماعية" 
              className="h-10 md:h-14 w-auto" 
            />
            <div className="h-8 md:h-12 w-px bg-border hidden sm:block" />
            <img 
              src={vision2030Colored} 
              alt="رؤية 2030" 
              className="h-8 md:h-12 w-auto hidden sm:block" 
            />
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-6">
            <a href="#" className="flex items-center gap-2 text-sm font-hrsd-medium text-foreground hover:text-primary transition-colors">
              <FileText className="w-5 h-5" />
              دليل الكفاءة الفنية
            </a>

            <a href="#" className="flex items-center gap-2 text-sm font-hrsd-medium text-foreground hover:text-primary transition-colors">
              <HelpCircle className="w-5 h-5 text-primary" />
              دليل استخدام الأداة
            </a>

            {/* User Dropdown - Only show greeting for org variant */}
            {!loading && user && (
              <div className="relative" ref={userDropdownRef}>
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 text-sm font-hrsd-medium text-foreground hover:text-primary transition-colors"
                >
                  <User className="w-5 h-5" />
                  {variant === "org" && <span>مرحبا، مفوض الجمعية</span>}
                  <ChevronDown className={`w-4 h-4 transition-transform ${userDropdownOpen ? "rotate-180" : ""}`} />
                </button>

                {userDropdownOpen && (
                  <div className="absolute top-full left-0 mt-2 bg-white rounded-lg shadow-lg border border-gray-200 py-2 min-w-48 z-50">
                    <Link 
                      to="/dashboard" 
                      className="flex items-center gap-3 px-4 py-3 text-sm font-hrsd-medium text-foreground hover:bg-gray-100 transition-colors"
                      onClick={() => setUserDropdownOpen(false)}
                    >
                      <LayoutGrid className="w-5 h-5" style={{ color: "#f5961e" }} />
                      لوحة التحكم
                    </Link>
                    <Link 
                      to="/settings" 
                      className="flex items-center gap-3 px-4 py-3 text-sm font-hrsd-medium text-foreground hover:bg-gray-100 transition-colors"
                      onClick={() => setUserDropdownOpen(false)}
                    >
                      <Settings className="w-5 h-5" style={{ color: "#f5961e" }} />
                      الإعدادات
                    </Link>
                    <div className="h-px bg-gray-200 my-1" />
                    <button 
                      onClick={handleLogout}
                      className="flex items-center gap-3 px-4 py-3 text-sm font-hrsd-medium text-foreground hover:bg-gray-100 transition-colors w-full text-right"
                    >
                      <LogOut className="w-5 h-5" style={{ color: "#f5961e" }} />
                      تسجيل الخروج
                    </button>
                  </div>
                )}
              </div>
            )}
          </nav>

          {/* Mobile Menu Button */}
          <div className="lg:hidden relative" ref={hamburgerRef}>
            <button
              onClick={() => setHamburgerOpen(!hamburgerOpen)}
              className="p-2 text-foreground hover:text-primary transition-colors"
              aria-label={hamburgerOpen ? "إغلاق القائمة" : "فتح القائمة"}
            >
              {hamburgerOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            {hamburgerOpen && (
              <div className="absolute top-full left-0 mt-2 bg-white rounded-lg shadow-lg border border-gray-200 py-2 min-w-56 z-50">
                <a
                  href="#"
                  className="flex items-center gap-3 px-4 py-3 text-sm font-hrsd-medium text-foreground hover:bg-gray-100 transition-colors"
                  onClick={closeMenus}
                >
                  <FileText className="w-5 h-5 text-primary" />
                  دليل الكفاءة الفنية
                </a>
                <a
                  href="#"
                  className="flex items-center gap-3 px-4 py-3 text-sm font-hrsd-medium text-foreground hover:bg-gray-100 transition-colors"
                  onClick={closeMenus}
                >
                  <HelpCircle className="w-5 h-5 text-primary" />
                  دليل استخدام الأداة
                </a>
                
                {!loading && user && (
                  <>
                    <div className="h-px bg-gray-200 my-2" />
                    {variant === "org" && (
                      <div className="px-4 py-2 text-xs text-muted-foreground font-hrsd-medium">
                        مرحبا، مفوض الجمعية
                      </div>
                    )}
                    <Link
                      to="/dashboard"
                      className="flex items-center gap-3 px-4 py-3 text-sm font-hrsd-medium text-foreground hover:bg-gray-100 transition-colors"
                      onClick={closeMenus}
                    >
                      <LayoutGrid className="w-5 h-5" style={{ color: "#f5961e" }} />
                      لوحة التحكم
                    </Link>
                    <Link
                      to="/settings"
                      className="flex items-center gap-3 px-4 py-3 text-sm font-hrsd-medium text-foreground hover:bg-gray-100 transition-colors"
                      onClick={closeMenus}
                    >
                      <Settings className="w-5 h-5" style={{ color: "#f5961e" }} />
                      الإعدادات
                    </Link>
                    <button
                      onClick={() => { closeMenus(); handleLogout(); }}
                      className="flex items-center gap-3 px-4 py-3 text-sm font-hrsd-medium text-foreground hover:bg-gray-100 transition-colors w-full text-right"
                    >
                      <LogOut className="w-5 h-5" style={{ color: "#f5961e" }} />
                      تسجيل الخروج
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default AppHeader;
