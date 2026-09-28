import { FormEvent, useState } from "react";
import { Eye, EyeOff, LockKeyhole } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { login } from "@/lib/auth";

export function LoginScreen({ onSuccess }: { onSuccess: () => void }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!login(username, password)) {
      setError("Incorrect username or password.");
      return;
    }
    setError("");
    onSuccess();
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <AppHeader />
      <main className="flex flex-1 items-center justify-center px-6 py-10">
        <form
          onSubmit={submit}
          className="w-full max-w-md space-y-6 rounded-xl border bg-card p-8 shadow-sm"
        >
          <div className="text-center">
            <h2 className="text-xl font-bold">Welcome back</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Sign in to manage jobs and feedback.
            </p>
          </div>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="login-username">Username</Label>
              <Input
                id="login-username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="login-password">Password</Label>
              <div className="relative">
                <Input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  className="pr-11"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  aria-pressed={showPassword}
                  onClick={() => setShowPassword((value) => !value)}
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </Button>
              </div>
            </div>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full">
            <LockKeyhole className="size-4" /> Sign in
          </Button>
          <Button
            type="button"
            variant="link"
            className="w-full"
            onClick={() => setResetOpen(true)}
          >
            Reset password
          </Button>
        </form>
      </main>
      <Dialog open={resetOpen} onOpenChange={setResetOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Reset password</DialogTitle>
            <DialogDescription>Contact admin for password reset.</DialogDescription>
          </DialogHeader>
          <Button onClick={() => setResetOpen(false)}>OK</Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
