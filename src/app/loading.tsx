import LoadingAnimation from "@/components/loading-animation";

export default function Loading() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white dark:bg-black select-none">
      <LoadingAnimation fullscreen={false} />
    </div>
  );
}
