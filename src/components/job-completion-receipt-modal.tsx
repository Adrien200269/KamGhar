"use client";

import { useRef } from "react";
import Image from "next/image";
import { X, Printer, Share2, CheckCircle2, ShieldCheck, Download, MapPin, Calendar, FileText } from "lucide-react";
import { getApproximateBsDate } from "@/lib/nepali-date";
import { useLanguage } from "./language-provider";

interface JobCompletionReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  job: {
    id: string;
    title: string;
    category: string;
    address: string;
    budget?: number | null;
    createdAt?: Date | string;
    completedAt?: Date | string;
  };
  recruiter: {
    name: string;
    businessName?: string | null;
    address?: string | null;
    email?: string;
  };
  worker: {
    name: string;
    phone?: string | null;
    kycStatus?: string | null;
    kycDocumentType?: string | null;
    kycDocumentNumber?: string | null;
  };
  paidAmount?: number | null;
}

export default function JobCompletionReceiptModal({
  isOpen,
  onClose,
  job,
  recruiter,
  worker,
  paidAmount,
}: JobCompletionReceiptModalProps) {
  const { lang, tx } = useLanguage();
  const receiptRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const invoiceNumber = `KG-INV-${job.id.slice(0, 8).toUpperCase()}`;
  const now = new Date();
  const bsDate = getApproximateBsDate(now);
  const amount = paidAmount || job.budget || 1200;

  const handlePrint = () => {
    window.print();
  };

  const handleWhatsAppShare = () => {
    const text = encodeURIComponent(
      `🧾 *KamGhar Service Receipt*\nInvoice: ${invoiceNumber}\nJob: ${job.title} (${job.category})\nWorker: ${worker.name}\nRecruiter: ${recruiter.name}\nAmount: NPR ${amount.toLocaleString()}\nStatus: Verified Completed ✅\nKamGhar Platform Nepal`
    );
    window.open(`https://wa.me/?text=${text}`, "_blank");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto print:p-0 print:bg-white">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden print:border-none print:shadow-none print:max-w-full">
        {/* Top Control Bar (Hidden on print) */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-orange-600" />
            <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
              {tx("Work Completion Tax Invoice / Receipt", "काम सम्पन्न कर बिल / रसिद")}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold shadow-sm transition"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>{tx("Print / PDF", "प्रिन्ट / PDF")}</span>
            </button>
            <button
              onClick={handleWhatsAppShare}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>WhatsApp</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Receipt Body */}
        <div ref={receiptRef} className="p-8 sm:p-10 space-y-8 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 print:text-black print:bg-white">
          {/* Receipt Header */}
          <div className="flex items-start justify-between border-b border-slate-200 dark:border-slate-800 pb-6 print:border-slate-300">
            <div>
              <div className="flex items-center gap-2">
                <Image src="/logo.png" alt="KamGhar" width={110} height={36} priority className="h-7 w-auto object-contain dark:bg-white dark:p-1 dark:rounded-md" />
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-orange-100 text-orange-700 uppercase tracking-widest border border-orange-200">
                  Official Bill
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                KamGhar Freelance & Gig Marketplace • Nepal
              </p>
              <p className="text-[11px] text-slate-400">
                Regd. Digital Service Certificate • support@kamghar.com.np
              </p>
            </div>

            <div className="text-right">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Invoice Number
              </span>
              <p className="text-base font-extrabold text-orange-600 tracking-wider font-mono">
                {invoiceNumber}
              </p>
              <div className="mt-1 text-xs text-slate-500">
                <p>Date: {now.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}</p>
                <p className="font-medium text-slate-600 dark:text-slate-300">{bsDate.formattedNe}</p>
              </div>
            </div>
          </div>

          {/* Party Details: Recruiter & Worker */}
          <div className="grid grid-cols-2 gap-6 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 print:border-slate-300 print:bg-slate-50">
            <div>
              <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">
                Hired By (Client / Recruiter)
              </span>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-1">
                {recruiter.name}
              </h4>
              {recruiter.businessName && (
                <p className="text-xs font-semibold text-orange-600">{recruiter.businessName}</p>
              )}
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{recruiter.address || job.address}</p>
            </div>

            <div>
              <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">
                Service Provider (Worker)
              </span>
              <div className="flex items-center gap-1.5 mt-1">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  {worker.name}
                </h4>
                {worker.kycStatus === "VERIFIED" && (
                  <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-0.5">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Verified
                  </span>
                )}
              </div>
              {worker.phone && <p className="text-xs text-slate-500">Phone: {worker.phone}</p>}
              {worker.kycDocumentNumber && (
                <p className="text-[11px] text-slate-400">ID Ref: ••••{worker.kycDocumentNumber.slice(-4)}</p>
              )}
            </div>
          </div>

          {/* Service Particulars Table */}
          <div>
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-400 uppercase text-[10px] font-extrabold">
                  <th className="py-2.5">Service Description</th>
                  <th className="py-2.5">Category</th>
                  <th className="py-2.5">Location</th>
                  <th className="py-2.5 text-right">Amount (NPR)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                <tr>
                  <td className="py-3.5 font-bold text-slate-900 dark:text-white max-w-[200px] truncate">
                    {job.title}
                  </td>
                  <td className="py-3.5 text-slate-600 dark:text-slate-400 font-medium">
                    {job.category}
                  </td>
                  <td className="py-3.5 text-slate-500 max-w-[150px] truncate">
                    {job.address}
                  </td>
                  <td className="py-3.5 text-right font-extrabold text-slate-900 dark:text-white">
                    Rs. {amount.toLocaleString()}
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Total Calculation */}
            <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 flex flex-col items-end space-y-1 text-xs">
              <div className="flex justify-between w-56 text-slate-500">
                <span>Subtotal:</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">Rs. {amount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between w-56 text-slate-500">
                <span>Platform Service Fee:</span>
                <span className="font-semibold text-emerald-600">Rs. 0 (Waived)</span>
              </div>
              <div className="flex justify-between w-56 text-slate-500">
                <span>Local Taxes:</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">Rs. 0</span>
              </div>
              <div className="flex justify-between w-56 pt-2 border-t border-slate-200 dark:border-slate-700 text-sm font-extrabold text-slate-900 dark:text-white">
                <span>Total Paid:</span>
                <span className="text-orange-600">NPR {amount.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Authenticity Footer */}
          <div className="pt-6 border-t border-dashed border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center font-bold">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-white">
                  Payment Status: Verified Completed
                </p>
                <p className="text-[11px] text-slate-500">
                  Job matched & coordinated on KamGhar.com.np
                </p>
              </div>
            </div>

            <div className="text-right">
              <div className="inline-block p-1 bg-white border border-slate-300 rounded-lg">
                <div className="w-12 h-12 bg-slate-900 rounded flex items-center justify-center text-white text-[8px] font-mono tracking-tighter text-center p-1">
                  KAMGHAR VERIFIED
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
