"use client";

import { StructuredCV } from "@/lib/cv-types";

function linkify(url: string, label?: string) {
  const href = url.startsWith("http") ? url : `https://${url}`;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="hover:underline"
    >
      {label || url}
    </a>
  );
}

export default function ModernPreview({ cv }: { cv: StructuredCV }) {
  const pd = cv.personalDetails;

  return (
    <div className="overflow-x-auto -mx-4 sm:mx-0">
      <div className="bg-white text-black rounded-lg shadow-lg max-w-[210mm] mx-auto min-w-[320px] flex flex-col sm:flex-row">
        {/* Sidebar */}
        <div className="w-full sm:w-[200px] bg-slate-800 text-white p-4 sm:p-5 shrink-0 rounded-t-lg sm:rounded-t-none sm:rounded-l-lg">
          {/* Photo */}
          {pd.photoUrl && (
            <div className="flex justify-center mb-4">
              <img
                src={pd.photoUrl}
                alt={pd.fullName}
                className="w-24 h-24 rounded-full object-cover border-2 border-white/20"
              />
            </div>
          )}

          {/* Name */}
          {pd.fullName && (
            <h1 className="text-[14pt] font-bold text-white leading-tight mb-4 text-center sm:text-left">
              {pd.fullName}
            </h1>
          )}

          {/* Contact */}
          <div className="space-y-2 text-[8.5pt] mb-5">
            <h3 className="text-[8pt] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Contact
            </h3>
            {pd.email && (
              <div className="flex items-start gap-2">
                <span className="text-slate-400 shrink-0">@</span>
                <a href={`mailto:${pd.email}`} className="text-slate-200 hover:text-white hover:underline break-all">
                  {pd.email}
                </a>
              </div>
            )}
            {pd.phone && (
              <div className="flex items-start gap-2">
                <span className="text-slate-400 shrink-0">#</span>
                <a href={`tel:${pd.phone}`} className="text-slate-200 hover:text-white hover:underline">
                  {pd.phone}
                </a>
              </div>
            )}
            {pd.location && (
              <div className="flex items-start gap-2">
                <span className="text-slate-400 shrink-0">~</span>
                <span className="text-slate-200">{pd.location}</span>
              </div>
            )}
            {pd.linkedIn && (
              <div className="flex items-start gap-2">
                <span className="text-slate-400 shrink-0">in</span>
                <span className="text-slate-200 break-all">
                  {linkify(pd.linkedIn)}
                </span>
              </div>
            )}
            {pd.github && (
              <div className="flex items-start gap-2">
                <span className="text-slate-400 shrink-0">&lt;/&gt;</span>
                <span className="text-slate-200 break-all">
                  {linkify(`https://github.com/${pd.github}`, pd.github)}
                </span>
              </div>
            )}
            {pd.website && (
              <div className="flex items-start gap-2">
                <span className="text-slate-400 shrink-0">www</span>
                <span className="text-slate-200 break-all">
                  {linkify(pd.website)}
                </span>
              </div>
            )}
          </div>

          {/* Skills in sidebar */}
          {cv.skills.length > 0 && (
            <div className="mb-5">
              <h3 className="text-[8pt] font-bold uppercase tracking-wider text-slate-400 mb-2">
                Skills
              </h3>
              <div className="space-y-2">
                {cv.skills.map((cat, i) => (
                  <div key={i}>
                    <p className="text-[8pt] font-semibold text-slate-300 mb-0.5">
                      {cat.category}
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {cat.items.map((item, j) => (
                        <span
                          key={j}
                          className="bg-slate-700 text-slate-200 px-1.5 py-0.5 rounded text-[7.5pt]"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Education in sidebar */}
          {cv.education.length > 0 && (
            <div>
              <h3 className="text-[8pt] font-bold uppercase tracking-wider text-slate-400 mb-2">
                Education
              </h3>
              <div className="space-y-2">
                {cv.education.map((edu) => (
                  <div key={edu.id}>
                    <p className="text-[8.5pt] font-semibold text-white leading-tight">
                      {edu.degree}
                    </p>
                    <p className="text-[8pt] text-slate-300">{edu.institution}</p>
                    {(edu.startDate || edu.endDate) && (
                      <p className="text-[7.5pt] text-slate-400">
                        {edu.startDate}
                        {edu.endDate && ` – ${edu.endDate}`}
                      </p>
                    )}
                    {edu.details && (
                      <p className="text-[7.5pt] text-slate-400 mt-0.5">{edu.details}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Main Content */}
        <div className="flex-1 p-4 sm:p-6 text-[9pt] sm:text-[10pt] leading-[1.4]">
          {/* Summary */}
          {cv.summary && (
            <div className="mb-4">
              <h2 className="text-[10pt] font-bold uppercase tracking-wider text-slate-800 border-b-2 border-slate-200 pb-1 mb-2">
                Professional Summary
              </h2>
              <p className="text-gray-700">{cv.summary}</p>
            </div>
          )}

          {/* Experience */}
          {cv.experience.length > 0 && (
            <div className="mb-4">
              <h2 className="text-[10pt] font-bold uppercase tracking-wider text-slate-800 border-b-2 border-slate-200 pb-1 mb-2">
                Experience
              </h2>
              <div className="space-y-3">
                {cv.experience.map((exp) => (
                  <div key={exp.id}>
                    <div className="flex items-baseline justify-between">
                      <span className="font-bold text-slate-800">
                        {exp.title}
                        {exp.organization && (
                          <span className="font-normal text-gray-500">
                            {" "}— {exp.organization}
                          </span>
                        )}
                      </span>
                      {(exp.startDate || exp.endDate) && (
                        <span className="text-[8pt] text-gray-500 shrink-0 ml-2">
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

          {/* Certifications */}
          {cv.certifications.length > 0 && (
            <div>
              <h2 className="text-[10pt] font-bold uppercase tracking-wider text-slate-800 border-b-2 border-slate-200 pb-1 mb-2">
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
    </div>
  );
}
