import hrsdLogo from "@/assets/logos/hrsd-white.png";

const TrainingFooter = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="py-8 px-4" style={{ backgroundColor: '#148287' }} dir="rtl">
      <div className="container mx-auto">
        {/* Logo and Ministry Name */}
        <div className="flex justify-center items-center gap-3 mb-6">
          <span className="text-lg font-hrsd-medium text-white/90">
            وزارة الموارد البشرية والتنمية الاجتماعية
          </span>
          <img 
            src="/lovable-uploads/6a75d875-24f4-44a6-9d0f-d9febe082d2f.png" 
            alt="HRSD Logo" 
            className="h-10 w-auto" 
          />
        </div>

        {/* Copyright */}
        <div className="text-center">
          <p className="text-white/80 text-sm font-hrsd">
            {currentYear} © جميع الحقوق محفوظة
          </p>
        </div>
      </div>
    </footer>
  );
};

export default TrainingFooter;
