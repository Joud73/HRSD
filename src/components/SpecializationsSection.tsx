import { TrendingUp, BadgeCheck, Lightbulb, RefreshCw } from "lucide-react";
const specialties = [{
  id: 1,
  text: "رفع مساهمة القطاع غير الربحي في تلبية الاحتياجات التنموية المجتمعية ضمن نطاق الوزارة",
  icon: TrendingUp
}, {
  id: 2,
  text: "تحسين كفاءة وفاعلية الإدارة في تنفيذ أعمالها ونشاطاتها الداخلية",
  icon: BadgeCheck
}, {
  id: 3,
  text: "الإسهام بالارتقاء بمستوى التدخلات المقدمة من قبل منظمات القطاع غير الربحي للمجتمع",
  icon: RefreshCw
}, {
  id: 4,
  text: "زيادة المساهمة المعرفية والابتكارية في مجال التنمية والعمل",
  icon: Lightbulb
}];
export default function SupervisionSpecialtiesSection() {
  return <section dir="rtl" className="relative bg-[#f8f9fa] py-16 overflow-hidden">
      {/* Subtle diagonal pattern on edges */}
      <div className="absolute inset-y-0 left-0 w-32 opacity-10"></div>
      <div className="absolute inset-y-0 right-0 w-32 opacity-10"></div>

      <div className="container mx-auto px-6 lg:px-16 relative z-10">
        {/* Section Header */}
        <div className="mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-2 text-right text-black" style={{
          fontFamily: "'HRSDGov-Bold', 'Cairo', system-ui, sans-serif"
        }}>
            اختصاصات الإشراف الفني
          </h2>
          {/* Micro-copy subtitle */}
          <p className="text-sm md:text-base text-gray-600 text-right mt-2" style={{
          fontFamily: "'HRSDGov-Regular', 'Cairo', system-ui, sans-serif"
        }}>
            نهدف من خلالها إلى تمكين منظمات القطاع غير الربحي وتعزيز أثرها التنموي
          </p>
        </div>

        {/* Cards Grid - 2x2 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {specialties.map(item => {
          const Icon = item.icon;
          return <div key={item.id} className="group relative rounded-lg p-8 border border-gray-100 shadow-sm 
                           hover:shadow-md hover:-translate-y-0.5 
                           transition-all duration-150 ease-out overflow-hidden" style={{
            background: "linear-gradient(180deg, #FFFFFF 0%, #FAFAFA 100%)"
          }}>
                <div className="flex items-center gap-6 flex-row">
                  {/* Icon - softer green, reduced size, consistent stroke */}
                  <div className="flex-shrink-0">
                    <div className="w-14 h-14 flex items-center justify-center">
                      <Icon className="w-10 h-10 transition-colors duration-150 group-hover:text-[#1B8354]" style={{
                    color: "#2D8B5E"
                  }} strokeWidth={1.25} />
                    </div>
                  </div>

                  {/* Text */}
                  <p className="text-gray-700 text-base md:text-lg leading-relaxed text-right flex-1" style={{
                fontFamily: "'HRSDGov-Regular', 'Cairo', system-ui, sans-serif"
              }}>
                    {item.text}
                  </p>
                </div>

                {/* Partial accent line - RTL aligned (right side) */}
                
              </div>;
        })}
        </div>
      </div>
    </section>;
}