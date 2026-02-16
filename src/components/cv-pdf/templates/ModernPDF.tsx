import { Page, View, Text, Link, Image, StyleSheet } from "@react-pdf/renderer";
import { StructuredCV } from "@/lib/cv-types";

function cleanUrl(url: string): string {
  return url.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "");
}

const s = StyleSheet.create({
  page: {
    flexDirection: "row",
    fontFamily: "Helvetica",
    fontSize: 9,
    lineHeight: 1.35,
    color: "#1a1a1a",
  },
  sidebar: {
    width: 180,
    backgroundColor: "#1e293b",
    color: "#e2e8f0",
    padding: 20,
    paddingTop: 28,
  },
  main: {
    flex: 1,
    padding: 28,
    paddingLeft: 24,
  },
  photo: {
    width: 70,
    height: 70,
    borderRadius: 35,
    marginBottom: 10,
    alignSelf: "center",
  },
  name: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    color: "#ffffff",
    marginBottom: 12,
    textAlign: "center",
  },
  sideLabel: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: "#94a3b8",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 4,
    marginTop: 10,
  },
  contactItem: {
    fontSize: 7.5,
    color: "#cbd5e1",
    marginBottom: 3,
  },
  contactLink: {
    fontSize: 7.5,
    color: "#93c5fd",
  },
  skillCat: {
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
    color: "#e2e8f0",
    marginBottom: 1,
    marginTop: 4,
  },
  skillTag: {
    fontSize: 7,
    color: "#cbd5e1",
    backgroundColor: "#334155",
    padding: "2 4",
    borderRadius: 2,
    marginRight: 2,
    marginBottom: 2,
  },
  sectionHeader: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    color: "#1e293b",
    borderBottomWidth: 1.5,
    borderBottomColor: "#e2e8f0",
    paddingBottom: 2,
    marginBottom: 5,
    marginTop: 10,
  },
  expEntry: { marginBottom: 6 },
  expTitleRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" },
  expTitle: { fontFamily: "Helvetica-Bold", fontSize: 9 },
  expOrg: { color: "#64748b", fontSize: 9 },
  expDate: { fontSize: 7.5, color: "#94a3b8" },
  bullet: { flexDirection: "row", marginLeft: 8, marginTop: 1.5 },
  bulletDot: { width: 8, fontSize: 9, color: "#94a3b8" },
  bulletText: { flex: 1, fontSize: 8.5, color: "#374151" },
  techLine: { fontSize: 7, color: "#94a3b8", fontStyle: "italic", marginLeft: 8, marginTop: 1 },
  bodyText: { fontSize: 9, color: "#475569", lineHeight: 1.4 },
  eduDegree: { fontFamily: "Helvetica-Bold", fontSize: 9 },
  eduInst: { color: "#64748b", fontSize: 9 },
  eduDetails: { fontSize: 7.5, color: "#94a3b8", marginTop: 1 },
  eduEntry: { marginBottom: 4 },
  certItem: { flexDirection: "row", marginLeft: 8, marginTop: 1.5 },
});

export default function ModernPDF({ cv }: { cv: StructuredCV }) {
  const pd = cv.personalDetails;

  return (
    <Page size="A4" style={s.page}>
      {/* Sidebar */}
      <View style={s.sidebar}>
        {pd.photoUrl && <Image src={pd.photoUrl} style={s.photo} />}
        {pd.fullName && <Text style={s.name}>{pd.fullName}</Text>}

        <Text style={s.sideLabel}>Contact</Text>
        {pd.email && (
          <Link src={`mailto:${pd.email}`}>
            <Text style={s.contactLink}>{pd.email}</Text>
          </Link>
        )}
        {pd.phone && (
          <Link src={`tel:${pd.phone}`}>
            <Text style={s.contactLink}>{pd.phone}</Text>
          </Link>
        )}
        {pd.location && <Text style={s.contactItem}>{pd.location}</Text>}
        {pd.linkedIn && (
          <Link src={pd.linkedIn.startsWith("http") ? pd.linkedIn : `https://${pd.linkedIn}`}>
            <Text style={s.contactLink}>{cleanUrl(pd.linkedIn)}</Text>
          </Link>
        )}
        {pd.github && (
          <Link src={`https://github.com/${pd.github}`}>
            <Text style={s.contactLink}>{pd.github}</Text>
          </Link>
        )}
        {pd.website && (
          <Link src={pd.website.startsWith("http") ? pd.website : `https://${pd.website}`}>
            <Text style={s.contactLink}>{cleanUrl(pd.website)}</Text>
          </Link>
        )}

        {cv.skills.length > 0 && (
          <>
            <Text style={s.sideLabel}>Skills</Text>
            {cv.skills.map((cat, i) => (
              <View key={i}>
                <Text style={s.skillCat}>{cat.category}</Text>
                <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
                  {cat.items.map((item, j) => (
                    <Text key={j} style={s.skillTag}>{item}</Text>
                  ))}
                </View>
              </View>
            ))}
          </>
        )}

        {cv.education.length > 0 && (
          <>
            <Text style={s.sideLabel}>Education</Text>
            {cv.education.map((edu) => (
              <View key={edu.id} style={{ marginBottom: 4 }}>
                <Text style={{ fontSize: 8, fontFamily: "Helvetica-Bold", color: "#ffffff" }}>
                  {edu.degree}
                </Text>
                <Text style={{ fontSize: 7.5, color: "#cbd5e1" }}>{edu.institution}</Text>
                {(edu.startDate || edu.endDate) && (
                  <Text style={{ fontSize: 7, color: "#94a3b8" }}>
                    {edu.startDate}{edu.endDate && ` – ${edu.endDate}`}
                  </Text>
                )}
              </View>
            ))}
          </>
        )}
      </View>

      {/* Main */}
      <View style={s.main}>
        {cv.summary && (
          <View>
            <Text style={s.sectionHeader}>Professional Summary</Text>
            <Text style={s.bodyText}>{cv.summary}</Text>
          </View>
        )}

        {cv.experience.length > 0 && (
          <View>
            <Text style={s.sectionHeader}>Experience</Text>
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
                  <Text style={s.techLine}>{exp.technologies.join(" · ")}</Text>
                )}
              </View>
            ))}
          </View>
        )}

        {cv.certifications.length > 0 && (
          <View>
            <Text style={s.sectionHeader}>Certifications</Text>
            {cv.certifications.map((cert, i) => (
              <View key={i} style={s.certItem}>
                <Text style={s.bulletDot}>•</Text>
                <Text style={s.bulletText}>{cert}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </Page>
  );
}
