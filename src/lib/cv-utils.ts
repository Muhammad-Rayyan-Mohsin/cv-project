import { PersonalDetails, StructuredCV, EducationEntry, ExperienceEntry } from "./cv-types";

export function structuredCvToMarkdown(
  cv: StructuredCV,
  personalDetails?: PersonalDetails
): string {
  const pd = personalDetails || cv.personalDetails;
  const lines: string[] = [];

  // Header
  if (pd.fullName) {
    lines.push(`# ${pd.fullName}`);
    const contact: string[] = [];
    if (pd.email) contact.push(pd.email);
    if (pd.phone) contact.push(pd.phone);
    if (pd.location) contact.push(pd.location);
    if (pd.linkedIn) contact.push(pd.linkedIn);
    if (pd.github) contact.push(`github.com/${pd.github}`);
    if (pd.website) contact.push(pd.website);
    if (contact.length) lines.push(contact.join(" | "));
    lines.push("");
  }

  // Summary
  if (cv.summary) {
    lines.push("## Professional Summary");
    lines.push(cv.summary);
    lines.push("");
  }

  // Skills
  if (cv.skills.length > 0) {
    lines.push("## Technical Skills");
    for (const cat of cv.skills) {
      lines.push(`**${cat.category}:** ${cat.items.join(", ")}`);
    }
    lines.push("");
  }

  // Experience
  if (cv.experience.length > 0) {
    lines.push("## Experience");
    for (const exp of cv.experience) {
      const dateLine =
        exp.startDate || exp.endDate
          ? ` (${exp.startDate}${exp.endDate ? ` – ${exp.endDate}` : ""})`
          : "";
      lines.push(
        `### ${exp.title}${exp.organization ? ` — ${exp.organization}` : ""}${dateLine}`
      );
      for (const bullet of exp.bullets) {
        lines.push(`- ${bullet}`);
      }
      if (exp.technologies.length > 0) {
        lines.push(`  *Technologies: ${exp.technologies.join(", ")}*`);
      }
      lines.push("");
    }
  }

  // Education
  if (cv.education.length > 0) {
    lines.push("## Education");
    for (const edu of cv.education) {
      const dateLine =
        edu.startDate || edu.endDate
          ? ` (${edu.startDate}${edu.endDate ? ` – ${edu.endDate}` : ""})`
          : "";
      lines.push(
        `**${edu.degree}** — ${edu.institution}${dateLine}`
      );
      if (edu.details) lines.push(`  ${edu.details}`);
    }
    lines.push("");
  }

  // Certifications
  if (cv.certifications.length > 0) {
    lines.push("## Certifications");
    for (const cert of cv.certifications) {
      lines.push(`- ${cert}`);
    }
    lines.push("");
  }

  return lines.join("\n");
}

export function mergeProfileIntoCv(
  cv: StructuredCV,
  profile: {
    fullName: string;
    email: string;
    phone: string;
    location: string;
    linkedIn: string;
    github: string;
    website: string;
    education: EducationEntry[];
    workExperience?: ExperienceEntry[];
    avatarUrl?: string;
  }
): StructuredCV {
  // Prepend real work experience before AI-generated project experience
  const profileWorkExp = (profile.workExperience || []).map((exp) => ({
    ...exp,
    id: exp.id || crypto.randomUUID(),
    bullets: Array.isArray(exp.bullets) ? exp.bullets : [],
    technologies: Array.isArray(exp.technologies) ? exp.technologies : [],
  }));
  const mergedExperience =
    profileWorkExp.length > 0
      ? [...profileWorkExp, ...cv.experience]
      : cv.experience;

  return {
    ...cv,
    personalDetails: {
      fullName: profile.fullName,
      email: profile.email,
      phone: profile.phone,
      location: profile.location,
      linkedIn: profile.linkedIn,
      github: profile.github,
      website: profile.website,
      photoUrl: cv.personalDetails.photoUrl || profile.avatarUrl || undefined,
    },
    experience: mergedExperience,
    education: profile.education || [],
  };
}

export function createEmptyPersonalDetails(): PersonalDetails {
  return {
    fullName: "",
    email: "",
    phone: "",
    location: "",
    linkedIn: "",
    github: "",
    website: "",
  };
}
