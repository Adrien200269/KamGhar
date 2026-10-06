"use client";

import React, { useEffect, useRef, useState, useId } from "react";
import { Upload, CheckCircle2, Camera } from "lucide-react";

// Load CSS for Uploadcare file uploader modal and styles
import "@uploadcare/file-uploader/web/uc-file-uploader-regular.min.css";

interface UploadcareImageUploaderProps {
  /** Callback fired when an image is successfully uploaded to Uploadcare CDN */
  onUpload: (cdnUrl: string) => void;
  /** Custom label for the button */
  label?: string;
  /** Custom icon to render (defaults to Upload) */
  icon?: "upload" | "camera";
  /** Optional custom CSS classes for the trigger button */
  className?: string;
  /** Optional custom children to act as trigger */
  children?: React.ReactNode;
}

export default function UploadcareImageUploader({
  onUpload,
  label = "Upload Photo",
  icon = "upload",
  className = "",
  children,
}: UploadcareImageUploaderProps) {
  const rawId = useId();
  // Uploadcare ctx-name must only contain letters, numbers, hyphens, and underscores
  const ctxName = `uc-${rawId.replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const ctxRef = useRef<HTMLElement | null>(null);
  const [done, setDone] = useState(false);
  const [isReady, setIsReady] = useState(false);

  const pubKey = process.env.NEXT_PUBLIC_UPLOADCARE_PUBLIC_KEY || "fe93a6cad4d892334c25";

  useEffect(() => {
    let unmounted = false;
    import("@uploadcare/file-uploader").then((UC) => {
      if (!unmounted) {
        UC.defineComponents(UC);
        setIsReady(true);
      }
    });
    return () => {
      unmounted = true;
    };
  }, []);

  useEffect(() => {
    const el = ctxRef.current;
    if (!el) return;

    const extractUrl = (detail: any): string | null => {
      if (!detail) return null;
      if (typeof detail.cdnUrl === "string") return detail.cdnUrl;
      if (detail.fileInfo && typeof detail.fileInfo.cdnUrl === "string") return detail.fileInfo.cdnUrl;
      if (Array.isArray(detail.successEntries) && detail.successEntries.length > 0) {
        return detail.successEntries[0]?.cdnUrl || null;
      }
      if (Array.isArray(detail.allEntries) && detail.allEntries.length > 0) {
        const success = detail.allEntries.find((item: any) => item.status === "success" || item.cdnUrl);
        return success?.cdnUrl || null;
      }
      return null;
    };

    const handleEvent = (e: Event) => {
      const customEvent = e as CustomEvent;
      const cdnUrl = extractUrl(customEvent.detail);
      if (cdnUrl) {
        onUpload(cdnUrl);
        setDone(true);
        setTimeout(() => setDone(false), 3000);
      }
    };

    el.addEventListener("file-upload-success", handleEvent);
    el.addEventListener("common-upload-success", handleEvent);
    el.addEventListener("change", handleEvent);

    return () => {
      el.removeEventListener("file-upload-success", handleEvent);
      el.removeEventListener("common-upload-success", handleEvent);
      el.removeEventListener("change", handleEvent);
    };
  }, [onUpload]);

  const handleOpen = () => {
    if (!ctxRef.current) return;
    const api = (ctxRef.current as any)?.api;
    if (api && typeof api.initFlow === "function") {
      api.initFlow();
    } else if (api && typeof api.setModalState === "function") {
      api.setModalState(true);
    }
  };

  return (
    <div className="relative inline-flex items-center">
      {/* Uploadcare Configuration */}
      {/* @ts-expect-error uc-config is a custom element */}
      <uc-config
        ctx-name={ctxName}
        pubkey={pubKey}
        img-only="true"
        source-list="local, url, camera"
        multiple="false"
        confirm-upload="false"
      />

      {/* Uploadcare Context Provider to capture events and API */}
      {/* @ts-expect-error uc-upload-ctx-provider is a custom element */}
      <uc-upload-ctx-provider ctx-name={ctxName} ref={ctxRef} />

      {/* Uploadcare Regular Uploader with headless mode (renders dialogs, but no default button) */}
      {/* @ts-expect-error uc-file-uploader-regular is a custom element */}
      <uc-file-uploader-regular
        ctx-name={ctxName}
        headless="true"
        class="uc-light"
      />

      {/* Custom styled trigger button */}
      {children ? (
        <div onClick={handleOpen} role="button" tabIndex={0} className="inline-block cursor-pointer">
          {children}
        </div>
      ) : (
        <button
          type="button"
          onClick={handleOpen}
          className={
            className ||
            "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-orange-300 dark:hover:border-orange-500/50 transition-all cursor-pointer shadow-xs select-none"
          }
        >
          {done ? (
            <>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <span>Uploaded!</span>
            </>
          ) : icon === "camera" ? (
            <>
              <Camera className="w-3.5 h-3.5 text-orange-500" />
              <span>{label}</span>
            </>
          ) : (
            <>
              <Upload className="w-3.5 h-3.5 text-orange-500" />
              <span>{label}</span>
            </>
          )}
        </button>
      )}
    </div>
  );
}
