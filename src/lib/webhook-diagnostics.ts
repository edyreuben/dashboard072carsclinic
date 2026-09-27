import { toast } from "sonner";

export type WebhookFailure = {
  name: string;
  status: number;
  error: string;
};

export function showWebhookFailures(failures: WebhookFailure[]) {
  failures.forEach((failure) => {
    toast.error(`${failure.name} Error`, {
      description: failure.error || (failure.status ? `HTTP ${failure.status}` : "Unknown failure"),
      duration: 9000,
    });
  });
}