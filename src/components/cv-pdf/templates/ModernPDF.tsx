import { Page, View, Text, Link, Image, StyleSheet } from "@react-pdf/renderer";
import { StructuredCV } from "@/lib/cv-types";
import { cleanUrl } from "@/lib/cv-utils";

const s = StyleSheet.create({
  page: {
    flexDirection: "row",
    fontFamily: "Helvetica",
    fontSize: 10,
    lineHeight: 1.4,
    color: "#1a1a1a",
  },
  sidebar: {
    width: 200,
    backgroundColor: "#1e293b",
    color: "#e2e8f0",
    padding: 20,
  },
  main: {
    flex: 1,
    padding: 24,
  },
  photo: {
    width: 96,
    height: 96,
    borderRadius: 48,
    marginBottom: 16,
    alignSelf: "center",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.2)",
  },
  name: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    color: "#ffffff",
    marginBottom: 16,
    textAlign: "center",
  },
  sideLabel: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: "#94a3b8",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 4,
    marginTop: 20,
  },
  contactRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 4,
    gap: 4,
  },
  contactIcon: {
    fontSize: 7.5,
    color: "#94a3b8",
    width: 16,
  },
  contactItem: {
    fontSize: 8.5,
    color: "#e2e8f0",
    flex: 1,
  },
  contactLink: {
    fontSize: 8.5,
    color: "#e2e8f0",
  },
  skillCat: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: "#cbd5e1",
    marginBottom: 2,
    marginTop: 8,
  },
  skillTag: {
    fontSize: 7.5,
    color: "#e2e8f0",
    backgroundColor: "#334155",
    padding: "2 6",
    borderRadius: 4,
    marginRight: 4,
    marginBottom: 4,
  },
  sectionHeader: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    color: "#1e293b",
    borderBottomWidth: 2,
    borderBottomColor: "#e2e8f0",
    paddingBottom: 4,
    marginBottom: 8,
    marginTop: 16,
  },
  expEntry: { marginBottom: 12 },
  expTitleRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" },
  expTitle: { fontFamily: "Helvetica-Bold", fontSize: 10, color: "#1e293b" },
  expOrg: { color: "#6b7280", fontSize: 10 },
  expDate: { fontSize: 8, color: "#6b7280" },
  bullet: { flexDirection: "row", marginLeft: 8, marginTop: 2 },
  bulletDot: { width: 8, fontSize: 10, color: "#374151" },
  bulletText: { flex: 1, fontSize: 10, color: "#374151" },
  techLine: { fontSize: 8, color: "#9ca3af", fontStyle: "italic", marginLeft: 8, marginTop: 2 },
  bodyText: { fontSize: 10, color: "#374151", lineHeight: 1.4 },
  eduDegree: { fontFamily: "Helvetica-Bold", fontSize: 8.5, color: "#ffffff" },
  eduInst: { color: "#cbd5e1", fontSize: 8 },
  eduDate: { fontSize: 7.5, color: "#94a3b8" },
  eduDetails: { fontSize: 7.5, color: "#94a3b8", marginTop: 2 },
  eduEntry: { marginBottom: 8 },
  certItem: { flexDirection: "row", marginLeft: 8, marginTop: 2 },
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
          <View style={s.contactRow}>
            <Text style={s.contactIcon}>@</Text>
            <Link src={`mailto:${pd.email}`}>
              <Text style={s.contactLink}>{pd.email}</Text>
            </Link>
          </View>
        )}
        {pd.phone && (
          <View style={s.contactRow}>
            <Text style={s.contactIcon}>#</Text>
            <Link src={`tel:${pd.phone}`}>
              <Text style={s.contactLink}>{pd.phone}</Text>
            </Link>
          </View>
        )}
        {pd.location && (
          <View style={s.contactRow}>
            <Text style={s.contactIcon}>~</Text>
            <Text style={s.contactItem}>{pd.location}</Text>
          </View>
        )}
        {pd.linkedIn && (
          <View style={s.contactRow}>
            <Text style={s.contactIcon}>in</Text>
            <Link src={pd.linkedIn.startsWith("http") ? pd.linkedIn : `https://${pd.linkedIn}`}>
              <Text style={s.contactLink}>{cleanUrl(pd.linkedIn)}</Text>
            </Link>
          </View>
        )}
        {pd.github && (
          <View style={s.contactRow}>
            <Text style={s.contactIcon}>{"</>"}</Text>
            <Link src={`https://github.com/${pd.github}`}>
              <Text style={s.contactLink}>{pd.github}</Text>
            </Link>
          </View>
        )}
        {pd.website && (
          <View style={s.contactRow}>
            <Text style={s.contactIcon}>www</Text>
            <Link src={pd.website.startsWith("http") ? pd.website : `https://${pd.website}`}>
              <Text style={s.contactLink}>{cleanUrl(pd.website)}</Text>
            </Link>
          </View>
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
              <View key={edu.id} style={s.eduEntry}>
                <Text style={s.eduDegree}>{edu.degree}</Text>
                <Text style={s.eduInst}>{edu.institution}</Text>
                {(edu.startDate || edu.endDate) && (
                  <Text style={s.eduDate}>
                    {edu.startDate}{edu.endDate && ` – ${edu.endDate}`}
                  </Text>
                )}
                {edu.details && <Text style={s.eduDetails}>{edu.details}</Text>}
              </View>
            ))}
          </>
        )}
      </View>

      {/* Main */}
      <View style={s.main}>
        {cv.summary && (
          <View>
            <Text style={{...s.sectionHeader, marginTop: 0}}>Professional Summary</Text>
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
