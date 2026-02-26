"use client";

import { StructuredCV } from "@/lib/cv-types";
import { linkify } from "@/lib/cv-utils";

function LinkifyUrl({ url, label, className }: { url: string; label?: string; className?: string }) {
  const { href, label: resolvedLabel } = linkify(url, label);
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={className || "text-gray-600 hover:underline"}>
      {resolvedLabel}
    </a>
  );
}

export default function ExecutivePreview({ cv }: { cv: StructuredCV }) {
  const pd = cv.personalDetails;

  return (
    <div className="overflow-x-auto -mx-4 sm:mx-0">
      <div className="bg-white text-black rounded-lg p-4 sm:p-8 shadow-lg max-w-[210mm] mx-auto text-[9pt] sm:text-[10.5pt] leading-[1.35] font-sans min-w-[320px]">
        {/* Header */}
        {pd.fullName && (
          <div className="mb-3 text-center">
            <h1 className="text-[18pt] sm:text-[22pt] font-bold text-gray-900 tracking-tight leading-tight">
              {pd.fullName}
            </h1>
            <div className="flex flex-wrap justify-center items-center gap-x-2 gap-y-0.5 text-[8.5pt] text-gray-500 mt-1.5">
              {pd.email && (
                <a href={`mailto:${pd.email}`} className="text-gray-600 hover:underline">
                  {pd.email}
                </a>
              )}
              {pd.phone && (
                <>
                  <span className="text-gray-400">|</span>
                  <a href={`tel:${pd.phone}`} className="text-gray-600 hover:underline">
                    {pd.phone}
                  </a>
                </>
              )}
              {pd.location && (
                <>
                  <span className="text-gray-400">|</span>
                  <span>{pd.location}</span>
                </>
              )}
            </div>
            {(pd.linkedIn || pd.github || pd.website) && (
              <div className="flex flex-wrap justify-center items-center gap-x-2 gap-y-0.5 text-[8.5pt] text-gray-500 mt-0.5">
                {pd.linkedIn && <LinkifyUrl url={pd.linkedIn} />}
                {pd.github && (
                  <>
                    {pd.linkedIn && <span className="text-gray-400">|</span>}
                    <LinkifyUrl url={`https://github.com/${pd.github}`} label="GitHub" />
                  </>
                )}
                {pd.website && (
                  <>
                    {(pd.linkedIn || pd.github) && <span className="text-gray-400">|</span>}
                    <LinkifyUrl url={pd.website} />
                  </>
                )}
              </div>
            )}
            {/* Tagline from summary */}
            {cv.summary && (
              <p className="text-[8pt] sm:text-[9pt] text-[#607d8b] uppercase tracking-[0.25em] mt-2 font-medium">
                {cv.summary}
              </p>
            )}
          </div>
        )}

        {/* Skills */}
        {cv.skills.length > 0 && (
          <div className="mb-3">
            <h2 className="text-[10pt] font-bold uppercase tracking-wider text-gray-900 border-b-2 border-gray-700 pb-0.5 mb-2">
              Skills
            </h2>
            <div className="space-y-0.5">
              {cv.skills.map((cat, i) => (
                <p key={i}>
                  <span className="font-semibold">{cat.category}: </span>
                  <span className="text-gray-700">{cat.items.join(", ")}</span>
                </p>
              ))}
            </div>
          </div>
        )}

        {/* Experience */}
        {cv.experience.length > 0 && (
          <div className="mb-3">
            <h2 className="text-[10pt] font-bold uppercase tracking-wider text-gray-900 border-b-2 border-gray-700 pb-0.5 mb-2">
              Work Experience
            </h2>
            <div className="space-y-0">
              {cv.experience.map((exp, idx) => (
                <div key={exp.id}>
                  <div className="flex items-baseline justify-between mt-2">
                    <span className="font-bold text-gray-900">
                      {exp.title}
                      {exp.organization && (
                        <span className="font-bold"> at {exp.organization}</span>
                      )}
                    </span>
                    <span className="text-[8.5pt] text-gray-500 shrink-0 ml-2">
                      {[
                        [exp.startDate, exp.endDate].filter(Boolean).join(" - "),
                      ].filter(Boolean).join("")}
                    </span>
                  </div>
                  <div className="border-b border-gray-300 mt-1 mb-1.5" />
                  {exp.bullets.length > 0 && (
                    <ul className="list-disc list-outside ml-4 space-y-0.5 text-gray-700">
                      {exp.bullets.filter((b) => b.trim()).map((bullet, bi) => (
                        <li key={bi}>{bullet}</li>
                      ))}
                    </ul>
                  )}
                  {exp.technologies.length > 0 && (
                    <p className="text-[8pt] text-gray-400 mt-0.5 italic">
                      {exp.technologies.join(" · ")}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Education */}
        {cv.education.length > 0 && (
          <div className="mb-3">
            <h2 className="text-[10pt] font-bold uppercase tracking-wider text-gray-900 border-b-2 border-gray-700 pb-0.5 mb-2">
              Education
            </h2>
            <div className="space-y-0">
              {cv.education.map((edu) => (
                <div key={edu.id} className="py-1.5 border-b border-gray-200 last:border-b-0">
                  <div className="flex items-baseline justify-between">
                    <span className="font-bold text-gray-900">{edu.institution}</span>
                    <span className="text-[8.5pt] text-gray-500 shrink-0 ml-2">
                      {[edu.startDate, edu.endDate].filter(Boolean).join(" - ")}
                      {edu.details && ` | ${edu.details}`}
                    </span>
                  </div>
                  <p className="text-gray-600">{edu.degree}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Certifications */}
        {cv.certifications.length > 0 && (
          <div>
            <h2 className="text-[10pt] font-bold uppercase tracking-wider text-gray-900 border-b-2 border-gray-700 pb-0.5 mb-2">
              Certifications
            </h2>
            <ul className="list-disc list-outside ml-4 text-gray-700 space-y-0.5">
              {cv.certifications.map((cert, i) => (
                <li key={i}>{cert}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
