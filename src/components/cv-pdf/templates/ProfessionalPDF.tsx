import { Page, View, Text, Link, Image, StyleSheet } from "@react-pdf/renderer";
import { StructuredCV } from "@/lib/cv-types";
import { cleanUrl } from "@/lib/cv-utils";

const s = StyleSheet.create({
  page: {
    paddingTop: 32,
    paddingBottom: 32,
    paddingHorizontal: 32,
    fontFamily: "Helvetica",
    fontSize: 10.5,
    lineHeight: 1.35,
    color: "#1a1a1a",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 4,
    gap: 16,
  },
  photo: {
    width: 80,
    height: 80,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  headerInfo: {
    flex: 1,
  },
  name: {
    fontSize: 22,
    fontFamily: "Helvetica-Bold",
    color: "#111827",
    marginBottom: 8,
  },
  contactGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 2,
  },
  contactCell: {
    flexDirection: "row",
    alignItems: "center",
    width: "48%",
    marginBottom: 2,
    gap: 6,
  },
  contactLabel: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: "#6366f1",
    width: 42,
  },
  contactValue: {
    fontSize: 8.5,
    color: "#374151",
  },
  contactLink: {
    fontSize: 8.5,
    color: "#4338ca",
  },
  accentLine: {
    height: 3,
    backgroundColor: "#6366f1",
    borderRadius: 2,
    marginTop: 12,
    marginBottom: 16,
  },
  sectionHeader: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    color: "#3730a3",
    marginBottom: 6,
    marginTop: 16,
    flexDirection: "row",
    alignItems: "center",
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#6366f1",
    marginRight: 8,
  },
  bodyText: {
    fontSize: 10.5,
    color: "#374151",
    lineHeight: 1.4,
    marginLeft: 14,
  },
  skillRow: {
    flexDirection: "row",
    marginBottom: 1.5,
    marginLeft: 14,
  },
  skillCat: { fontFamily: "Helvetica-Bold", fontSize: 10.5, color: "#1f2937" },
  skillItems: { fontSize: 10.5, color: "#4b5563" },
  expEntry: { marginBottom: 10, marginLeft: 14 },
  expTitleRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" },
  expTitle: { fontFamily: "Helvetica-Bold", fontSize: 10.5, color: "#1f2937" },
  expOrg: { color: "#6b7280", fontSize: 10.5 },
  expDate: { fontSize: 8.5, color: "#818cf8", fontFamily: "Helvetica-Bold" },
  bullet: { flexDirection: "row", marginLeft: 6, marginTop: 2 },
  bulletDot: { width: 8, fontSize: 10.5, color: "#374151" },
  bulletText: { flex: 1, fontSize: 10.5, color: "#374151" },
  techRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
    marginTop: 4,
  },
  techTag: {
    fontSize: 7.5,
    color: "#4f46e5",
    backgroundColor: "#eef2ff",
    padding: "2 6",
    borderRadius: 2,
    fontFamily: "Helvetica-Bold",
  },
  eduEntry: { marginBottom: 6, marginLeft: 14 },
  eduRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" },
  eduDegree: { fontFamily: "Helvetica-Bold", fontSize: 10.5, color: "#1f2937" },
  eduInst: { color: "#6b7280", fontSize: 10.5 },
  eduDetails: { fontSize: 9, color: "#6b7280", marginTop: 1 },
});

