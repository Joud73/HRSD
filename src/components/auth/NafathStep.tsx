import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, Hourglass } from "lucide-react";
import { authCopy } from "@/lib/copy";
import NafathIcon from "@/components/icons/NafathIcon";
import { Button } from "@/components/ui/button";
import { AuthStatus, authButtonClass } from "@/components/auth/AuthParts";

/**
 * Nafath approval step shown inside /login. Same simulated flow as the former /nafath-auth page:
 * confirming stores authRole=nafath and opens the organization dashboard after 1.5s.
 */
const NafathStep = ({ onCancel }: { onCancel: () => void }) => {
  const navigate = useNavigate();
  const [status, setStatus] = useState<"pending" | "success">("pending");
  const timer = useRef<number>();

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const handleSimulateSuccess = () => {
    setStatus("success");
    localStorage.setItem("authRole", "nafath");
    timer.current = window.setTimeout(() => navigate("/dashboard", { replace: true }), 1500);
  };

  if (status === "success") {
    return (
      <AuthStatus
        icon={CheckCircle2}
        tone="success"
        title={authCopy.nafath_success_title}
        description={authCopy.nafath_success_desc}
      />
    );
  }

  return (
    <section className="flex flex-col gap-6">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
        <NafathIcon size={28} />
      </span>
      <div className="flex flex-col gap-2">
        <h1 className="text-h2 text-ink">{authCopy.nafath_title}</h1>
        <p className="text-body text-muted-foreground">{authCopy.nafath_desc}</p>
      </div>

      <div
        aria-live="polite"
        className="flex items-center gap-3 rounded-md border border-border bg-section-alt px-4 py-3 text-small font-hrsd-medium text-ink"
      >
        <Hourglass aria-hidden className="h-4 w-4 shrink-0 text-primary" />
        {authCopy.nafath_waiting}
      </div>

      <div className="flex flex-col gap-3 pt-2">
        <Button type="button" onClick={handleSimulateSuccess} className={authButtonClass}>
          {authCopy.nafath_confirm}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} className={authButtonClass}>
          {authCopy.nafath_cancel}
        </Button>
        <p className="text-caption text-muted-foreground">{authCopy.nafath_demo_note}</p>
      </div>
    </section>
  );
};

export default NafathStep;
