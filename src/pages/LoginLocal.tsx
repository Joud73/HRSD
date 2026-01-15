import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useAuth } from "@/context/AuthContext";
import loginBg from "@/assets/hero-bg.png";

const LoginLocal = () => {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate("/login");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      if (!email || !password) {
        setError("يرجى إدخال البريد الإلكتروني وكلمة المرور");
        return;
      }

      const { error: signInError } = await signIn(email, password);
      if (signInError) {
        setError("البريد الإلكتروني أو كلمة المرور غير صحيحة");
        return;
      }

      navigate("/dashboard", { replace: true });
    } catch {
      setError("حدث خطأ أثناء تسجيل الدخول");
    } finally {
      setIsLoading(false);
    }
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
              to="/login"
              className="text-primary hover:underline font-hrsd-medium"
              style={{ color: "hsl(175, 75%, 45%)" }}
            >
              العودة إلى خيارات الدخول
            </Link>
            <span className="text-white/80">&gt;</span>
            <span className="text-white font-hrsd-medium">تسجيل الدخول </span>
          </div>

          <div className="w-full h-0.5 mb-8" style={{ backgroundColor: "hsl(35, 91%, 54%)" }} />

          <div className="max-w-md mx-auto">
            <div
              className="rounded-xl p-8 shadow-lg"
              style={{ backgroundColor: "rgba(255, 255, 255, 0.97)" }}
            >
              {/* Back Button */}
              <button
                type="button"
                onClick={handleBack}
                aria-label="العودة إلى الصفحة السابقة"
                className="flex items-center gap-2 mb-4 text-sm font-hrsd-medium transition-colors hover:opacity-80"
                style={{ color: "hsl(175, 75%, 30%)" }}
              >
                <ArrowRight size={18} />
                <span>العودة</span>
              </button>

              <h1
                className="text-xl font-hrsd-title text-center mb-6"
                style={{ color: "hsl(35, 91%, 54%)" }}
              >
                تسجيل الدخول باستخدام اسم المستخدم وكلمة المرور
              </h1>

              {error && (
                <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg text-right">
                  <p className="text-red-600 text-sm font-hrsd">{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-right text-sm font-hrsd-medium mb-2 text-gray-700">
                    البريد الإلكتروني
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg text-right font-hrsd focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                    placeholder="example@domain.com"
                    dir="ltr"
                    style={{ textAlign: "right" }}
                  />
                </div>

                <div>
                  <label className="block text-right text-sm font-hrsd-medium mb-2 text-gray-700">
                    كلمة المرور
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg text-right font-hrsd focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                    dir="ltr"
                    style={{ textAlign: "right" }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 rounded-lg text-white font-hrsd-medium text-lg transition-colors disabled:opacity-50"
                  style={{ backgroundColor: "hsl(175, 75%, 30%)" }}
                >
                  {isLoading ? "جاري تسجيل الدخول..." : "تسجيل الدخول"}
                </button>


                <div className="flex items-center justify-center gap-4 pt-2">
                  <Link
                    to="/forgot-password"
                    className="text-sm font-hrsd-medium hover:underline"
                    style={{ color: "hsl(175, 75%, 30%)" }}
                    aria-label="الانتقال إلى صفحة إعادة تعيين كلمة المرور"
                  >
                    نسيت بيانات الدخول؟
                  </Link>
                  <span className="text-gray-300">|</span>
                  <Link
                    to="/register"
                    className="text-sm font-hrsd-medium hover:underline"
                    style={{ color: "hsl(175, 75%, 30%)" }}
                  >
                    تسجيل جديد
                  </Link>
                </div>
              </form>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default LoginLocal;