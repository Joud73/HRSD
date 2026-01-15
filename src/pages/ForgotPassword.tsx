import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import loginBg from "@/assets/hero-bg.png";

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate("/login-local");
    }
  };

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validation
    if (!email.trim()) {
      setError("يرجى إدخال البريد الإلكتروني");
      return;
    }

    if (!validateEmail(email.trim())) {
      setError("يرجى إدخال بريد إلكتروني صحيح");
      return;
    }

    setIsLoading(true);

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        email.trim(),
        {
          redirectTo: `${window.location.origin}/reset-password`,
        }
      );

      // Always show success message for security (don't reveal if email exists)
      // Log error internally but don't expose to user
      if (resetError) {
        console.error("Password reset request failed");
      }

      setIsSubmitted(true);
    } catch {
      console.error("Password reset error");
      setIsSubmitted(true); // Still show success for security
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
              to="/login-local"
              className="text-primary hover:underline font-hrsd-medium"
              style={{ color: "hsl(175, 75%, 45%)" }}
            >
              العودة إلى تسجيل الدخول
            </Link>
            <span className="text-white/80">&gt;</span>
            <span className="text-white font-hrsd-medium">إعادة تعيين كلمة المرور</span>
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
                إعادة تعيين كلمة المرور
              </h1>

              {isSubmitted ? (
                <div className="text-center space-y-6">
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-green-700 font-hrsd text-sm leading-relaxed">
                      إذا كان البريد الإلكتروني مسجلاً لدينا، سيتم إرسال رابط إعادة تعيين كلمة المرور إليه.
                    </p>
                  </div>
                  <p className="text-gray-600 font-hrsd text-sm">
                    يرجى التحقق من صندوق البريد الوارد والبريد غير المرغوب فيه.
                  </p>
                  <button
                    type="button"
                    onClick={() => navigate("/login-local")}
                    className="w-full py-3 rounded-lg text-white font-hrsd-medium text-lg transition-colors"
                    style={{ backgroundColor: "hsl(175, 75%, 30%)" }}
                  >
                    العودة إلى تسجيل الدخول
                  </button>
                </div>
              ) : (
                <>
                  <p className="text-gray-600 font-hrsd text-sm text-center mb-6">
                    أدخل بريدك الإلكتروني وسنرسل لك رابطًا لإعادة تعيين كلمة المرور.
                  </p>

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
                        aria-label="البريد الإلكتروني لإعادة تعيين كلمة المرور"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading}
                      aria-label="إرسال رابط إعادة تعيين كلمة المرور"
                      className="w-full py-3 rounded-lg text-white font-hrsd-medium text-lg transition-colors disabled:opacity-50"
                      style={{ backgroundColor: "hsl(175, 75%, 30%)" }}
                    >
                      {isLoading ? "جاري الإرسال..." : "إرسال رابط إعادة التعيين"}
                    </button>

                    <div className="text-center pt-2">
                      <Link
                        to="/login-local"
                        className="text-sm font-hrsd-medium hover:underline"
                        style={{ color: "hsl(175, 75%, 30%)" }}
                      >
                        العودة إلى تسجيل الدخول
                      </Link>
                    </div>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ForgotPassword;