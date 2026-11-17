import LoadingAnimation from "@/components/loading-animation";

export default function Loading() {
  return (
    <div className="min-h-screen min-h-[100dvh] w-full flex items-center justify-center bg-slate-50 dark:bg-slate-950 px-4">
      <LoadingAnimation
        label="तयार हुँदैछ • Loading KamGhar..."
        sublabel="नेपालको स्थानीय काम तथा दक्ष जनशक्ति • Connecting Nepal's Skilled Hands"
      />
    </div>
  );
}
