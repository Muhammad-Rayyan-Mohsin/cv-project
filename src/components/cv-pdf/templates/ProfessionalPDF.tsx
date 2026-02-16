import { Page, View, Text, Link, Image, StyleSheet } from "@react-pdf/renderer";
import { StructuredCV } from "@/lib/cv-types";

function cleanUrl(url: string): string {
  return url.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "");
}

const s = StyleSheet.create({
  page: {
    paddingTop: 32,
    paddingBottom: 32,
    paddingHorizontal: 40,
    fontFamily: "Helvetica",
    fontSize: 9,
    lineHeight: 1.35,
    color: "#1a1a1a",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 4,
  },
  photo: {
    width: 56,
    height: 56,
    borderRadius: 4,
    marginRight: 12,
  },
  headerInfo: {
    flex: 1,
  },
  name: {
    fontSize: 20,
    fontFamily: "Helvetica-Bold",
    color: "#111827",
    marginBottom: 4,
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
  },
  contactLabel: {
    fontSize: 6.5,
    fontFamily: "Helvetica-Bold",
    color: "#6366f1",
    marginRight: 4,
    width: 42,
  },
  contactValue: {
    fontSize: 8,
    color: "#374151",
  },
  contactLink: {
    fontSize: 8,
    color: "#4338ca",
  },
  accentLine: {
    height: 2.5,
    backgroundColor: "#6366f1",
    borderRadius: 2,
    marginTop: 6,
    marginBottom: 8,
  },
  sectionHeader: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    color: "#312e81",
    marginBottom: 4,
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#6366f1",
    marginRight: 6,
  },
  bodyText: {
    fontSize: 9,
    color: "#475569",
    lineHeight: 1.4,
    marginLeft: 11,
  },
  skillRow: {
    flexDirection: "row",
    marginBottom: 1.5,
    marginLeft: 11,
  },
  skillCat: { fontFamily: "Helvetica-Bold", fontSize: 9, color: "#374151" },
  skillItems: { fontSize: 9, color: "#64748b" },
  expEntry: { marginBottom: 6, marginLeft: 11 },
  expTitleRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" },
  expTitle: { fontFamily: "Helvetica-Bold", fontSize: 9, color: "#374151" },
  expOrg: { color: "#6b7280", fontSize: 9 },
  expDate: { fontSize: 7.5, color: "#818cf8", fontFamily: "Helvetica-Bold" },
  bullet: { flexDirection: "row", marginLeft: 6, marginTop: 1.5 },
  bulletDot: { width: 8, fontSize: 9, color: "#94a3b8" },
  bulletText: { flex: 1, fontSize: 8.5, color: "#4b5563" },
  techTag: { fontSize: 7, color: "#6366f1", marginTop: 2 },
  eduEntry: { marginBottom: 3, marginLeft: 11 },
  eduRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" },
  eduDegree: { fontFamily: "Helvetica-Bold", fontSize: 9, color: "#374151" },
  eduInst: { color: "#6b7280", fontSize: 9 },
  eduDetails: { fontSize: 8, color: "#94a3b8", marginTop: 1 },
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
                <Text style={s.techTag}>{exp.technologies.join(" · ")}</Text>
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
            <View key={i} style={s.bullet}>
              <Text style={s.bulletDot}>•</Text>
              <Text style={s.bulletText}>{cert}</Text>
            </View>
          ))}
        </View>
      )}
    </Page>
  );
}
