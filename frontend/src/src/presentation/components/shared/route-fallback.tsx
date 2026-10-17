import { Loader2 } from "lucide-react";

export function RouteFallback() {
  return (
    <div className="grid min-h-[60vh] place-items-center text-muted-soft">
      <Loader2 className="size-6 animate-spin" aria-label="Loading" />
    </div>
  );
}
