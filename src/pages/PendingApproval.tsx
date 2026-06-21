import { useNavigate } from "react-router-dom";
import { Hourglass, LogOut } from "lucide-react";
import AppHeader from "@/components/AppHeader";
import Footer from "@/components/Footer";
import { useAuth } from "@/context/AuthContext";
import loginBg from "@/assets/hero-bg.png";

const PendingApproval = () => {
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    navigate("/login", { replace: true });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <AppHeader />
      <div className="h-20" />

      <main
        className="flex-1 relative"
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

        <div className="relative z-10 container mx-auto px-4 py-16">
          <div className="max-w-lg mx-auto">
            <div
              className="rounded-xl p-10 shadow-lg text-center"
              style={{ backgroundColor: "rgba(255, 255, 255, 0.97)" }}
              dir="rtl"
            >
              <div
                className="w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-6"
                style={{ backgroundColor: "hsl(35, 91%, 92%)" }}
              >
                <Hourglass
                  className="w-10 h-10"
                  style={{ color: "hsl(35, 91%, 54%)" }}
                />
              </div>

              <h1
                className="text-2xl font-hrsd-bold mb-4"
                style={{ color: "hsl(35, 91%, 54%)" }}
              >
                طلبك قيد المراجعة
              </h1>

              <p className="text-gray-600 font-hrsd mb-3 leading-relaxed">
                تم استلام طلب تسجيل المنظمة بنجاح.
              </p>
              <p className="text-gray-500 font-hrsd mb-8 leading-relaxed">
                سيتم مراجعة الطلب من قبل مدير النظام وتفعيل حسابكم في أقرب وقت.
              </p>

              <button
                type="button"
                onClick={handleSignOut}
                className="w-full py-3 rounded-lg font-hrsd-medium text-lg transition-colors border-2 hover:bg-gray-50 flex items-center justify-center gap-2"
                style={{
                  borderColor: "hsl(175, 75%, 30%)",
                  color: "hsl(175, 75%, 30%)",
                }}
              >
                <LogOut className="w-5 h-5" />
                تسجيل الخروج
              </button>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default PendingApproval;
