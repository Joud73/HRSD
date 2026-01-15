import { useState } from "react";
import { ChevronDown, HelpCircle, FileText, Video, Headphones } from "lucide-react";
import hrsdColoredLogo from "@/assets/logos/hrsd-colored.png";
import vision2030Colored from "@/assets/logos/vision-2030-colored.png";
import UserDropdown from "./UserDropdown";

const SettingsHeader = () => {
  const [isGuideDropdownOpen, setIsGuideDropdownOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white shadow-sm">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Right side - Logos */}
          <div className="flex items-center gap-6">
            <img src={hrsdColoredLogo} alt="وزارة الموارد البشرية والتنمية الاجتماعية" className="h-14 w-auto" />
            <div className="h-12 w-px bg-border" />
            <img src={vision2030Colored} alt="رؤية 2030" className="h-12 w-auto" />
          </div>

          {/* Left side - Navigation */}
          <nav className="flex items-center gap-6">
            {/* Technical Guide Link */}
            <a href="#" className="flex items-center gap-2 text-sm font-hrsd-medium text-foreground hover:text-primary transition-colors">
              <FileText className="w-5 h-5" />
              دليل الكفاءة الفنية
            </a>

            {/* Usage Guide Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsGuideDropdownOpen(!isGuideDropdownOpen)}
                className="flex items-center gap-2 text-sm font-hrsd-medium text-foreground hover:text-primary transition-colors"
              >
                <HelpCircle className="w-5 h-5 text-primary" />
                دليل استخدام الأداة
                <ChevronDown className={`w-4 h-4 transition-transform ${isGuideDropdownOpen ? "rotate-180" : ""}`} />
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
                  <a href="#" className="dropdown-item">
                    <Headphones className="w-5 h-5 text-primary" />
                    <span>تواصل معنا</span>
                  </a>
                </div>
              )}
            </div>

            {/* User Dropdown */}
            <UserDropdown isScrolled={true} />
          </nav>
        </div>
      </div>
    </header>
  );
};

export default SettingsHeader;
