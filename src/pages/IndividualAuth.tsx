import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AppHeader from "@/components/AppHeader";
import Footer from "@/components/Footer";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { fetchUserRole, getDefaultRouteForRole } from "@/lib/roles";
import loginBg from "@/assets/hero-bg.png";

type AuthMode = "login" | "register";

const IndividualAuth = () => {
  const navigate = useNavigate();
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
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
      const { data: { user: authUser } } = await supabase.auth.getUser();
      const role = authUser ? await fetchUserRole(authUser.id) : null;
      if (role && role !== "individual") {
        await supabase.auth.signOut();
        setError("هذه الصفحة مخصصة لتسجيل دخول الأفراد فقط");
        return;
      }
      navigate(getDefaultRouteForRole(role), { replace: true });
    } catch {
      setError("حدث خطأ أثناء تسجيل الدخول");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsLoading(true);
    try {
      if (!email || !password || !confirmPassword) {
        setError("يرجى تعبئة جميع الحقول");
        return;
      }
      if (password !== confirmPassword) {
        setError("كلمتا المرور غير متطابقتين");
        return;
      }
      if (password.length < 6) {
        setError("كلمة المرور يجب أن تكون 6 أحرف على الأقل");
        return;
      }
      const { error: signUpError } = await signUp(email, password);
      if (signUpError) {
        setError(signUpError);
        return;
      }
      setSuccess("تم إنشاء الحساب بنجاح. يرجى التحقق من بريدك الإلكتروني لتأكيد الحساب.");
      setEmail("");
      setPassword("");
      setConfirmPassword("");
    } catch {
      setError("حدث خطأ أثناء إنشاء الحساب");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <AppHeader variant="main" />

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
              className="hover:underline font-hrsd-medium"
              style={{ color: "hsl(175, 75%, 45%)" }}
            >
              العودة إلى خيارات الدخول
            </Link>
            <span className="text-white/80">&gt;</span>
            <span className="text-white font-hrsd-medium">
              {mode === "login" ? "تسجيل دخول الأفراد" : "تسجيل حساب فرد جديد"}
            </span>
          </div>

          <div className="w-full h-0.5 mb-8" style={{ backgroundColor: "hsl(35, 91%, 54%)" }} />

          <div className="max-w-md mx-auto">
            <div
              className="rounded-xl p-8 shadow-lg"
              style={{ backgroundColor: "rgba(255, 255, 255, 0.97)" }}
            >
              {/* Tab Toggle */}
              <div className="flex rounded-lg overflow-hidden border mb-6" style={{ borderColor: "hsl(175, 75%, 30%)" }}>
                <button
                  type="button"
                  onClick={() => { setMode("login"); setError(""); setSuccess(""); }}
                  className="flex-1 py-3 text-center font-hrsd-medium text-sm transition-colors"
                  style={{
                    backgroundColor: mode === "login" ? "hsl(175, 75%, 30%)" : "transparent",
                    color: mode === "login" ? "white" : "hsl(175, 75%, 30%)",
                  }}
                >
                  تسجيل الدخول
                </button>
                <button
                  type="button"
                  onClick={() => { setMode("register"); setError(""); setSuccess(""); }}
                  className="flex-1 py-3 text-center font-hrsd-medium text-sm transition-colors"
                  style={{
                    backgroundColor: mode === "register" ? "hsl(175, 75%, 30%)" : "transparent",
                    color: mode === "register" ? "white" : "hsl(175, 75%, 30%)",
                  }}
                >
                  تسجيل جديد
                </button>
              </div>

              <h1
                className="text-xl font-hrsd-title text-center mb-6"
                style={{ color: "hsl(35, 91%, 54%)" }}
              >
                {mode === "login" ? "تسجيل دخول الأفراد" : "إنشاء حساب فرد جديد"}
              </h1>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-right">
                  <p className="text-red-600 text-sm font-hrsd">{error}</p>
                </div>
              )}

              {success && (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-right">
                  <p className="text-green-700 text-sm font-hrsd">{success}</p>
                </div>
              )}

              <form onSubmit={mode === "login" ? handleLogin : handleRegister} className="space-y-5">
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

                {mode === "register" && (
                  <div>
                    <label className="block text-right text-sm font-hrsd-medium mb-2 text-gray-700">
                      تأكيد كلمة المرور
                    </label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg text-right font-hrsd focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                      dir="ltr"
                      style={{ textAlign: "right" }}
                    />
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 rounded-lg text-white font-hrsd-medium text-lg transition-colors disabled:opacity-50"
                  style={{ backgroundColor: "hsl(175, 75%, 30%)" }}
                >
                  {isLoading
                    ? (mode === "login" ? "جاري تسجيل الدخول..." : "جاري إنشاء الحساب...")
                    : (mode === "login" ? "تسجيل الدخول" : "إنشاء الحساب")}
                </button>

                {mode === "login" && (
                  <div className="flex items-center justify-center pt-2">
                    <Link
                      to="/forgot-password"
                      className="text-sm font-hrsd-medium hover:underline"
                      style={{ color: "hsl(175, 75%, 30%)" }}
                    >
                      نسيت بيانات الدخول؟
                    </Link>
                  </div>
                )}
              </form>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default IndividualAuth;
