import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";

interface DeleteDataDialogProps {
  onSuccess?: () => void;
}

export function DeleteDataDialog({ onSuccess }: DeleteDataDialogProps) {
  const [confirmText, setConfirmText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const { token } = useAuth();

  const handleDelete = async () => {
    if (confirmText !== "DELETE MY DATA") {
      setError('Please type "DELETE MY DATA" to confirm');
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/user/data", {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const result = await response.json();

      if (result.success) {
        setSuccess(
          `Successfully deleted ${result.deletedRecords} streaming records and ${result.deletedUploads} uploads`
        );
        setConfirmText("");
        onSuccess?.();
      } else {
        setError(result.message || "Failed to delete data");
      }
    } catch (err) {
      setError("Network error while deleting data");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-destructive/20">
      <CardHeader>
        <CardTitle className="text-destructive">Delete All Data</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-muted-foreground text-sm">
          This will permanently delete all your streaming records, uploads, and statistics. This
          action cannot be undone.
        </p>

        <div>
          <Label htmlFor="confirm">Type "DELETE MY DATA" to confirm:</Label>
          <Input
            id="confirm"
            type="text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="DELETE MY DATA"
          />
        </div>

        {error && <p className="text-destructive text-sm">{error}</p>}

        {success && <p className="text-success text-sm">{success}</p>}

        <Button
          variant="destructive"
          onClick={handleDelete}
          disabled={loading || confirmText !== "DELETE MY DATA"}
          className="w-full"
        >
          {loading ? "Deleting..." : "Delete All My Data"}
        </Button>
      </CardContent>
    </Card>
  );
}
