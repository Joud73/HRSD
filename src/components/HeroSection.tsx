import { Link } from "react-router-dom";
export default function HeroGov() {
  return <section dir="rtl" className="relative min-h-[85vh] bg-[#1D4D37]">
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="max-w-[900px] w-full text-center px-8">
          <h1 className="text-white text-3xl md:text-4xl lg:text-5xl xl:text-[56px] leading-[1.35] mb-6" style={{
          fontFamily: "'HRSDGov-Bold', 'Cairo', system-ui, sans-serif",
          fontWeight: 700
        }}>
            مركز التمكين الفني للمنظمات غير الربحية تحت إشراف وزارة الموارد البشرية والتنمية الاجتماعية فنياً
          </h1>

          <p className="text-white/80 text-sm lg:text-lg leading-relaxed mb-8 mx-auto max-w-2xl md:text-xl" style={{
          fontFamily: "'HRSDGov-Regular', 'Cairo', system-ui, sans-serif",
          fontWeight: 400
        }}>
            تأهيل ، تدريب ، تمكين ، تقييم الأداء الفني
          </p>

          <Link to="/login" className="inline-flex items-center justify-center bg-white text-[#1D4D37]
                       px-8 py-3 rounded-lg text-base font-hrsd-medium
                       hover:bg-gray-100 transition-colors duration-200">
            ​ابدأ
          </Link>
        </div>
      </div>
    </section>;
}