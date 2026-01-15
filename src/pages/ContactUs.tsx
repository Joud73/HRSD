import { useState } from "react";
import { Link } from "react-router-dom";
import { Send, Mail } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import heroBg from "@/assets/hero-bg.png";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

const ContactUs = () => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    organizationName: "",
    message: "",
  });
  const [isSent, setIsSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    // Validate required fields
    if (!formData.name.trim()) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال الاسم",
        variant: "destructive",
      });
      return;
    }
    if (!formData.email.trim()) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال البريد الإلكتروني",
        variant: "destructive",
      });
      return;
    }
    if (!formData.message.trim()) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال الرسالة",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    // Fallback to mailto since no edge function is configured
    const subject = encodeURIComponent("تواصل معنا");
    const body = encodeURIComponent(
      `الاسم: ${formData.name}\nالبريد الإلكتروني: ${formData.email}\nالهاتف: ${formData.phone}\nاسم الجمعية: ${formData.organizationName}\n\nالرسالة:\n${formData.message}`
    );
    
    // Open mailto as fallback
    window.open(`mailto:joudAldhuwaihi@aol.edu.sa?subject=${subject}&body=${body}`, "_blank");

    // Simulate success
    setTimeout(() => {
      setIsLoading(false);
      setIsSent(true);
      toast({
        title: "تم الإرسال",
        description: "تم إرسال رسالتك بنجاح",
      });
      // Reset form
      setFormData({
        name: "",
        email: "",
        phone: "",
        organizationName: "",
        message: "",
      });
    }, 500);
  };

  const handleDirectEmail = () => {
    const subject = encodeURIComponent("تواصل معنا");
    const body = encodeURIComponent(
      `الاسم: \nالبريد الإلكتروني: \nاسم الجمعية: \n\nالرسالة:\n`
    );
    window.open(`mailto:joudAldhuwaihi@aol.edu.sa?subject=${subject}&body=${body}`, "_blank");
  };

  return (
    <div className="min-h-screen flex flex-col" dir="rtl">
      <Header />

      {/* Main Content with Background */}
      <main
        className="flex-1 pt-24 pb-12"
        style={{
          backgroundImage: `url(${heroBg})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundAttachment: "fixed",
        }}
      >
        <div className="container mx-auto px-4 max-w-4xl">
          {/* Breadcrumb */}
          <div className="mb-6">
            <nav className="flex items-center gap-2 text-white text-sm font-hrsd-medium">
              <Link to="/dashboard" className="hover:underline">
                العودة إلى الصفحة الرئيسية
              </Link>
              <span className="text-accent">&gt;</span>
              <span className="text-accent">بيانات التواصل</span>
            </nav>
            {/* Orange divider */}
            <div className="w-full h-0.5 bg-accent mt-3" />
          </div>

          {/* Form Card - "اكتب لنا" */}
          <div className="bg-white/95 rounded-2xl shadow-lg p-8 mb-6">
            {/* Title */}
            <h2 className="text-2xl font-hrsd-semibold text-accent text-right mb-2">
              اكتب لنا
            </h2>
            {/* Animated blue line */}
            <div className="relative h-1 bg-gray-200 rounded-full mb-8 overflow-hidden">
              <div
                className={`absolute top-0 h-full w-16 bg-primary rounded-full transition-all duration-500 ease-in-out ${
                  isSent ? "right-auto left-0" : "left-auto right-0"
                }`}
              />
            </div>

            {/* Form Fields */}
            <div className="space-y-6">
              {/* Name Field */}
              <div>
                <label className="block text-right text-sm font-hrsd-medium text-gray-700 mb-2">
                  الاسم
                </label>
                <Input
                  type="text"
                  placeholder="الاسم الكامل"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  className="w-full text-right bg-gray-50 border-gray-200 focus:border-primary"
                  dir="rtl"
                />
              </div>

              {/* Email and Phone Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-right text-sm font-hrsd-medium text-gray-700 mb-2">
                    البريد الإلكتروني
                  </label>
                  <Input
                    type="email"
                    placeholder="البريد الخاص بك"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    className="w-full text-right bg-gray-50 border-gray-200 focus:border-primary"
                    dir="rtl"
                  />
                </div>
                <div>
                  <label className="block text-right text-sm font-hrsd-medium text-gray-700 mb-2">
                    الهاتف
                  </label>
                  <Input
                    type="tel"
                    placeholder="الجوال الخاص بك"
                    value={formData.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    className="w-full text-right bg-gray-50 border-gray-200 focus:border-primary"
                    dir="rtl"
                  />
                </div>
              </div>

              {/* Message Field */}
              <div>
                <label className="block text-right text-sm font-hrsd-medium text-gray-700 mb-2">
                  الرسالة
                </label>
                <Textarea
                  placeholder="نص الرسالة"
                  value={formData.message}
                  onChange={(e) => handleInputChange("message", e.target.value)}
                  className="w-full min-h-[150px] text-right bg-gray-50 border-gray-200 focus:border-primary resize-none"
                  dir="rtl"
                />
              </div>

              {/* Submit Button */}
              <div className="flex justify-start">
                <Button
                  onClick={handleSubmit}
                  disabled={isLoading}
                  className="bg-primary hover:bg-primary/90 text-white px-8 py-3 rounded-lg font-hrsd-medium flex items-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  {isLoading ? "جاري الإرسال..." : "إرسال"}
                </Button>
              </div>
            </div>
          </div>

          {/* Direct Contact Card - "تفاعل مباشر" */}
          <div className="bg-white/95 rounded-2xl shadow-lg p-8">
            {/* Title */}
            <h2 className="text-2xl font-hrsd-semibold text-accent text-right mb-2">
              تفاعل مباشر
            </h2>
            {/* Blue line */}
            <div className="relative h-1 bg-gray-200 rounded-full mb-8 overflow-hidden">
              <div className="absolute top-0 right-0 h-full w-16 bg-primary rounded-full" />
            </div>

            {/* Email Button */}
            <div className="flex justify-start">
              <Button
                onClick={handleDirectEmail}
                className="bg-primary hover:bg-primary/90 text-white px-8 py-3 rounded-lg font-hrsd-medium flex items-center gap-2"
              >
                <Mail className="w-4 h-4" />
                بريد إلكتروني
              </Button>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ContactUs;
