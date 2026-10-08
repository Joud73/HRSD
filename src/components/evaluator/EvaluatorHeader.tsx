import { Link } from "react-router-dom";
import { User } from "lucide-react";
import UserDropdown from "@/components/UserDropdown";
import hrsdLogo from "@/assets/logos/hrsd-colored.png";

const EvaluatorHeader = () => (
  <header dir="rtl" className="sticky top-0 z-30 h-20 border-b border-border bg-background">
    <div className="flex h-full items-center justify-between gap-4 px-6">
      <Link
        to="/evaluator"
        className="flex items-center gap-3 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4"
      >
        <img src={hrsdLogo} alt="وزارة الموارد البشرية والتنمية الاجتماعية" className="h-14 w-auto" />
      </Link>

      <UserDropdown
        name="مقيّم الجمعيات"
        items={[{ label: "الملف الشخصي", to: "/evaluator/profile", icon: User }]}
        logoutRedirect="/login"
      />
    </div>
  </header>
);

export default EvaluatorHeader;
