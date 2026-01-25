import hrsdLogo from "@/assets/logos/hrsd-white.png";
export default function GovFooter() {
  return <footer dir="rtl">
      {/* Green top line */}
      <div className="h-1" style={{
      backgroundColor: '#1B8354'
    }} />
      
      {/* Main footer content */}
      <div className="py-10" style={{
      backgroundColor: '#F3F4F6'
    }}>
        <div className="container mx-auto px-4 md:px-8">
          {/* Logo and ministry name centered */}
          <div className="flex items-center justify-center gap-4 mb-6">
            <img src={hrsdLogo} alt="وزارة الموارد البشرية والتنمية الاجتماعية" className="h-12" style={{
            filter: 'brightness(0) saturate(100%) invert(28%) sepia(15%) saturate(1200%) hue-rotate(120deg) brightness(95%) contrast(90%)'
          }} />
            
          </div>
          
          {/* Copyright */}
          <p className="text-center text-sm font-hrsd-regular" style={{
          color: '#6B7280'
        }}>
            2026 © جميع الحقوق محفوظة
          </p>
        </div>
      </div>
    </footer>;
}