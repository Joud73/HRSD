import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, ArrowRight, CheckCircle2 } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import NafathIcon from "@/components/icons/NafathIcon";
import loginBg from "@/assets/hero-bg.png";

const NafathAuth = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState<"pending" | "success">("pending");

  const handleCancel = () => {
    navigate("/login", { replace: true });
  };

  const handleSimulateSuccess = () => {
    setStatus("success");
    localStorage.setItem("authRole", "nafath");
    setTimeout(() => navigate("/dashboard", { replace: true }), 1500);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main
        className="flex-1 relative pt-20"
        style={{
          backgroundImage: `url(${loginBg})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      >
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to bottom, rgba(20, 80, 85, 0.75) 0%, rgba(15, 60, 65, 0.85) 100%)",
          }}
        />

        <div className="relative z-10 container mx-auto px-4 py-8">
          {/* Breadcrumb */}
          <div className="flex items-center justify-end gap-2 mb-8 text-sm">
            <button
              onClick={handleCancel}
              className="text-primary hover:underline font-hrsd-medium flex items-center gap-1"
              style={{ color: "hsl(175, 75%, 45%)" }}
              aria-label="العودة إلى صفحة تسجيل الدخول"
            >
              <ArrowRight className="w-4 h-4" />
              العودة الى صفحة تسجيل الدخول
            </button>
            <span className="text-white/80">&gt;</span>
            <span className="text-white font-hrsd-medium">التحقق عبر نفاذ</span>
          </div>

          {/* Divider */}
          <div className="w-full h-0.5 mb-8" style={{ backgroundColor: "hsl(35, 91%, 54%)" }} />

          {/* Card */}
          <div className="max-w-md mx-auto">
            <div
              className="rounded-xl p-8 shadow-lg text-center"
              style={{ backgroundColor: "rgba(255, 255, 255, 0.97)" }}
              role="region"
              aria-label="التحقق عبر نفاذ"
            >
              {/* Nafath Icon */}
              <div
                className="w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-6"
                style={{ backgroundColor: "hsl(175, 75%, 30%)" }}
              >
                {status === "success" ? (
                  <CheckCircle2 className="w-10 h-10 text-white" />
                ) : (
                  <NafathIcon size={40} className="text-white" />
                )}
              </div>

              <h1
                className="text-xl font-hrsd-title mb-4"
                style={{ color: "hsl(35, 91%, 54%)" }}
              >
                التحقق عبر نفاذ
              </h1>

              {status === "pending" && (
                <>
                  <p className="text-gray-600 font-hrsd mb-6 leading-relaxed">
                    سيتم تحويلك/تأكيد الطلب عبر تطبيق نفاذ الوطني الموحد
                  </p>

                  {/* Status Indicator */}
                  <div 
                    className="flex items-center justify-center gap-3 py-4 px-6 rounded-lg mb-8"
                    style={{ backgroundColor: "hsl(175, 75%, 95%)" }}
                    aria-live="polite"
                  >
                    <Loader2 
                      className="w-5 h-5 animate-spin" 
                      style={{ color: "hsl(175, 75%, 30%)" }}
                    />
                    <span 
                      className="font-hrsd-medium"
                      style={{ color: "hsl(175, 75%, 30%)" }}
                    >
                      بانتظار الموافقة...
                    </span>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col gap-3">
                    <button
                      onClick={handleSimulateSuccess}
                      className="w-full py-3 rounded-lg text-white font-hrsd-medium text-lg transition-all duration-200 hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary/50"
                      style={{ backgroundColor: "hsl(175, 75%, 30%)" }}
                      aria-label="محاكاة نجاح التحقق"
                    >
                      لقد تمت الموافقة
                    </button>

                    <button
                      onClick={handleCancel}
                      className="w-full py-3 rounded-lg font-hrsd-medium text-lg transition-all duration-200 border-2 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-300"
                      style={{ 
                        borderColor: "hsl(175, 75%, 30%)",
                        color: "hsl(175, 75%, 30%)",
                      }}
                      aria-label="إلغاء والعودة إلى صفحة تسجيل الدخول"
                    >
                      إلغاء والعودة
                    </button>
                  </div>
                </>
              )}

              {status === "success" && (
                <div aria-live="polite">
                  <p 
                    className="font-hrsd-semibold mb-4 text-lg"
                    style={{ color: "hsl(145, 63%, 42%)" }}
                  >
                    ✓ تم التحقق بنجاح
                  </p>
                  <p className="text-gray-500 font-hrsd">
                    جاري تحويلك إلى لوحة التحكم...
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default NafathAuth;