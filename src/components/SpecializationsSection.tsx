import tr01Icon from "@/assets/icons/tr01.svg";
import tr03Icon from "@/assets/icons/tr03.svg";
import tr05Icon from "@/assets/icons/tr05.svg";
import tr06Icon from "@/assets/icons/tr06.svg";

const specializations = [
  {
    icon: tr01Icon,
    text: "رفع مساهمة القطاع غير الربحي في تلبية الاحتياجات التنموية المجتمعية ضمن نطاق الوزارة",
    delay: "",
  },
  {
    icon: tr05Icon,
    text: "تحسين كفاءة وفاعلية الإدارة في تنفيذ أعمالها ونشاطاتها الداخلية",
    delay: "animation-delay-100",
  },
  {
    icon: tr06Icon,
    text: "الإسهام بالارتقاء بمستوى التدخلات المقدمة من قبل منظمات القطاع غير الربحي للمجتمع",
    delay: "animation-delay-200",
  },
  {
    icon: tr03Icon,
    text: "زيادة المساهمة المعرفية والابتكارية في مجال التنمية والعمل",
    delay: "animation-delay-300",
  },
];

const SpecializationsSection = () => {
  return (
    <section className="py-16 md:py-24 bg-section-light relative">
      {/* Side patterns */}
      <div className="side-pattern-left" />
      <div className="side-pattern-right" />
      
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-right mb-12">
          <h2 className="section-title">إختصاصات الإشراف الفني</h2>
          <div className="section-title-underline" />
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {specializations.map((item, index) => (
            <div 
              key={index}
              className={`feature-card animate-fade-in ${item.delay}`}
            >
              <div className="flex flex-col items-start">
                <img 
                  src={item.icon} 
                  alt="feature icon" 
                  className="w-12 h-12 mb-4"
                />
                <p className="text-lg font-hrsd-medium text-foreground text-right leading-relaxed">
                  {item.text}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SpecializationsSection;
