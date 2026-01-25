import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import OrganizationJourney from "@/components/OrganizationJourney";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, ArrowRight, Clock, AlertCircle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const UnderReview = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Mock data - in production this would come from the database
  const organizationName = "اسم المنظمة";
  const submissionDate = new Date().toLocaleDateString('ar-SA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  const isCertified = false; // This would come from the database

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      {/* Spacer for fixed header */}
      <div className="h-20" />
      
      <main className="flex-1" dir="rtl">
        <OrganizationJourney />
        
        {/* Light green background section */}
        <div className="bg-[hsl(150,40%,97%)] py-12">
          <div className="container mx-auto px-4">
            <div className="max-w-2xl mx-auto">
              <Card className="shadow-xl border-2 border-[hsl(160,40%,85%)] bg-white">
                <CardContent className="p-10 text-center">
                  {/* Animated Clock Icon with Title */}
                  <div className="flex items-center justify-center gap-4 mb-8">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                      <Clock className="w-8 h-8 text-primary animate-pulse" />
                    </div>
                    <h1 className="text-2xl font-hrsd-bold text-foreground">
                      تحت التدقيق
                    </h1>
                    {/* Spinning indicator */}
                    <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                  </div>
                  
                  {/* Message */}
                  <p className="text-muted-foreground font-hrsd mb-3 leading-relaxed text-lg">
                    تم استلام التقييم الذاتي وجميع الشواهد بنجاح.
                  </p>
                  <p className="text-muted-foreground font-hrsd mb-10 leading-relaxed text-lg">
                    يجري حاليًا تدقيق البيانات من قبل الجهة المختصة.
                  </p>
                  
                  {/* Organization Info */}
                  <div className="bg-[hsl(150,30%,96%)] rounded-xl p-8 mb-8 text-right border border-[hsl(160,30%,90%)]">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-foreground font-hrsd-semibold text-lg">{organizationName}</span>
                      <span className="text-muted-foreground font-hrsd">اسم المنظمة</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-foreground font-hrsd-semibold text-lg">{submissionDate}</span>
                      <span className="text-muted-foreground font-hrsd">تاريخ الإرسال</span>
                    </div>
                  </div>
                  
                  {/* Enhanced Notice Box */}
                  <div className="bg-amber-50 border-r-4 border-amber-400 rounded-lg p-5 mb-10 flex items-center gap-4 text-right">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                      <AlertCircle className="w-5 h-5 text-amber-600" />
                    </div>
                    <p className="text-amber-800 font-hrsd-semibold text-base leading-relaxed">
                      لا يمكن تعديل البيانات خلال مرحلة التدقيق.
                    </p>
                  </div>
                  
                  {/* Buttons - RTL: Dashboard on right, Certificate on left */}
                  <div className="flex flex-col sm:flex-row gap-4 justify-between">
                    {/* Certificate button - appears on LEFT in RTL */}
                    <Button
                      variant="outline"
                      className="font-hrsd-medium border-2 hover:bg-muted/50 order-2 sm:order-1"
                      disabled={!isCertified}
                      title={!isCertified ? "غير متاح حتى اعتماد الشهادة" : ""}
                    >
                      <FileText className="w-4 h-4 ml-2" />
                      عرض الشهادة
                    </Button>
                    
                    {/* Dashboard button - appears on RIGHT in RTL */}
                    <Button
                      onClick={() => navigate("/dashboard")}
                      className="font-hrsd-medium bg-primary hover:bg-primary/90 order-1 sm:order-2"
                    >
                      <ArrowRight className="w-4 h-4 ml-2" />
                      العودة للوحة التحكم
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
      
      {/* Side Badge */}
      <div
        className="fixed left-0 top-1/2 -translate-y-1/2 py-4 px-2 text-xs text-white z-50"
        style={{
          writingMode: "vertical-rl",
          textOrientation: "mixed",
          backgroundColor: "hsl(var(--accent-orange))",
          borderRadius: "0 4px 4px 0",
        }}
      >
        نسخة تجريبية
      </div>
    </div>
  );
};

export default UnderReview;
