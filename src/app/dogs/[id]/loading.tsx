import { Loader2 } from "lucide-react";

export default function DogDetailsLoading() {
  return (
    <div className="flex flex-1 items-center justify-center py-24">
      <Loader2 className="h-6 w-6 animate-spin text-fg-subtle" aria-hidden="true" />
    </div>
  );
}
