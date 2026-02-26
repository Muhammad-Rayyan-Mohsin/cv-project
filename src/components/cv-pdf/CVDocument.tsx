import { Document } from "@react-pdf/renderer";
import { StructuredCV, TemplateId } from "@/lib/cv-types";
import ClassicPDF from "./templates/ClassicPDF";
import ModernPDF from "./templates/ModernPDF";
import ProfessionalPDF from "./templates/ProfessionalPDF";
import CreativePDF from "./templates/CreativePDF";
import ExecutivePDF from "./templates/ExecutivePDF";

export default function CVDocument({ cv }: { cv: StructuredCV }) {
  const templateId: TemplateId = cv.templateId || "classic";

  return (
    <Document>
      {templateId === "modern" ? (
        <ModernPDF cv={cv} />
      ) : templateId === "professional" ? (
        <ProfessionalPDF cv={cv} />
      ) : templateId === "creative" ? (
        <CreativePDF cv={cv} />
      ) : templateId === "executive" ? (
        <ExecutivePDF cv={cv} />
      ) : (
        <ClassicPDF cv={cv} />
      )}
    </Document>
  );
}
