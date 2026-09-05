import { AlertCircle, CheckCircle2, Info } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

type ErrorAlertProps = {
  message: string;
  variant?: "error" | "success" | "info";
  className?: string;
};

const variantStyles = {
  error: {
    alertVariant: "destructive" as const,
    icon: <AlertCircle className="h-4 w-4" />,
    extra: "",
  },
  success: {
    alertVariant: "default" as const,
    icon: <CheckCircle2 className="h-4 w-4 text-green-600" />,
    extra: "border-green-200 bg-green-50 text-green-800",
  },
  info: {
    alertVariant: "default" as const,
    icon: <Info className="h-4 w-4 text-blue-600" />,
    extra: "border-blue-200 bg-blue-50 text-blue-800",
  },
} as const;

export function ErrorAlert({
  message,
  variant = "error",
  className = "",
}: ErrorAlertProps) {
  const styles = variantStyles[variant];

  return (
    <Alert
      variant={styles.alertVariant}
      className={`${styles.extra} ${className}`}
    >
      {styles.icon}
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  );
}