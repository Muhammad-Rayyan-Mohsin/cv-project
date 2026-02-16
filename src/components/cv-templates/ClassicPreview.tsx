"use client";

import { StructuredCV } from "@/lib/cv-types";

function linkify(url: string, label?: string) {
  const href = url.startsWith("http") ? url : `https://${url}`;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-blue-700 hover:underline"
    >
      {label || url}
    </a>
  );
}

export default function ClassicPreview({ cv }: { cv: StructuredCV }) {
  const pd = cv.personalDetails;

  return (
    <div className="overflow-x-auto -mx-4 sm:mx-0">
      <div className="bg-white text-black rounded-lg p-4 sm:p-8 shadow-lg max-w-[210mm] mx-auto text-[9pt] sm:text-[10.5pt] leading-[1.35] font-[system-ui] min-w-[320px]">
        {/* Header */}
        {pd.fullName && (
          <div className="mb-3 pb-2 border-b border-gray-300 text-center">
            <h1 className="text-[16pt] sm:text-[20pt] font-bold text-black tracking-tight leading-tight">
              {pd.fullName}
            </h1>
            <div className="flex flex-wrap justify-center items-center gap-x-2 gap-y-0.5 text-[8.5pt] text-gray-600 mt-1.5">
              {pd.email && (
                <a href={`mailto:${pd.email}`} className="text-blue-700 hover:underline">
                  {pd.email}
                </a>
              )}
              {pd.phone && (
                <>
                  <span className="text-gray-300">|</span>
                  <a href={`tel:${pd.phone}`} className="text-blue-700 hover:underline">
                    {pd.phone}
                  </a>
                </>
              )}
              {pd.location && (
                <>
                  <span className="text-gray-300">|</span>
                  <span>{pd.location}</span>
                </>
              )}
            </div>
            {(pd.linkedIn || pd.github || pd.website) && (
              <div className="flex flex-wrap justify-center items-center gap-x-2 gap-y-0.5 text-[8.5pt] text-gray-600 mt-0.5">
                {pd.linkedIn && linkify(pd.linkedIn)}
                {pd.github && (
                  <>
                    {pd.linkedIn && <span className="text-gray-300">|</span>}
                    {linkify(`https://github.com/${pd.github}`, `github.com/${pd.github}`)}
                  </>
                )}
                {pd.website && (
                  <>
                    {(pd.linkedIn || pd.github) && <span className="text-gray-300">|</span>}
                    {linkify(pd.website)}
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {/* Summary */}
        {cv.summary && (
          <div className="mb-3">
            <h2 className="text-[10pt] font-bold uppercase tracking-wider text-black border-b border-gray-200 pb-0.5 mb-1.5">
              Summary
            </h2>
            <p className="text-gray-700">{cv.summary}</p>
          </div>
        )}

        {/* Skills */}
        {cv.skills.length > 0 && (
          <div className="mb-3">
            <h2 className="text-[10pt] font-bold uppercase tracking-wider text-black border-b border-gray-200 pb-0.5 mb-1.5">
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
            <h2 className="text-[10pt] font-bold uppercase tracking-wider text-black border-b border-gray-200 pb-0.5 mb-1.5">
              Experience
            </h2>
            <div className="space-y-2.5">
              {cv.experience.map((exp) => (
                <div key={exp.id}>
                  <div className="flex items-baseline justify-between">
                    <span className="font-semibold">
                      {exp.title}
                      {exp.organization && (
                        <span className="font-normal text-gray-500">
                          {" "}— {exp.organization}
                        </span>
                      )}
                    </span>
                    {(exp.startDate || exp.endDate) && (
                      <span className="text-[8.5pt] text-gray-500 shrink-0 ml-2">
                        {exp.startDate}
                        {exp.endDate && ` – ${exp.endDate}`}
                      </span>
                    )}
                  </div>
                  {exp.bullets.length > 0 && (
                    <ul className="list-disc list-outside ml-4 mt-0.5 space-y-0.5 text-gray-700">
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
            <h2 className="text-[10pt] font-bold uppercase tracking-wider text-black border-b border-gray-200 pb-0.5 mb-1.5">
              Education
            </h2>
            <div className="space-y-1.5">
              {cv.education.map((edu) => (
                <div key={edu.id}>
                  <div className="flex items-baseline justify-between">
                    <span>
                      <span className="font-semibold">{edu.degree}</span>
                      {edu.institution && (
                        <span className="text-gray-500"> — {edu.institution}</span>
                      )}
                    </span>
                    {(edu.startDate || edu.endDate) && (
                      <span className="text-[8.5pt] text-gray-500 shrink-0 ml-2">
                        {edu.startDate}
                        {edu.endDate && ` – ${edu.endDate}`}
                      </span>
                    )}
                  </div>
                  {edu.details && (
                    <p className="text-gray-500 text-[9pt]">{edu.details}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Certifications */}
        {cv.certifications.length > 0 && (
          <div>
            <h2 className="text-[10pt] font-bold uppercase tracking-wider text-black border-b border-gray-200 pb-0.5 mb-1.5">
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
