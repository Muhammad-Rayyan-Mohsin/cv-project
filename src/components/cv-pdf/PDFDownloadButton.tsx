"use client";

import { StructuredCV } from "@/lib/cv-types";
import { useState, useCallback } from "react";
import { Download, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

export default function PDFDownloadButton({
  cv,
  roleName,
}: {
  cv: StructuredCV;
  roleName: string;
}) {
  const [generating, setGenerating] = useState(false);

  const handleDownload = useCallback(async () => {
    setGenerating(true);
    try {
      // Dynamic import to avoid loading @react-pdf/renderer on page load
      const { pdf } = await import("@react-pdf/renderer");
      const { default: CVDocument } = await import("./CVDocument");

      const blob = await pdf(<CVDocument cv={cv} />).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `CV_${roleName.replace(/\s+/g, "_")}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("PDF generation failed:", err);
      toast.error("Failed to generate PDF. Please try again.");
    } finally {
      setGenerating(false);
    }
  }, [cv, roleName]);

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={handleDownload}
      disabled={generating}
      className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white px-3 py-2 rounded-full text-sm font-medium transition-colors disabled:opacity-60"
    >
      {generating ? (
        <>
          <Loader2 className="w-3.5 h-3.5 animate-spin" strokeWidth={2} />
          Generating...
        </>
      ) : (
        <>
          <Download className="w-3.5 h-3.5" strokeWidth={2} />
          PDF
        </>
      )}
    </motion.button>
  );
}
