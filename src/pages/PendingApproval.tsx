import { useNavigate } from "react-router-dom";
import { Hourglass, LogOut } from "lucide-react";
import { copy, authCopy } from "@/lib/copy";
import { useAuth } from "@/context/AuthContext";
import { AuthHelpLinks, AuthStatus, authButtonClass } from "@/components/auth/AuthParts";
import AuthShell from "@/components/auth/AuthShell";
import StatusBadge from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";

const PendingApproval = () => {
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    navigate("/login", { replace: true });
  };

  return (
    <AuthShell crumb={authCopy.pending_title} below={<AuthHelpLinks />}>
      <AuthStatus
        icon={Hourglass}
        title={authCopy.pending_title}
        description={authCopy.pending_desc}
        meta={<StatusBadge status="submitted" className="self-start" />}
      >
        <Button type="button" variant="outline" onClick={handleSignOut} className={authButtonClass}>
          <LogOut aria-hidden />
          {copy.logout}
        </Button>
      </AuthStatus>
    </AuthShell>
  );
};

export default PendingApproval;
