// src/pages/Login.tsx
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import NafathIcon from "@/components/icons/NafathIcon";
import { User, Building2, Users } from "lucide-react";
import loginBg from "@/assets/hero-bg.png";

type AccountType = "individual" | "org";

const Login = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const typeParam = searchParams.get("type");
  const accountType: AccountType | null = 
    typeParam === "individual" || typeParam === "org" ? typeParam : null;

  const handleSelectType = (type: AccountType) => {
    setSearchParams({ type });
  };

  const handleClearType = () => {
    setSearchParams({});
  };

  const handleNafathLogin = () => {
    navigate(`/nafath-auth?type=${accountType}`, { replace: false });
  };

  const handleLocalLogin = () => {
    navigate(`/login-local?type=${accountType}`, { replace: false });
  };

  const getBreadcrumbText = () => {
    if (accountType === "individual") {
      return "تسجيل دخول الأفراد";
    }
    return "تسجيل دخول المنظمة";
  };

  // Step A: Type Selection Screen
  if (!accountType) {
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
              <span className="text-white font-hrsd-medium">تسجيل الدخول</span>
            </div>

            <div className="w-full h-0.5 mb-8" style={{ backgroundColor: "hsl(35, 91%, 54%)" }} />

            <div className="max-w-2xl mx-auto">
              <div
                className="rounded-xl p-8 shadow-lg"
                style={{ backgroundColor: "rgba(255, 255, 255, 0.97)" }}
              >
                <h1
                  className="text-xl font-hrsd-title text-center mb-8"
                  style={{ color: "hsl(35, 91%, 54%)" }}
                >
                  اختر نوع الدخول
                </h1>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Individuals Card */}
                  <button
                    type="button"
                    onClick={() => navigate("/individuals-journey")}
                    className="group p-6 rounded-xl border-2 border-gray-200 bg-white hover:border-[hsl(175,75%,30%)] hover:shadow-lg transition-all duration-200 flex flex-col items-center gap-4"
                  >
                    <div 
                      className="w-16 h-16 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-200"
                      style={{ backgroundColor: "hsl(175, 75%, 95%)" }}
                    >
                      <Users 
                        size={32} 
                        style={{ color: "hsl(175, 75%, 30%)" }}
                      />
                    </div>
                    <span 
                      className="text-lg font-hrsd-semibold"
                      style={{ color: "hsl(175, 75%, 25%)" }}
                    >
                      أفراد
                    </span>
                    <span className="text-sm text-gray-500 font-hrsd-regular text-center">
                      تسجيل الدخول كفرد للوصول إلى خدمات الأفراد
                    </span>
                  </button>

                  {/* Organizations Card */}
                  <button
                    type="button"
                    onClick={() => handleSelectType("org")}
                    className="group p-6 rounded-xl border-2 border-gray-200 bg-white hover:border-[hsl(175,75%,30%)] hover:shadow-lg transition-all duration-200 flex flex-col items-center gap-4"
                  >
                    <div 
                      className="w-16 h-16 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-200"
                      style={{ backgroundColor: "hsl(35, 91%, 95%)" }}
                    >
                      <Building2 
                        size={32} 
                        style={{ color: "hsl(35, 91%, 45%)" }}
                      />
                    </div>
                    <span 
                      className="text-lg font-hrsd-semibold"
                      style={{ color: "hsl(175, 75%, 25%)" }}
                    >
                      منظمات
                    </span>
                    <span className="text-sm text-gray-500 font-hrsd-regular text-center">
                      تسجيل الدخول كمنظمة للوصول إلى خدمات المنظمات
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    );
  }

  // Step B: Login Method Selection Screen
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
            <span className="text-white font-hrsd-medium">{getBreadcrumbText()}</span>
          </div>

          <div className="w-full h-0.5 mb-8" style={{ backgroundColor: "hsl(35, 91%, 54%)" }} />

          <div className="max-w-md mx-auto">
            <div
              className="rounded-xl p-8 shadow-lg"
              style={{ backgroundColor: "rgba(255, 255, 255, 0.97)" }}
            >
              <div className="flex items-center justify-center gap-2 mb-8">
                <h1
                  className="text-xl font-hrsd-title text-center"
                  style={{ color: "hsl(35, 91%, 54%)" }}
                >
                  اختر طريقة تسجيل الدخول
                </h1>
              </div>
              
              {/* Change type link */}
              <div className="text-center mb-6">
                <button
                  type="button"
                  onClick={handleClearType}
                  className="text-sm font-hrsd-medium hover:underline"
                  style={{ color: "hsl(175, 75%, 30%)" }}
                >
                  تغيير نوع الدخول
                </button>
              </div>

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

              {/* Individuals Journey Link - Only for individual type */}
              {accountType === "individual" && (
                <div className="text-center mt-4">
                  <Link
                    to="/individuals-journey"
                    className="text-sm font-hrsd-medium hover:underline"
                    style={{ color: "hsl(35, 91%, 45%)" }}
                  >
                    الدخول عبر رحلة الأفراد
                  </Link>
                </div>
              )}

              {/* Links */}
              <div className="flex items-center justify-center gap-4 pt-6 mt-6 border-t border-gray-100">
                <Link
                  to={`/register?type=${accountType}`}
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
