import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";

export const Route = createFileRoute("/upload")({
  component: UploadComponent,
});

export function UploadComponent() {
  const { token } = useAuth();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<
    "idle" | "uploading" | "success" | "error"
  >("idle");
  const [uploadResult, setUploadResult] = useState<string>("");

  const handleFileSelect = (file: File) => {
    if (!file.name.toLowerCase().endsWith(".zip")) {
      setUploadStatus("error");
      setUploadResult("Please select a ZIP file containing your Spotify data.");
      return;
    }

    if (file.size > 250 * 1024 * 1024) {
      setUploadStatus("error");
      setUploadResult("File size exceeds 250MB limit.");
      return;
    }

    setSelectedFile(file);
    setUploadStatus("idle");
    setUploadResult("");
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleUpload = async (file: File) => {
    if (!selectedFile) return;

    setUploadStatus("uploading");
    setUploadResult("Processing your Spotify data...");

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const response = await fetch("/api/upload", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        setUploadStatus("success");
        setUploadResult(`Success! ${result.message}`);
      } else {
        setUploadStatus("error");
        setUploadResult(`Error: ${result.message}`);
      }
    } catch (error) {
      setUploadStatus("error");
      setUploadResult("Network error. Please try again.");
    }
  };

  return (
    <div className="container mx-auto max-w-2xl py-12">
      <h1 className="text-4xl font-bold text-center mb-12 text-primary">
        Upload Your Spotify Data
      </h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">
            Select your streaming history
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <input
            type="file"
            accept=".zip"
            onChange={handleFileInputChange}
            className="hidden"
            id="file-input"
            data-testid="file-input"
          />

          <div
            className="border-2 border-dashed border-border rounded-lg p-16 text-center cursor-pointer transition-all duration-200 hover:border-primary hover:bg-muted/30"
            onClick={() => document.getElementById("file-input")?.click()}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {selectedFile ? (
              <div className="space-y-3">
                <div className="text-primary font-medium text-lg">
                  {selectedFile.name}
                </div>
                <div className="text-muted-foreground">
                  {(selectedFile.size / 1024 / 1024).toFixed(1)} MB
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="text-muted-foreground text-lg">
                  Drop your Spotify data ZIP file here
                </div>
                <div className="text-muted-foreground/70 text-sm">
                  or click to browse files
                </div>
              </div>
            )}
          </div>

          {selectedFile && (
            <button
              className="btn btn-primary w-full py-3 text-base font-medium"
              disabled={uploadStatus === "uploading"}
              onClick={() => handleUpload(selectedFile!)}
            >
              {uploadStatus === "uploading"
                ? "Uploading..."
                : "Upload & Analyze"}
            </button>
          )}

          {uploadStatus !== "idle" && (
            <div
              className={`text-center p-4 rounded-lg border ${
                uploadStatus === "success"
                  ? "text-primary border-primary/20 bg-primary/5"
                  : uploadStatus === "error"
                  ? "text-destructive border-destructive/20 bg-destructive/5"
                  : "text-muted-foreground border-border"
              }`}
            >
              {uploadResult}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
