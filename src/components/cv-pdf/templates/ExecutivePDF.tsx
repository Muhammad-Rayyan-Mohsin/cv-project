import { Page, View, Text, Link, StyleSheet } from "@react-pdf/renderer";
import { StructuredCV } from "@/lib/cv-types";
import { cleanUrl } from "@/lib/cv-utils";

const s = StyleSheet.create({
  page: {
    paddingTop: 32,
    paddingBottom: 32,
    paddingHorizontal: 40,
    fontFamily: "Helvetica",
    fontSize: 10.5,
    lineHeight: 1.35,
    color: "#1a1a1a",
  },
  headerBlock: {
    alignItems: "center",
    marginBottom: 4,
  },
  name: {
    fontSize: 22,
    fontFamily: "Helvetica-Bold",
    color: "#111827",
    marginBottom: 4,
    textAlign: "center",
  },
  contactRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    alignItems: "center",
    fontSize: 8.5,
    color: "#6b7280",
    marginBottom: 2,
  },
  contactSep: {
    color: "#9ca3af",
    marginHorizontal: 4,
  },
  contactLink: {
    color: "#4b5563",
    fontSize: 8.5,
  },
  tagline: {
    fontSize: 9,
    color: "#607d8b",
    textTransform: "uppercase",
    letterSpacing: 2.5,
    textAlign: "center",
    marginTop: 6,
    fontFamily: "Helvetica-Bold",
  },
  sectionHeader: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    color: "#111827",
    borderBottomWidth: 1.5,
    borderBottomColor: "#374151",
    paddingBottom: 2,
    marginBottom: 6,
    marginTop: 10,
  },
  expEntry: {
    marginBottom: 6,
  },
  expTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  expTitle: {
    fontFamily: "Helvetica-Bold",
    fontSize: 10.5,
    color: "#111827",
  },
  expDate: {
    fontSize: 8.5,
    color: "#6b7280",
  },
  expDivider: {
    borderBottomWidth: 0.5,
    borderBottomColor: "#d1d5db",
    marginTop: 2,
    marginBottom: 4,
  },
  bulletItem: {
    flexDirection: "row",
    marginLeft: 10,
    marginTop: 1.5,
  },
  bulletDot: {
    width: 10,
    fontSize: 10.5,
    color: "#374151",
  },
  bulletText: {
    flex: 1,
    fontSize: 10.5,
    color: "#374151",
  },
  techLine: {
    fontSize: 8,
    color: "#9ca3af",
    fontStyle: "italic",
    marginLeft: 10,
    marginTop: 2,
  },
  eduEntry: {
    paddingVertical: 3,
    borderBottomWidth: 0.5,
    borderBottomColor: "#e5e7eb",
  },
  eduTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  eduInstitution: {
    fontFamily: "Helvetica-Bold",
    fontSize: 10.5,
    color: "#111827",
  },
  eduMeta: {
    fontSize: 8.5,
    color: "#6b7280",
  },
  eduDegree: {
    fontSize: 10.5,
    color: "#4b5563",
  },
});

