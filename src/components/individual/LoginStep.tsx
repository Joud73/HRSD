import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Lock } from "lucide-react";
import NafathIcon from "@/components/icons/NafathIcon";
import { useState } from "react";

interface LoginStepProps {
  onComplete: () => void;
}

const LoginStep = ({ onComplete }: LoginStepProps) => {
  const [loginMethod, setLoginMethod] = useState<"email" | "nafath" | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleEmailLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate login success
    onComplete();
  };

  const handleNafathLogin = () => {
    // Simulate Nafath login
    onComplete();
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-8 max-w-md mx-auto" dir="rtl">
      <h3 
        className="text-2xl font-hrsd-title text-center mb-6"
        style={{ color: "hsl(175, 75%, 30%)" }}
      >
        التسجيل / تسجيل الدخول
      </h3>
      
      <p className="text-gray-600 text-center mb-8 font-hrsd">
        اختر طريقة تسجيل الدخول المناسبة لك
      </p>

      {!loginMethod && (
        <div className="space-y-4">
          <Button
            variant="outline"
            className="w-full h-14 text-lg font-hrsd-semibold border-2 hover:border-primary hover:bg-primary/5 transition-all"
            onClick={() => setLoginMethod("email")}
          >
            <Mail className="w-5 h-5 ml-3" />
            البريد الإلكتروني وكلمة المرور
          </Button>
          
          <Button
            variant="outline"
            className="w-full h-14 text-lg font-hrsd-semibold border-2 hover:border-primary hover:bg-primary/5 transition-all"
            onClick={() => setLoginMethod("nafath")}
          >
            <NafathIcon className="w-6 h-6 ml-3" />
            الدخول عبر نفاذ
          </Button>
        </div>
      )}

      {loginMethod === "email" && (
        <form onSubmit={handleEmailLogin} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email" className="font-hrsd-semibold">
              البريد الإلكتروني
            </Label>
            <div className="relative">
              <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pr-11 h-12 font-hrsd"
                placeholder="أدخل بريدك الإلكتروني"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="font-hrsd-semibold">
              كلمة المرور
            </Label>
            <div className="relative">
              <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pr-11 h-12 font-hrsd"
                placeholder="أدخل كلمة المرور"
                required
              />
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              className="flex-1 h-12 font-hrsd-semibold"
              onClick={() => setLoginMethod(null)}
            >
              رجوع
            </Button>
            <Button
              type="submit"
              className="flex-1 h-12 font-hrsd-semibold bg-primary hover:bg-primary/90"
            >
              تسجيل الدخول
            </Button>
          </div>
        </form>
      )}

      {loginMethod === "nafath" && (
        <div className="text-center space-y-6">
          <div className="w-24 h-24 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
            <NafathIcon className="w-12 h-12" />
          </div>
          
          <p className="text-gray-600 font-hrsd">
            سيتم توجيهك إلى بوابة نفاذ لإتمام عملية تسجيل الدخول
          </p>

          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              className="flex-1 h-12 font-hrsd-semibold"
              onClick={() => setLoginMethod(null)}
            >
              رجوع
            </Button>
            <Button
              type="button"
              className="flex-1 h-12 font-hrsd-semibold bg-primary hover:bg-primary/90"
              onClick={handleNafathLogin}
            >
              متابعة عبر نفاذ
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoginStep;
