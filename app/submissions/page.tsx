"use client";

import { useState, useEffect, useCallback } from "react";
import { Submission, getSubmissions, deleteSubmission } from "@/lib/submissions";
import { ViewCvButton } from "@/components/submissions/view-cv-button";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  FileText,
  Play,
  Trash2,
  CheckCircle2,
  Clock,
  ExternalLink,
  Inbox,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "@/lib/date-utils";

export default function SubmissionsPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const refresh = useCallback(() => {
    setSubmissions(getSubmissions());
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleDelete = (id: string) => {
    deleteSubmission(id);
    setDeleteId(null);
    refresh();
  };

  const pendingCount = submissions.filter((s) => s.status === "pending").length;
  const evaluatedCount = submissions.filter((s) => s.status === "evaluated").length;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">CV Submissions</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {pendingCount} pending review · {evaluatedCount} evaluated
          </p>
        </div>
        <ButtonLink href="/upload" variant="outline" className="gap-2">
          <ExternalLink className="h-4 w-4" />
          QR Upload Page
        </ButtonLink>
      </div>

      {/* Table */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-lg" />
          ))}
        </div>
      ) : submissions.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-20 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary mb-4">
            <Inbox className="h-6 w-6 text-muted-foreground" />
          </div>
          <h2 className="text-base font-semibold">No submissions yet</h2>
          <p className="text-sm text-muted-foreground mt-1 max-w-xs">
            Share the QR code upload link with candidates. Their CVs will appear here.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
          <Table>
            <TableHeader>
              <TableRow className="border-border bg-muted/30 hover:bg-muted/30">
                <TableHead className="h-11 px-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Candidate
                </TableHead>
                <TableHead className="h-11 min-w-[148px] px-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  CV
                </TableHead>
                <TableHead className="h-11 min-w-[160px] px-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Education
                </TableHead>
                <TableHead className="h-11 min-w-[140px] max-w-[260px] px-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Experience
                </TableHead>
                <TableHead className="h-11 px-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Status
                </TableHead>
                <TableHead className="h-11 px-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Submitted
                </TableHead>
                <TableHead className="h-11 w-[200px] px-3 text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {submissions.map((submission, index) => (
                <TableRow
                  key={submission.id}
                  className={cn(
                    "border-border group transition-colors",
                    index % 2 === 1 && "bg-muted/15"
                  )}
                >
                  <TableCell className="align-top whitespace-normal py-3.5 px-3">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary ring-1 ring-border">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="min-w-0 space-y-0.5 pt-0.5">
                        <p className="text-sm font-semibold leading-snug text-foreground">
                          {submission.name || "Unknown"}
                        </p>
                        {submission.email ? (
                          <p className="break-all text-[11px] leading-relaxed text-muted-foreground">
                            {submission.email}
                          </p>
                        ) : null}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="align-top whitespace-normal py-3.5 px-3">
                    <div className="flex max-w-[200px] flex-col gap-2">
                      <div className="min-w-0 space-y-1">
                        <p
                          className="text-xs font-medium leading-snug text-foreground"
                          title={submission.cvFileName}
                        >
                          {submission.cvFileName || "—"}
                        </p>
                        {submission.cvStored === false ? (
                          <p className="text-[10px] leading-snug text-amber-500">PDF not stored</p>
                        ) : null}
                      </div>
                      <ViewCvButton
                        submissionId={submission.id}
                        label="View PDF"
                        className="w-fit shrink-0"
                      />
                    </div>
                  </TableCell>
                  <TableCell className="align-top whitespace-normal py-3.5 px-3">
                    <div className="max-w-[240px] space-y-1">
                      <p className="text-xs font-medium leading-snug text-foreground">
                        {submission.degree || "—"}
                      </p>
                      {(submission.university || submission.batch) && (
                        <p className="text-[11px] leading-relaxed text-muted-foreground">
                          {[submission.university, submission.batch].filter(Boolean).join(" · ")}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="align-top whitespace-normal py-3.5 px-3">
                    <p className="max-w-[260px] text-xs leading-relaxed text-muted-foreground">
                      {submission.experience || "—"}
                    </p>
                  </TableCell>
                  <TableCell className="align-top whitespace-nowrap py-3.5 px-3">
                    <Badge
                      variant="outline"
                      className={cn(
                        "inline-flex h-7 items-center gap-1 px-2 text-[10px] font-medium",
                        submission.status === "pending" &&
                          "border-amber-500/35 bg-amber-500/10 text-amber-400",
                        submission.status === "evaluated" &&
                          "border-emerald-500/35 bg-emerald-500/10 text-emerald-400"
                      )}
                    >
                      {submission.status === "pending" && (
                        <Clock className="h-3 w-3 shrink-0" />
                      )}
                      {submission.status === "evaluated" && (
                        <CheckCircle2 className="h-3 w-3 shrink-0" />
                      )}
                      {submission.status === "pending" ? "Pending" : "Evaluated"}
                    </Badge>
                  </TableCell>
                  <TableCell className="align-top whitespace-nowrap py-3.5 px-3">
                    <span className="text-xs tabular-nums text-muted-foreground">
                      {formatDistanceToNow(submission.submittedAt)}
                    </span>
                  </TableCell>
                  <TableCell className="align-top py-3.5 px-3 text-right">
                    <div className="flex flex-nowrap items-center justify-end gap-1.5">
                      {submission.status === "pending" && (
                        <ButtonLink
                          href={`/candidates/new?submission=${submission.id}`}
                          variant="default"
                          size="sm"
                          className="h-8 shrink-0 gap-1.5 px-2.5 text-xs"
                        >
                          <Play className="h-3.5 w-3.5 shrink-0" />
                          Evaluate
                        </ButtonLink>
                      )}
                      {submission.status === "evaluated" && submission.candidateId && (
                        <ButtonLink
                          href={`/candidates/${submission.candidateId}`}
                          variant="outline"
                          size="sm"
                          className="h-8 shrink-0 gap-1.5 px-2.5 text-xs"
                        >
                          Evaluation
                        </ButtonLink>
                      )}
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                        title="Remove submission"
                        onClick={() => setDeleteId(submission.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Delete dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete submission?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove this CV submission.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-secondary border-border">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteId && handleDelete(deleteId)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
