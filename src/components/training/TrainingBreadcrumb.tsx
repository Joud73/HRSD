import { ChevronLeft, Home } from "lucide-react";

const TrainingBreadcrumb = () => {
  return (
    <nav
      className="bg-section-light py-3 px-4 mt-20"
      dir="rtl"
      aria-label="مسار التنقل"
    >
      <div className="container mx-auto">
        <ol className="flex items-center gap-2 text-sm font-hrsd-medium flex-wrap">
          <li>
            <a
              href="https://phpstack-1518564-5838964.cloudwaysapps.com/"
              className="flex items-center gap-1 text-muted-foreground hover:text-primary transition-colors"
              aria-label="الانتقال إلى الصفحة الرئيسية"
            >
              <Home size={16} />
              <span>الصفحة الرئيسية</span>
            </a>
          </li>
          <li className="text-muted-foreground" aria-hidden="true">
            <ChevronLeft size={16} />
          </li>
          <li>
            <span className="text-primary font-hrsd-semibold" aria-current="page">
              مرحلة التأهيل والتدريب
            </span>
          </li>
        </ol>
      </div>
    </nav>
  );
};

export default TrainingBreadcrumb;
