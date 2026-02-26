"use client";

import { StructuredCV } from "@/lib/cv-types";
import { linkify } from "@/lib/cv-utils";

export default function CreativePreview({ cv }: { cv: StructuredCV }) {
  const pd = cv.personalDetails;

  const makeHref = (url: string) => linkify(url).href;

  return (
    <div className="overflow-x-auto -mx-4 sm:mx-0">
      <div className="bg-white text-black rounded-lg shadow-lg max-w-[210mm] mx-auto min-w-[320px] overflow-hidden">
        {/* Top Banner */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-500 p-4 sm:p-6 text-white">
          <div className="flex items-center gap-4">
            {pd.photoUrl && (
              <img
                src={pd.photoUrl}
                alt={pd.fullName}
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover border-3 border-white/30 shrink-0"
              />
            )}
            <div className="flex-1 min-w-0">
              {pd.fullName && (
                <h1 className="text-[18pt] sm:text-[24pt] font-extrabold leading-tight tracking-tight">
                  {pd.fullName}
                </h1>
              )}
              {cv.summary && (
                <p className="text-white/80 text-[8.5pt] sm:text-[9.5pt] mt-1 line-clamp-2">
                  {cv.summary}
                </p>
              )}
            </div>
          </div>

          {/* Contact Row */}
          <div className="flex flex-wrap gap-x-3 gap-y-1 text-[8pt] sm:text-[8.5pt] mt-3 text-white/90">
            {pd.email && (
              <a href={`mailto:${pd.email}`} className="hover:text-white hover:underline">
                {pd.email}
              </a>
            )}
            {pd.phone && (
              <>
                <span className="text-white/40">&#183;</span>
                <a href={`tel:${pd.phone}`} className="hover:text-white hover:underline">
                  {pd.phone}
                </a>
              </>
            )}
            {pd.location && (
              <>
                <span className="text-white/40">&#183;</span>
                <span>{pd.location}</span>
              </>
            )}
            {pd.linkedIn && (
              <>
                <span className="text-white/40">&#183;</span>
                <a
                  href={makeHref(pd.linkedIn)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white hover:underline"
                >
                  LinkedIn
                </a>
              </>
            )}
            {pd.github && (
              <>
                <span className="text-white/40">&#183;</span>
                <a
                  href={`https://github.com/${pd.github}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white hover:underline"
                >
                  GitHub
                </a>
              </>
            )}
            {pd.website && (
              <>
                <span className="text-white/40">&#183;</span>
                <a
                  href={makeHref(pd.website)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white hover:underline"
                >
                  Portfolio
                </a>
              </>
            )}
          </div>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-6 text-[9pt] sm:text-[10pt] leading-[1.4]">
          {/* Skills as Tags */}
          {cv.skills.length > 0 && (
            <div className="mb-4">
              <h2 className="text-[10pt] font-bold uppercase tracking-wider text-emerald-700 mb-2">
                Skills
              </h2>
              <div className="space-y-2">
                {cv.skills.map((cat, i) => (
                  <div key={i}>
                    <p className="text-[8pt] font-semibold text-gray-500 uppercase tracking-wider mb-1">
                      {cat.category}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {cat.items.map((item, j) => (
                        <span
                          key={j}
                          className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full text-[8pt] font-medium"
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

          {/* Experience */}
          {cv.experience.length > 0 && (
            <div className="mb-4">
              <h2 className="text-[10pt] font-bold uppercase tracking-wider text-emerald-700 mb-2">
                Experience
              </h2>
              <div className="space-y-3">
                {cv.experience.map((exp) => (
                  <div key={exp.id} className="border-l-2 border-emerald-200 pl-3">
                    <div className="flex items-baseline justify-between">
                      <span className="font-bold text-gray-800">
                        {exp.title}
                        {exp.organization && (
                          <span className="font-normal text-gray-500"> &mdash; {exp.organization}</span>
                        )}
                      </span>
                      {(exp.startDate || exp.endDate) && (
                        <span className="text-[8pt] text-emerald-500 shrink-0 ml-2 font-medium">
                          {exp.startDate}
                          {exp.endDate && ` – ${exp.endDate}`}
                        </span>
                      )}
                    </div>
                    {exp.bullets.length > 0 && (
                      <ul className="list-disc list-outside ml-3 mt-0.5 space-y-0.5 text-gray-600">
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
                            className="bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded text-[7.5pt]"
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

          {/* Two-column bottom: Education + Certifications */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {cv.education.length > 0 && (
              <div>
                <h2 className="text-[10pt] font-bold uppercase tracking-wider text-emerald-700 mb-2">
                  Education
                </h2>
                <div className="space-y-2">
                  {cv.education.map((edu) => (
                    <div key={edu.id}>
                      <p className="font-semibold text-gray-800 text-[9.5pt]">{edu.degree}</p>
                      <p className="text-gray-500 text-[8.5pt]">{edu.institution}</p>
                      {(edu.startDate || edu.endDate) && (
                        <p className="text-emerald-500 text-[8pt] font-medium">
                          {edu.startDate}
                          {edu.endDate && ` – ${edu.endDate}`}
                        </p>
                      )}
                      {edu.details && (
                        <p className="text-gray-400 text-[8pt]">{edu.details}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {cv.certifications.length > 0 && (
              <div>
                <h2 className="text-[10pt] font-bold uppercase tracking-wider text-emerald-700 mb-2">
                  Certifications
                </h2>
                <ul className="space-y-1">
                  {cv.certifications.map((cert, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-1.5 text-gray-700 text-[9pt]"
                    >
                      <span className="text-emerald-500 mt-0.5">&#x2713;</span>
                      {cert}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
