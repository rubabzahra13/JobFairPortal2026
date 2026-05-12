"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { saveCvPdf } from "@/lib/cv-storage";
import { saveSubmission, generateSubmissionId } from "@/lib/submissions";
import { Upload, FileText, CheckCircle2, Loader2, AlertCircle, Zap } from "lucide-react";

type Status = "idle" | "uploading" | "success" | "error";

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.type === "application/pdf") {
        setFile(droppedFile);
        setError(null);
      } else {
        setError("Please upload a PDF file");
      }
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.type === "application/pdf") {
        setFile(selectedFile);
        setError(null);
      } else {
        setError("Please upload a PDF file");
      }
    }
  };

  const handleSubmit = async () => {
    if (!file) return;

    setStatus("uploading");
    setError(null);

    try {
      // Send file to API for parsing
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/parse-cv", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to parse CV");
      }

      const id = generateSubmissionId();
      let cvStored = false;
      try {
        await saveCvPdf(id, file);
        cvStored = true;
      } catch (storeErr) {
        console.error("CV file storage failed:", storeErr);
      }

      // Save submission
      const submission = {
        id,
        name: result.data.name || "",
        email: result.data.email || "",
        phone: result.data.phone || "",
        degree: result.data.degree || "",
        university: result.data.university || "",
        batch: result.data.batch || "",
        experience: result.data.experience || "",
        skills: result.data.skills || "",
        hometown: result.data.hometown || "",
        cvText: result.cvText || "",
        cvFileName: file.name,
        cvStored,
        status: "pending" as const,
        submittedAt: new Date().toISOString(),
      };

      saveSubmission(submission);
      setStatus("success");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setStatus("error");
    }
  };

  const resetForm = () => {
    setFile(null);
    setStatus("idle");
    setError(null);
  };

  if (status === "success") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20 mx-auto">
            <CheckCircle2 className="h-8 w-8 text-emerald-400" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold">CV Submitted!</h1>
            <p className="text-muted-foreground">
              Thank you for your interest in VECTOR AI. Our team will review your
              application and reach out if there's a fit.
            </p>
          </div>
          <p className="text-sm text-muted-foreground">
            Feel free to visit our booth to chat with the team!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary mx-auto">
            <Zap className="h-6 w-6 text-primary-foreground" fill="currentColor" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">VECTOR AI</h1>
            <p className="text-muted-foreground mt-1">Job Fair 2026</p>
          </div>
        </div>

        {/* Upload card */}
        <div className="rounded-xl border border-border bg-card p-6 space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-lg font-semibold">Upload Your CV</h2>
            <p className="text-sm text-muted-foreground">
              We'll extract your info to speed up the evaluation process
            </p>
          </div>

          {/* Drop zone */}
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={cn(
              "relative rounded-lg border-2 border-dashed p-8 text-center transition-colors",
              dragActive
                ? "border-primary bg-primary/5"
                : "border-border hover:border-muted-foreground/50",
              file && "border-emerald-500/50 bg-emerald-500/5"
            )}
          >
            <input
              type="file"
              accept=".pdf"
              onChange={handleFileChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              disabled={status === "uploading"}
            />

            {file ? (
              <div className="space-y-2">
                <FileText className="h-10 w-10 mx-auto text-emerald-400" />
                <p className="font-medium text-sm">{file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <Upload className="h-10 w-10 mx-auto text-muted-foreground" />
                <p className="font-medium text-sm">
                  Drop your CV here or click to browse
                </p>
                <p className="text-xs text-muted-foreground">PDF only, max 10MB</p>
              </div>
            )}
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Submit button */}
          <Button
            onClick={handleSubmit}
            disabled={!file || status === "uploading"}
            className="w-full h-11"
          >
            {status === "uploading" ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Analyzing CV...
              </>
            ) : (
              "Submit CV"
            )}
          </Button>

          {status === "error" && (
            <Button variant="ghost" onClick={resetForm} className="w-full">
              Try Again
            </Button>
          )}
        </div>

        <p className="text-center text-xs text-muted-foreground">
          Your data will be used solely for recruitment purposes at VECTOR AI.
        </p>
      </div>
    </div>
  );
}
