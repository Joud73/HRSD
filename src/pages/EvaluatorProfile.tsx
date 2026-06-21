import EvaluatorLayout from "@/components/evaluator/EvaluatorLayout";
import { useAuth } from "@/context/AuthContext";
import { UserCircle, Mail, Shield } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const EvaluatorProfile = () => {
  const { user } = useAuth();

  return (
    <EvaluatorLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-hrsd-bold text-foreground">الملف الشخصي</h1>

        <Card className="max-w-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <UserCircle className="h-5 w-5 text-primary" />
              معلومات الحساب
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">البريد الإلكتروني</p>
                <p className="text-sm font-hrsd-medium text-foreground">{user?.email ?? "—"}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Shield className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">الدور</p>
                <p className="text-sm font-hrsd-medium text-foreground">مقيّم</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </EvaluatorLayout>
  );
};

export default EvaluatorProfile;
