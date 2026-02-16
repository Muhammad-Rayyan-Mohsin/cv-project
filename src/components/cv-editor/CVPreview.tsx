"use client";

import { StructuredCV, TemplateId } from "@/lib/cv-types";
import ClassicPreview from "@/components/cv-templates/ClassicPreview";
import ModernPreview from "@/components/cv-templates/ModernPreview";
import ProfessionalPreview from "@/components/cv-templates/ProfessionalPreview";
import CreativePreview from "@/components/cv-templates/CreativePreview";

export default function CVPreview({ cv }: { cv: StructuredCV }) {
  const templateId: TemplateId = cv.templateId || "classic";

  switch (templateId) {
    case "modern":
      return <ModernPreview cv={cv} />;
    case "professional":
      return <ProfessionalPreview cv={cv} />;
    case "creative":
      return <CreativePreview cv={cv} />;
    case "classic":
    default:
      return <ClassicPreview cv={cv} />;
  }
}
