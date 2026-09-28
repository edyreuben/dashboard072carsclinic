import { useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { resetCredentials } from "@/lib/auth";

export function LoginResetDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const close = () => {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    onOpenChange(false);
  };
  const save = () => {
    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }
    if (!resetCredentials(currentPassword, newPassword)) {
      toast.error("Current password is incorrect");
      return;
    }
    toast.success("Login password updated");
    close();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-md">
        <DialogHeader className="bg-surface-dark px-6 py-5 text-left">
          <DialogTitle className="text-base font-bold uppercase tracking-[0.12em] text-surface-dark-foreground">
            Reset Login
          </DialogTitle>
          <DialogDescription className="text-xs uppercase tracking-[0.1em] text-surface-dark-muted">
            Change the dashboard password
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 bg-card px-6 py-5">
          <div className="space-y-2">
            <Label htmlFor="current-login-password">Current password</Label>
            <Input
              id="current-login-password"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-login-password">New password</Label>
            <Input
              id="new-login-password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-login-password">Confirm new password</Label>
            <Input
              id="confirm-login-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter className="border-t bg-card px-6 py-4">
          <Button variant="outline" onClick={close}>
            Cancel
          </Button>
          <Button onClick={save}>Update Password</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
