import LoadingAnimation from "@/components/loading-animation";

export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
      <LoadingAnimation label="Connecting to KamGhar..." />
    </div>
  );
}
