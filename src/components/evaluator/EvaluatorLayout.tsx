import EvaluatorHeader from "./EvaluatorHeader";
import EvaluatorSidebar from "./EvaluatorSidebar";

interface EvaluatorLayoutProps {
  children: React.ReactNode;
}

const EvaluatorLayout = ({ children }: EvaluatorLayoutProps) => (
  <div dir="rtl" className="flex min-h-screen flex-col bg-[hsl(220,20%,97%)]">
    <EvaluatorHeader />
    <div className="flex flex-1 overflow-hidden">
      <EvaluatorSidebar />
      <main className="flex-1 overflow-y-auto px-8 py-7 space-y-7">
        {children}
      </main>
    </div>
  </div>
);

export default EvaluatorLayout;