export default function ExecutivePDF({ cv }: { cv: StructuredCV }) {
  const pd = cv.personalDetails;

  const personalItems: { text: string; href?: string }[] = [];
  if (pd.email) personalItems.push({ text: pd.email, href: `mailto:${pd.email}` });
  if (pd.phone) personalItems.push({ text: pd.phone, href: `tel:${pd.phone}` });
  if (pd.location) personalItems.push({ text: pd.location });

  const linkItems: { text: string; href?: string }[] = [];
  if (pd.linkedIn) {
    const href = pd.linkedIn.startsWith("http") ? pd.linkedIn : `https://${pd.linkedIn}`;
    linkItems.push({ text: "LinkedIn", href });
  }
  if (pd.github) {
    linkItems.push({ text: "GitHub", href: `https://github.com/${pd.github}` });
  }
  if (pd.website) {
    const href = pd.website.startsWith("http") ? pd.website : `https://${pd.website}`;
    linkItems.push({ text: cleanUrl(pd.website), href });
  }

  return (
    <Page size="A4" style={s.page}>
      {pd.fullName && (
        <View style={s.headerBlock}>
          <Text style={s.name}>{pd.fullName}</Text>
          <View style={s.contactRow}>
            {personalItems.map((item, i) => (
              <View key={i} style={{ flexDirection: "row", alignItems: "center" }}>
                {i > 0 && <Text style={s.contactSep}>|</Text>}
                {item.href ? (
                  <Link src={item.href}>
                    <Text style={s.contactLink}>{item.text}</Text>
                  </Link>
                ) : (
                  <Text style={{ fontSize: 8.5, color: "#6b7280" }}>{item.text}</Text>
                )}
              </View>
            ))}
          </View>
          {linkItems.length > 0 && (
            <View style={{ ...s.contactRow, marginTop: 0 }}>
              {linkItems.map((item, i) => (
                <View key={i} style={{ flexDirection: "row", alignItems: "center" }}>
                  {i > 0 && <Text style={s.contactSep}>|</Text>}
                  {item.href ? (
                    <Link src={item.href}>
                      <Text style={s.contactLink}>{item.text}</Text>
                    </Link>
                  ) : (
                    <Text style={{ fontSize: 8.5, color: "#6b7280" }}>{item.text}</Text>
                  )}
                </View>
              ))}
            </View>
          )}
          {cv.summary && <Text style={s.tagline}>{cv.summary}</Text>}
        </View>
      )}

      {cv.skills.length > 0 && (
        <View>
          <Text style={s.sectionHeader}>Skills</Text>
          {cv.skills.map((cat, i) => (
            <View key={i} style={{ flexDirection: "row", marginBottom: 1.5 }}>
              <Text style={{ fontFamily: "Helvetica-Bold", fontSize: 10.5 }}>
                {cat.category}:{" "}
              </Text>
              <Text style={{ fontSize: 10.5, color: "#374151" }}>
                {cat.items.join(", ")}
              </Text>
            </View>
          ))}
        </View>
      )}

      {cv.experience.length > 0 && (
        <View>
          <Text style={s.sectionHeader}>Work Experience</Text>
          {cv.experience.map((exp) => (
            <View key={exp.id} style={s.expEntry}>
              <View style={s.expTitleRow}>
                <View style={{ flexDirection: "row" }}>
                  <Text style={s.expTitle}>{exp.title}</Text>
                  {exp.organization && (
                    <Text style={s.expTitle}> at {exp.organization}</Text>
                  )}
                </View>
                {(exp.startDate || exp.endDate) && (
                  <Text style={s.expDate}>
                    {exp.startDate}{exp.endDate && ` - ${exp.endDate}`}
                  </Text>
                )}
              </View>
              <View style={s.expDivider} />
              {exp.bullets.filter((b) => b.trim()).map((bullet, bi) => (
                <View key={bi} style={s.bulletItem}>
                  <Text style={s.bulletDot}>•</Text>
                  <Text style={s.bulletText}>{bullet}</Text>
                </View>
              ))}
              {exp.technologies.length > 0 && (
                <Text style={s.techLine}>{exp.technologies.join(" · ")}</Text>
              )}
            </View>
          ))}
        </View>
      )}

      {cv.education.length > 0 && (
        <View>
          <Text style={s.sectionHeader}>Education</Text>
          {cv.education.map((edu) => (
            <View key={edu.id} style={s.eduEntry}>
              <View style={s.eduTitleRow}>
                <Text style={s.eduInstitution}>{edu.institution}</Text>
                <Text style={s.eduMeta}>
                  {[edu.startDate, edu.endDate].filter(Boolean).join(" - ")}
                  {edu.details ? ` | ${edu.details}` : ""}
                </Text>
              </View>
              <Text style={s.eduDegree}>{edu.degree}</Text>
            </View>
          ))}
        </View>
      )}

      {cv.certifications.length > 0 && (
        <View>
          <Text style={s.sectionHeader}>Certifications</Text>
          {cv.certifications.map((cert, i) => (
            <View key={i} style={s.bulletItem}>
              <Text style={s.bulletDot}>•</Text>
              <Text style={s.bulletText}>{cert}</Text>
            </View>
          ))}
        </View>
      )}
    </Page>
  );
}
