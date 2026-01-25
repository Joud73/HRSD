import { useParams, useNavigate } from "react-router-dom";
import { useRef } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import OrganizationJourney from "@/components/OrganizationJourney";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Printer, Award } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import hrsdLogo from "@/assets/logos/hrsd-colored.png";
import visionLogo from "@/assets/logos/vision-2030-colored.png";

const Certificate = () => {
  const { organizationId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const certificateRef = useRef<HTMLDivElement>(null);

  // Mock data - in production, this would come from the database
  const isCertified = true;
  const organizationName = "شركة التقنية المتقدمة";
  
  // Final result data - supports percentage OR score format
  const finalPercentage: number | null = 87; // Example: 87%
  const finalScore: number | null = null; // Example: 87 / 100
  
  const issueDate = new Date().toLocaleDateString("ar-SA", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const certificateId = `CERT-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9999)).padStart(4, "0")}`;
  const verificationCode = `VRF-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

  // Get display value for final result
  const getFinalResultDisplay = () => {
    if (finalPercentage !== null && finalPercentage !== undefined) {
      return `${finalPercentage}%`;
    }
    if (finalScore !== null && finalScore !== undefined) {
      return `${finalScore} / 100`;
    }
    return null;
  };

  const finalResultValue = getFinalResultDisplay();

  if (!isCertified) {
    return (
      <div dir="rtl" className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 flex items-center justify-center p-6">
          <Card className="max-w-md w-full shadow-lg">
            <CardContent className="p-8 text-center">
              <Award className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h2 className="text-xl font-hrsd-bold text-foreground mb-2">
                الشهادة غير متاحة
              </h2>
              <p className="text-muted-foreground mb-6">
                لم يتم اعتماد المنظمة بعد. يرجى إكمال عملية التقييم أولاً.
              </p>
              <Button onClick={() => navigate("/dashboard")} className="bg-primary">
                العودة للوحة التحكم
              </Button>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  const handleDownloadPDF = async () => {
    if (!certificateRef.current) return;

    try {
      // Create canvas from the certificate card
      const canvas = await html2canvas(certificateRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",
        logging: false,
      });

      // Calculate dimensions for A4 PDF
      const imgWidth = 210; // A4 width in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      // Create PDF
      const pdf = new jsPDF({
        orientation: imgHeight > imgWidth ? "portrait" : "landscape",
        unit: "mm",
        format: "a4",
      });

      // Add the canvas as image
      const imgData = canvas.toDataURL("image/png");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      // Center the image on the page
      const scaleFactor = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight) * 0.9;
      const scaledWidth = imgWidth * scaleFactor;
      const scaledHeight = imgHeight * scaleFactor;
      const xOffset = (pdfWidth - scaledWidth) / 2;
      const yOffset = (pdfHeight - scaledHeight) / 2;

      pdf.addImage(imgData, "PNG", xOffset, yOffset, scaledWidth, scaledHeight);
      
      // Download the PDF
      pdf.save(`Certificate-${certificateId}.pdf`);
    } catch (error) {
      console.error("Error generating PDF:", error);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div dir="rtl" className="min-h-screen flex flex-col bg-background">
      <Header />
      
      {/* Fixed header spacer */}
      <div className="h-20 print:hidden" />
      
      {/* Organization Journey */}
      <div className="print:hidden">
        <OrganizationJourney />
      </div>

      <main className="flex-1 py-12 px-4 md:px-6 print:py-0 print:px-0">
        <div className="max-w-4xl mx-auto print:max-w-none print:w-full">
          {/* Certificate Card */}
          <div 
            id="certificate-card" 
            ref={certificateRef}
            className="relative print:shadow-none"
          >
            <Card className="relative overflow-hidden border border-emerald-200/60 shadow-xl rounded-2xl print:shadow-none print:border print:rounded-none bg-white">
              {/* Subtle geometric pattern overlay */}
              <div 
                className="absolute inset-0 opacity-[0.02] pointer-events-none"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23065f46' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                }}
              />

              {/* Top decorative border - thin elegant line */}
              <div className="h-1.5 bg-gradient-to-r from-emerald-500/80 via-[hsl(45,65%,60%)]/70 to-emerald-500/80" />

              <CardContent className="relative p-8 md:p-12 lg:p-16">
                {/* Header with logos */}
                <div className="flex items-start justify-between mb-10">
                  {/* Vision 2030 logo - left */}
                  <img
                    src={visionLogo}
                    alt="رؤية 2030"
                    className="h-16 md:h-20 object-contain"
                  />
                  
                  {/* Ministry logo - right */}
                  <img
                    src={hrsdLogo}
                    alt="شعار الوزارة"
                    className="h-16 md:h-20 object-contain"
                  />
                </div>

                {/* Certificate Title */}
                <div className="text-center mb-10">
                  <div className="inline-block">
                    <h1 className="text-3xl md:text-4xl lg:text-5xl font-hrsd-title text-emerald-800 mb-4">
                      شهادة اعتماد
                    </h1>
                    <div className="flex items-center justify-center gap-2">
                      <div className="h-px w-16 bg-gradient-to-r from-transparent via-emerald-400/50 to-transparent" />
                      <div className="w-2 h-2 rotate-45 bg-emerald-500/60" />
                      <div className="h-px w-16 bg-gradient-to-r from-transparent via-emerald-400/50 to-transparent" />
                    </div>
                  </div>
                </div>

                {/* Granting text */}
                <p className="text-center text-lg md:text-xl text-muted-foreground mb-8 font-hrsd-medium">
                  تمنح وزارة الموارد البشرية والتنمية الاجتماعية هذه الشهادة إلى
                </p>

                {/* Organization Name */}
                <div className="text-center mb-8">
                  <h2 className="text-3xl md:text-4xl lg:text-5xl font-hrsd-bold text-emerald-800 leading-relaxed">
                    {organizationName}
                  </h2>
                </div>

                {/* Confirmation text */}
                <div className="text-center mb-10 max-w-2xl mx-auto">
                  <p className="text-lg md:text-xl text-foreground leading-relaxed font-hrsd-regular">
                    قد استوفت جميع معايير ومتطلبات الاعتماد المهني للتدريب
                    <br />
                    وفقًا للمعايير المعتمدة.
                  </p>
                </div>

                {/* Final Result - Soft green gradient with wave background */}
                {finalResultValue && (
                  <div className="flex justify-center mb-12">
                    <div className="relative overflow-hidden rounded-2xl shadow-md w-full max-w-sm">
                      {/* Wave background pattern */}
                      <div className="absolute inset-0">
                        <svg 
                          className="absolute bottom-0 left-0 w-full h-full" 
                          viewBox="0 0 400 200" 
                          preserveAspectRatio="none"
                        >
                          <defs>
                            <linearGradient id="waveGrad1" x1="0%" y1="0%" x2="0%" y2="100%">
                              <stop offset="0%" stopColor="hsl(152, 60%, 92%)" />
                              <stop offset="100%" stopColor="hsl(152, 55%, 88%)" />
                            </linearGradient>
                          </defs>
                          <rect fill="url(#waveGrad1)" width="100%" height="100%" />
                          <path 
                            d="M0,120 C80,160 160,100 240,130 C320,160 400,100 400,120 L400,200 L0,200 Z" 
                            fill="hsl(152, 50%, 85%)" 
                            opacity="0.5"
                          />
                          <path 
                            d="M0,150 C100,180 200,120 300,160 C350,180 400,150 400,170 L400,200 L0,200 Z" 
                            fill="hsl(152, 45%, 80%)" 
                            opacity="0.4"
                          />
                          <path 
                            d="M0,170 C120,190 240,150 360,180 C380,185 400,175 400,180 L400,200 L0,200 Z" 
                            fill="hsl(152, 40%, 75%)" 
                            opacity="0.3"
                          />
                        </svg>
                      </div>
                      
                      {/* Content */}
                      <div className="relative py-10 px-8 text-center">
                        <p className="text-sm text-emerald-700/80 font-hrsd-medium mb-3">
                          النتيجة النهائية
                        </p>
                        <p className="text-5xl md:text-6xl font-hrsd-bold text-emerald-800 tracking-wide">
                          {finalResultValue}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Decorative divider */}
                <div className="flex items-center justify-center gap-4 mb-10">
                  <div className="h-px flex-1 bg-gradient-to-r from-transparent to-emerald-200/60" />
                  <div className="flex gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400/60" />
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/60" />
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400/60" />
                  </div>
                  <div className="h-px flex-1 bg-gradient-to-l from-transparent to-emerald-200/60" />
                </div>

                {/* Bottom Section - Three Columns */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
                  {/* Issue Date */}
                  <div className="space-y-2">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-50 mb-2">
                      <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <p className="text-sm text-muted-foreground font-hrsd-medium">تاريخ الإصدار</p>
                    <p className="text-lg font-hrsd-semibold text-foreground">{issueDate}</p>
                  </div>

                  {/* Certificate ID */}
                  <div className="space-y-2">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-50 mb-2">
                      <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <p className="text-sm text-muted-foreground font-hrsd-medium">رقم الشهادة</p>
                    <p className="text-lg font-hrsd-semibold text-foreground font-mono tracking-wider">{certificateId}</p>
                  </div>

                  {/* Verification Code / QR */}
                  <div className="space-y-2">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-50 mb-2">
                      <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                      </svg>
                    </div>
                    <p className="text-sm text-muted-foreground font-hrsd-medium">كود التحقق</p>
                    <p className="text-lg font-hrsd-semibold text-foreground font-mono tracking-wider">{verificationCode}</p>
                  </div>
                </div>

                {/* Official seal placeholder */}
                <div className="flex justify-center mt-10">
                  <div className="w-24 h-24 rounded-full border-2 border-dashed border-emerald-300/50 flex items-center justify-center">
                    <span className="text-xs text-muted-foreground text-center px-2 font-hrsd-medium">
                      ختم الجهة
                      <br />
                      الرسمي
                    </span>
                  </div>
                </div>
              </CardContent>

              {/* Bottom decorative border - thin elegant line */}
              <div className="h-1.5 bg-gradient-to-r from-emerald-500/80 via-[hsl(45,65%,60%)]/70 to-emerald-500/80" />
            </Card>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-10 print:hidden">
            <Button
              onClick={handleDownloadPDF}
              size="lg"
              className="bg-primary hover:bg-primary/90 text-white px-8 py-6 text-lg font-hrsd-semibold rounded-xl shadow-lg hover:shadow-xl transition-all"
            >
              <Download className="w-5 h-5 ml-3" />
              تحميل PDF
            </Button>
            <Button
              onClick={handlePrint}
              size="lg"
              variant="outline"
              className="border-2 border-primary text-primary hover:bg-primary/5 px-8 py-6 text-lg font-hrsd-semibold rounded-xl shadow-lg hover:shadow-xl transition-all"
            >
              <Printer className="w-5 h-5 ml-3" />
              طباعة
            </Button>
          </div>
        </div>
      </main>

      <div className="print:hidden">
        <Footer />
      </div>

      {/* Print Styles - Critical for proper A4 printing */}
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 15mm;
          }
          
          html, body {
            height: 100%;
            margin: 0 !important;
            padding: 0 !important;
            overflow: visible !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          
          /* Hide everything by default */
          body > * {
            visibility: hidden !important;
          }
          
          /* Show only the certificate container */
          #certificate-card,
          #certificate-card * {
            visibility: visible !important;
          }
          
          #certificate-card {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: none !important;
            margin: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
            border-radius: 0 !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          
          /* Ensure background colors print */
          #certificate-card * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          
          /* Hide print:hidden elements */
          .print\\:hidden {
            display: none !important;
          }
          
          /* Remove shadows and rounded corners for print */
          .shadow-2xl, .shadow-lg {
            box-shadow: none !important;
          }
          
          .rounded-3xl, .rounded-2xl, .rounded-xl {
            border-radius: 0 !important;
          }
        }
      `}</style>
    </div>
  );
};

export default Certificate;
