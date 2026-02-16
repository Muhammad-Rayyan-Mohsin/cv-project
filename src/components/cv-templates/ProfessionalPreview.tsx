"use client";

import { StructuredCV } from "@/lib/cv-types";

function linkify(url: string, label?: string) {
  const href = url.startsWith("http") ? url : `https://${url}`;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-indigo-700 hover:underline"
    >
      {label || url}
    </a>
  );
}

export default function ProfessionalPreview({ cv }: { cv: StructuredCV }) {
  const pd = cv.personalDetails;

  return (
    <div className="overflow-x-auto -mx-4 sm:mx-0">
      <div className="bg-white text-black rounded-lg p-4 sm:p-8 shadow-lg max-w-[210mm] mx-auto text-[9pt] sm:text-[10.5pt] leading-[1.35] font-[system-ui] min-w-[320px]">
        {/* Header with photo */}
        {pd.fullName && (
          <div className="mb-4">
            <div className="flex items-start gap-4">
              {pd.photoUrl && (
                <img
                  src={pd.photoUrl}
                  alt={pd.fullName}
                  className="w-20 h-20 rounded-lg object-cover border border-gray-200 shrink-0"
                />
              )}
              <div className="flex-1">
                <h1 className="text-[18pt] sm:text-[22pt] font-bold text-gray-900 tracking-tight leading-tight">
                  {pd.fullName}
                </h1>
                {/* Contact in two rows */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-0.5 text-[8.5pt] text-gray-600 mt-2">
                  {pd.email && (
                    <div className="flex items-center gap-1.5">
                      <span className="text-indigo-500 font-bold text-[7pt]">EMAIL</span>
                      <a href={`mailto:${pd.email}`} className="text-indigo-700 hover:underline">{pd.email}</a>
                    </div>
                  )}
                  {pd.phone && (
                    <div className="flex items-center gap-1.5">
                      <span className="text-indigo-500 font-bold text-[7pt]">PHONE</span>
                      <a href={`tel:${pd.phone}`} className="text-indigo-700 hover:underline">{pd.phone}</a>
                    </div>
                  )}
                  {pd.location && (
                    <div className="flex items-center gap-1.5">
                      <span className="text-indigo-500 font-bold text-[7pt]">LOCATION</span>
                      <span>{pd.location}</span>
                    </div>
                  )}
                  {pd.linkedIn && (
                    <div className="flex items-center gap-1.5">
                      <span className="text-indigo-500 font-bold text-[7pt]">LINKEDIN</span>
                      {linkify(pd.linkedIn)}
                    </div>
                  )}
                  {pd.github && (
                    <div className="flex items-center gap-1.5">
                      <span className="text-indigo-500 font-bold text-[7pt]">GITHUB</span>
                      {linkify(`https://github.com/${pd.github}`, pd.github)}
                    </div>
                  )}
                  {pd.website && (
                    <div className="flex items-center gap-1.5">
                      <span className="text-indigo-500 font-bold text-[7pt]">WEBSITE</span>
                      {linkify(pd.website)}
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="h-[3px] bg-gradient-to-r from-indigo-500 to-indigo-300 mt-3 rounded-full" />
          </div>
        )}

        {/* Summary */}
        {cv.summary && (
          <div className="mb-4">
            <h2 className="text-[10pt] font-bold uppercase tracking-wider text-indigo-800 mb-1.5 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
              Professional Summary
            </h2>
            <p className="text-gray-700 pl-3.5">{cv.summary}</p>
          </div>
        )}

        {/* Skills */}
        {cv.skills.length > 0 && (
          <div className="mb-4">
            <h2 className="text-[10pt] font-bold uppercase tracking-wider text-indigo-800 mb-1.5 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
              Technical Skills
            </h2>
            <div className="pl-3.5 space-y-0.5">
              {cv.skills.map((cat, i) => (
                <p key={i}>
                  <span className="font-semibold text-gray-800">{cat.category}: </span>
                  <span className="text-gray-600">{cat.items.join(", ")}</span>
                </p>
              ))}
            </div>
          </div>
        )}

        {/* Experience */}
        {cv.experience.length > 0 && (
          <div className="mb-4">
            <h2 className="text-[10pt] font-bold uppercase tracking-wider text-indigo-800 mb-1.5 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
              Experience
            </h2>
            <div className="pl-3.5 space-y-2.5">
              {cv.experience.map((exp) => (
                <div key={exp.id}>
                  <div className="flex items-baseline justify-between">
                    <span className="font-bold text-gray-800">
                      {exp.title}
                      {exp.organization && (
                        <span className="font-normal text-gray-500"> — {exp.organization}</span>
                      )}
                    </span>
                    {(exp.startDate || exp.endDate) && (
                      <span className="text-[8.5pt] text-indigo-400 shrink-0 ml-2 font-medium">
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
                    <div className="flex flex-wrap gap-1 mt-1">
                      {exp.technologies.map((tech, ti) => (
                        <span
                          key={ti}
                          className="bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded text-[7.5pt] font-medium"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Education */}
        {cv.education.length > 0 && (
          <div className="mb-4">
            <h2 className="text-[10pt] font-bold uppercase tracking-wider text-indigo-800 mb-1.5 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
              Education
            </h2>
            <div className="pl-3.5 space-y-1.5">
              {cv.education.map((edu) => (
                <div key={edu.id}>
                  <div className="flex items-baseline justify-between">
                    <span>
                      <span className="font-semibold text-gray-800">{edu.degree}</span>
                      {edu.institution && (
                        <span className="text-gray-500"> — {edu.institution}</span>
                      )}
                    </span>
                    {(edu.startDate || edu.endDate) && (
                      <span className="text-[8.5pt] text-indigo-400 shrink-0 ml-2 font-medium">
                        {edu.startDate}
                        {edu.endDate && ` – ${edu.endDate}`}
                      </span>
                    )}
                  </div>
                  {edu.details && (
                    <p className="text-gray-500 text-[9pt] pl-0">{edu.details}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Certifications */}
        {cv.certifications.length > 0 && (
          <div>
            <h2 className="text-[10pt] font-bold uppercase tracking-wider text-indigo-800 mb-1.5 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
              Certifications
            </h2>
            <ul className="list-disc list-outside ml-7 text-gray-700 space-y-0.5">
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
