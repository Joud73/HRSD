import { useState, useEffect } from "react";
import { useParams, useNavigate, Navigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowRight,
  Save,
  Send,
  Download,
  FileCheck,
  MessageSquare,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import StatusBadge from "@/components/admin/StatusBadge";
import EvaluatorLayout from "@/components/evaluator/EvaluatorLayout";
import { statusLabelMap } from "@/hooks/useEvaluatorAssignments";

/* ── Types ── */
interface CriterionScore {
  criterion_id: string;
  score: string;
  notes: string;
  status: string;
}

/* ── Component ── */
const EvaluationDetails = () => {
  const { assignmentId } = useParams<{ assignmentId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [scores, setScores] = useState<Record<string, CriterionScore>>({});
  const [message, setMessage] = useState("");
  const [assignmentStatus, setAssignmentStatus] = useState("");

  /* ── Fetch assignment ── */
  const { data: assignment, isLoading: loadingAssignment } = useQuery({
    queryKey: ["assignment", assignmentId],
    enabled: !!assignmentId && !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("evaluator_assignments")
        .select("*")
        .eq("id", assignmentId!)
        .eq("evaluator_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  /* ── Fetch organization details ── */
  const { data: organization } = useQuery({
    queryKey: ["organization-details", assignment?.organization_id],
    enabled: !!assignment?.organization_id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("organizations")
        .select("*")
        .eq("id", assignment!.organization_id!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  /* ── Fetch criteria ── */
  const { data: criteria } = useQuery({
    queryKey: ["evaluation-criteria"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("evaluation_criteria")
        .select("*")
        .order("sort_order");
      if (error) throw error;
      return data || [];
    },
  });

  /* ── Fetch existing evaluations ── */
  const { data: existingEvals } = useQuery({
    queryKey: ["criterion-evaluations", assignmentId],
    enabled: !!assignmentId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("criterion_evaluations")
        .select("*")
        .eq("assignment_id", assignmentId!);
      if (error) throw error;
      return data || [];
    },
  });

  /* ── Fetch messages ── */
  const { data: messages } = useQuery({
    queryKey: ["evaluation-messages", assignmentId],
    enabled: !!assignmentId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("evaluation_messages")
        .select("*")
        .eq("assignment_id", assignmentId!)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data || [];
    },
  });

  /* ── Fetch evidences ── */
  const { data: evidences } = useQuery({
    queryKey: ["evaluation-evidences", assignmentId],
    enabled: !!assignmentId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("evaluation_evidences")
        .select("*")
        .eq("assignment_id", assignmentId!);
      if (error) throw error;
      return data || [];
    },
  });

  /* ── Seed scores from existing evals ── */
  useEffect(() => {
    if (existingEvals && existingEvals.length > 0) {
      const map: Record<string, CriterionScore> = {};
      existingEvals.forEach((e: any) => {
        map[e.criterion_id] = {
          criterion_id: e.criterion_id,
          score: e.score?.toString() || "",
          notes: e.notes || "",
          status: e.status,
        };
      });
      setScores(map);
    }
  }, [existingEvals]);

  useEffect(() => {
    if (assignment) setAssignmentStatus(assignment.status);
  }, [assignment]);

  /* ── Save draft mutation ── */
  const saveDraft = useMutation({
    mutationFn: async () => {
      const upserts = Object.values(scores).map((s) => ({
        assignment_id: assignmentId!,
        criterion_id: s.criterion_id,
        score: s.score ? Number(s.score) : null,
        notes: s.notes || null,
        status: s.status || "pending",
      }));

      if (upserts.length > 0) {
        const { error } = await supabase
          .from("criterion_evaluations")
          .upsert(upserts, { onConflict: "assignment_id,criterion_id" });
        if (error) throw error;
      }

      // Update assignment status
      if (assignmentStatus && assignmentStatus !== assignment?.status) {
        const { error } = await supabase
          .from("evaluator_assignments")
          .update({ status: assignmentStatus })
          .eq("id", assignmentId!);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast({ title: "تم الحفظ", description: "تم حفظ المسودة بنجاح" });
      queryClient.invalidateQueries({ queryKey: ["criterion-evaluations", assignmentId] });
      queryClient.invalidateQueries({ queryKey: ["assignment", assignmentId] });
      queryClient.invalidateQueries({ queryKey: ["evaluator-assignments"] });
    },
    onError: () => {
      toast({ title: "خطأ", description: "حدث خطأ أثناء الحفظ", variant: "destructive" });
    },
  });

  /* ── Send message mutation ── */
  const sendMessage = useMutation({
    mutationFn: async () => {
      if (!message.trim()) return;
      const { error } = await supabase
        .from("evaluation_messages")
        .insert({
          assignment_id: assignmentId!,
          sender_id: user!.id,
          message: message.trim(),
        });
      if (error) throw error;
    },
    onSuccess: () => {
      setMessage("");
      toast({ title: "تم الإرسال", description: "تم إرسال الملاحظات للجمعية" });
      queryClient.invalidateQueries({ queryKey: ["evaluation-messages", assignmentId] });
    },
    onError: () => {
      toast({ title: "خطأ", description: "حدث خطأ أثناء الإرسال", variant: "destructive" });
    },
  });

  /* ── Score updater ── */
  const updateScore = (criterionId: string, field: keyof CriterionScore, value: string) => {
    setScores((prev) => ({
      ...prev,
      [criterionId]: {
        ...prev[criterionId],
        criterion_id: criterionId,
        score: prev[criterionId]?.score || "",
        notes: prev[criterionId]?.notes || "",
        status: prev[criterionId]?.status || "pending",
        [field]: value,
      },
    }));
  };

  /* ── Guards ── */
  if (loadingAssignment) {
    return (
      <EvaluatorLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </EvaluatorLayout>
    );
  }

  if (!assignment) {
    return <Navigate to="/evaluator/assignments" replace />;
  }

  /* ── Group criteria by track ── */
  const tracks = (criteria || []).reduce<Record<string, any[]>>((acc, c: any) => {
    if (!acc[c.track_name]) acc[c.track_name] = [];
    acc[c.track_name].push(c);
    return acc;
  }, {});

  const getEvidencesForCriterion = (criterionId: string) =>
    (evidences || []).filter((e: any) => e.criterion_id === criterionId);

  return (
    <EvaluatorLayout>
      {/* Back button + title */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9"
          onClick={() => navigate("/evaluator/assignments")}
        >
          <ArrowRight className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-xl font-hrsd-title text-foreground">تفاصيل التقييم</h1>
          <p className="text-sm font-hrsd text-muted-foreground mt-0.5">
            {organization?.name || "جمعية غير معروفة"}
          </p>
        </div>
      </div>

      {/* General info card */}
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <h3 className="text-sm font-hrsd-semibold text-foreground mb-4">المعلومات العامة</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <span className="text-xs font-hrsd text-muted-foreground">اسم الجمعية</span>
            <p className="text-sm font-hrsd-medium mt-0.5">
              {organization?.name || "—"}
            </p>
          </div>
          <div>
            <span className="text-xs font-hrsd text-muted-foreground">رقم التسجيل</span>
            <p className="text-sm font-hrsd-medium mt-0.5">
              {organization?.registration_number || "—"}
            </p>
          </div>
          <div>
            <span className="text-xs font-hrsd text-muted-foreground">السنة</span>
            <p className="text-sm font-hrsd-medium mt-0.5">{assignment.year}</p>
          </div>
          <div>
            <span className="text-xs font-hrsd text-muted-foreground">الحالة</span>
            <div className="mt-1">
              <Select value={assignmentStatus} onValueChange={setAssignmentStatus}>
                <SelectTrigger className="w-44 text-xs font-hrsd-medium h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(statusLabelMap).map(([k, v]) => (
                    <SelectItem key={k} value={k}>
                      {v}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      {/* Criteria by track */}
      {Object.entries(tracks).map(([trackName, trackCriteria]) => (
        <div key={trackName} className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
          <div className="border-b border-border bg-muted/30 px-6 py-3">
            <h3 className="text-sm font-hrsd-semibold text-foreground">مساق: {trackName}</h3>
          </div>
          <div className="divide-y divide-border">
            {trackCriteria.map((criterion: any) => {
              const cEvids = getEvidencesForCriterion(criterion.id);
              const cScore = scores[criterion.id];

              return (
                <div key={criterion.id} className="px-6 py-5 space-y-4">
                  <div>
                    <h4 className="text-sm font-hrsd-semibold text-foreground">
                      {criterion.criterion_name}
                    </h4>
                    {criterion.description && (
                      <p className="text-xs font-hrsd text-muted-foreground mt-1">
                        {criterion.description}
                      </p>
                    )}
                  </div>

                  {/* Evidences */}
                  {cEvids.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-xs font-hrsd-medium text-muted-foreground flex items-center gap-1.5">
                        <FileCheck className="h-3.5 w-3.5" />
                        الشواهد المرفوعة ({cEvids.length})
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {cEvids.map((ev: any) => (
                          <a
                            key={ev.id}
                            href={ev.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-hrsd text-foreground hover:bg-muted transition-colors"
                          >
                            <Download className="h-3 w-3" />
                            {ev.file_name}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Score + Notes */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-hrsd-medium text-muted-foreground mb-1 block">
                        الدرجة
                      </label>
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        placeholder="0 - 100"
                        className="text-sm font-hrsd h-9"
                        value={cScore?.score || ""}
                        onChange={(e) =>
                          updateScore(criterion.id, "score", e.target.value)
                        }
                      />
                    </div>
                    <div>
                      <label className="text-xs font-hrsd-medium text-muted-foreground mb-1 block">
                        الملاحظات
                      </label>
                      <Textarea
                        placeholder="أضف ملاحظاتك هنا..."
                        className="text-sm font-hrsd min-h-[36px] resize-none"
                        value={cScore?.notes || ""}
                        onChange={(e) =>
                          updateScore(criterion.id, "notes", e.target.value)
                        }
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* Actions bar */}
      <div className="flex flex-wrap items-center gap-3">
        <Button
          onClick={() => saveDraft.mutate()}
          disabled={saveDraft.isPending}
          className="gap-2 font-hrsd-medium"
        >
          <Save className="h-4 w-4" />
          حفظ كمسودة
        </Button>
      </div>

      {/* Messages / feedback section */}
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-4">
        <h3 className="text-sm font-hrsd-semibold text-foreground flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-primary" />
          إرسال ملاحظات للجمعية
        </h3>

        {(messages || []).length > 0 && (
          <div className="space-y-2 max-h-48 overflow-y-auto border border-border rounded-lg p-3">
            {(messages || []).map((m: any) => (
              <div key={m.id} className="text-xs font-hrsd text-foreground bg-muted/50 rounded-lg px-3 py-2">
                <span className="text-muted-foreground">
                  {new Date(m.created_at).toLocaleDateString("ar-SA")}
                </span>
                <p className="mt-0.5">{m.message}</p>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-3">
          <Textarea
            placeholder="اكتب رسالتك هنا..."
            className="text-sm font-hrsd flex-1 min-h-[40px] resize-none"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
          <Button
            variant="outline"
            onClick={() => sendMessage.mutate()}
            disabled={sendMessage.isPending || !message.trim()}
            className="gap-2 font-hrsd-medium shrink-0"
          >
            <Send className="h-4 w-4" />
            إرسال
          </Button>
        </div>
      </div>
    </EvaluatorLayout>
  );
};

export default EvaluationDetails;
