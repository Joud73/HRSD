// src/pages/Login.tsx
import { Link, useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import NafathIcon from "@/components/icons/NafathIcon";
import { User, Eye } from "lucide-react";
import loginBg from "@/assets/hero-bg.png";

const Login = () => {
  const navigate = useNavigate();

  const handleNafathLogin = () => {
    navigate("/nafath-auth", { replace: false });
  };

  const handleLocalLogin = () => {
    navigate("/login-local", { replace: false });
  };

  const handleGuestAccess = () => {
    localStorage.setItem("authRole", "guest");
    navigate("/dashboard", { replace: false });
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
            <Link
              to="/"
              className="text-primary hover:underline font-hrsd-medium"
              style={{ color: "hsl(175, 75%, 45%)" }}
            >
              العودة الى الصفحة الرئيسية
            </Link>
            <span className="text-white/80">&gt;</span>
            <span className="text-white font-hrsd-medium">تسجيل دخول المنظمة</span>
          </div>

          <div className="w-full h-0.5 mb-8" style={{ backgroundColor: "hsl(35, 91%, 54%)" }} />

          <div className="max-w-md mx-auto">
            <div
              className="rounded-xl p-8 shadow-lg"
              style={{ backgroundColor: "rgba(255, 255, 255, 0.97)" }}
            >
              <h1
                className="text-xl font-hrsd-title text-center mb-8"
                style={{ color: "hsl(35, 91%, 54%)" }}
              >
                اختر طريقة تسجيل الدخول
              </h1>

              {/* Nafath Login Button - Primary */}
              <button
                type="button"
                onClick={handleNafathLogin}
                aria-label="تسجيل الدخول عبر نفاذ الوطني"
                className="w-full py-4 rounded-lg text-white font-hrsd-medium text-lg transition-all duration-200 flex items-center justify-center gap-3 hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary/50 mb-4"
                style={{ backgroundColor: "hsl(175, 75%, 30%)" }}
              >
                <NafathIcon size={24} className="text-white" />
                <span>تسجيل الدخول عبر نفاذ</span>
              </button>

              {/* Divider */}
              <div className="flex items-center gap-4 my-6">
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-gray-400 text-sm font-hrsd-medium">أو</span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>

              {/* Local Login Button - Secondary */}
              <button
                type="button"
                onClick={handleLocalLogin}
                aria-label="تسجيل الدخول باستخدام اسم المستخدم وكلمة المرور"
                className="w-full py-4 rounded-lg font-hrsd-medium text-lg transition-all duration-200 flex items-center justify-center gap-3 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-300 border-2"
                style={{ 
                  borderColor: "hsl(175, 75%, 30%)", 
                  color: "hsl(175, 75%, 30%)",
                  backgroundColor: "transparent"
                }}
              >
                <User size={22} />
                <span>تسجيل الدخول باستخدام اسم المستخدم وكلمة المرور</span>
              </button>

              {/* Guest Access Button - Tertiary */}
              <button
                type="button"
                onClick={handleGuestAccess}
                aria-label="المتابعة كضيف"
                className="w-full py-3 rounded-lg font-hrsd-medium text-base transition-all duration-200 flex items-center justify-center gap-3 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-200 border mt-4"
                style={{ 
                  borderColor: "#d1d5db", 
                  color: "#6b7280",
                  backgroundColor: "transparent"
                }}
              >
                <Eye size={20} />
                <span>المتابعة كضيف</span>
              </button>

              {/* Links */}
              <div className="flex items-center justify-center gap-4 pt-6 mt-6 border-t border-gray-100">
                <Link
                  to="/register"
                  className="text-sm font-hrsd-medium hover:underline"
                  style={{ color: "hsl(175, 75%, 30%)" }}
                >
                  تسجيل جديد
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Login;