export default function ProfessionalPDF({ cv }: { cv: StructuredCV }) {
  const pd = cv.personalDetails;

  const contacts: { label: string; text: string; href?: string }[] = [];
  if (pd.email) contacts.push({ label: "EMAIL", text: pd.email, href: `mailto:${pd.email}` });
  if (pd.phone) contacts.push({ label: "PHONE", text: pd.phone, href: `tel:${pd.phone}` });
  if (pd.location) contacts.push({ label: "LOCATION", text: pd.location });
  if (pd.linkedIn) {
    const href = pd.linkedIn.startsWith("http") ? pd.linkedIn : `https://${pd.linkedIn}`;
    contacts.push({ label: "LINKEDIN", text: cleanUrl(pd.linkedIn), href });
  }
  if (pd.github) {
    contacts.push({ label: "GITHUB", text: pd.github, href: `https://github.com/${pd.github}` });
  }
  if (pd.website) {
    const href = pd.website.startsWith("http") ? pd.website : `https://${pd.website}`;
    contacts.push({ label: "WEBSITE", text: cleanUrl(pd.website), href });
  }

  return (
    <Page size="A4" style={s.page}>
      {pd.fullName && (
        <View>
          <View style={s.headerRow}>
            {pd.photoUrl && <Image src={pd.photoUrl} style={s.photo} />}
            <View style={s.headerInfo}>
              <Text style={s.name}>{pd.fullName}</Text>
              <View style={s.contactGrid}>
                {contacts.map((c, i) => (
                  <View key={i} style={s.contactCell}>
                    <Text style={s.contactLabel}>{c.label}</Text>
                    {c.href ? (
                      <Link src={c.href}>
                        <Text style={s.contactLink}>{c.text}</Text>
                      </Link>
                    ) : (
                      <Text style={s.contactValue}>{c.text}</Text>
                    )}
                  </View>
                ))}
              </View>
            </View>
          </View>
          <View style={s.accentLine} />
        </View>
      )}

      {cv.summary && (
        <View>
          <View style={s.sectionHeader}>
            <View style={s.dot} />
            <Text>Professional Summary</Text>
          </View>
          <Text style={s.bodyText}>{cv.summary}</Text>
        </View>
      )}

      {cv.skills.length > 0 && (
        <View>
          <View style={s.sectionHeader}>
            <View style={s.dot} />
            <Text>Technical Skills</Text>
          </View>
          {cv.skills.map((cat, i) => (
            <View key={i} style={s.skillRow}>
              <Text style={s.skillCat}>{cat.category}: </Text>
              <Text style={s.skillItems}>{cat.items.join(", ")}</Text>
            </View>
          ))}
        </View>
      )}

      {cv.experience.length > 0 && (
        <View>
          <View style={s.sectionHeader}>
            <View style={s.dot} />
            <Text>Experience</Text>
          </View>
          {cv.experience.map((exp) => (
            <View key={exp.id} style={s.expEntry}>
              <View style={s.expTitleRow}>
                <View style={{ flexDirection: "row" }}>
                  <Text style={s.expTitle}>{exp.title}</Text>
                  {exp.organization && <Text style={s.expOrg}> — {exp.organization}</Text>}
                </View>
                {(exp.startDate || exp.endDate) && (
                  <Text style={s.expDate}>
                    {exp.startDate}{exp.endDate && ` – ${exp.endDate}`}
                  </Text>
                )}
              </View>
              {exp.bullets.filter((b) => b.trim()).map((bullet, bi) => (
                <View key={bi} style={s.bullet}>
                  <Text style={s.bulletDot}>•</Text>
                  <Text style={s.bulletText}>{bullet}</Text>
                </View>
              ))}
              {exp.technologies.length > 0 && (
                <View style={s.techRow}>
                  {exp.technologies.map((t, ti) => (
                    <Text key={ti} style={s.techTag}>{t}</Text>
                  ))}
                </View>
              )}
            </View>
          ))}
        </View>
      )}

      {cv.education.length > 0 && (
        <View>
          <View style={s.sectionHeader}>
            <View style={s.dot} />
            <Text>Education</Text>
          </View>
          {cv.education.map((edu) => (
            <View key={edu.id} style={s.eduEntry}>
              <View style={s.eduRow}>
                <View style={{ flexDirection: "row" }}>
                  <Text style={s.eduDegree}>{edu.degree}</Text>
                  {edu.institution && <Text style={s.eduInst}> — {edu.institution}</Text>}
                </View>
                {(edu.startDate || edu.endDate) && (
                  <Text style={s.expDate}>
                    {edu.startDate}{edu.endDate && ` – ${edu.endDate}`}
                  </Text>
                )}
              </View>
              {edu.details && <Text style={s.eduDetails}>{edu.details}</Text>}
            </View>
          ))}
        </View>
      )}

      {cv.certifications.length > 0 && (
        <View>
          <View style={s.sectionHeader}>
            <View style={s.dot} />
            <Text>Certifications</Text>
          </View>
          {cv.certifications.map((cert, i) => (
            <View key={i} style={{...s.bullet, marginLeft: 14}}>
              <Text style={s.bulletDot}>•</Text>
              <Text style={s.bulletText}>{cert}</Text>
            </View>
          ))}
        </View>
      )}
    </Page>
  );
}
