import { Page, View, Text, Link, Image, StyleSheet } from "@react-pdf/renderer";
import { StructuredCV } from "@/lib/cv-types";

function cleanUrl(url: string): string {
  return url.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "");
}

const s = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 9,
    lineHeight: 1.35,
    color: "#1a1a1a",
  },
  banner: {
    backgroundColor: "#059669",
    padding: 24,
    paddingBottom: 16,
    flexDirection: "row",
    alignItems: "center",
  },
  photo: {
    width: 64,
    height: 64,
    borderRadius: 32,
    marginRight: 14,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.3)",
  },
  bannerInfo: { flex: 1 },
  name: {
    fontSize: 20,
    fontFamily: "Helvetica-Bold",
    color: "#ffffff",
    marginBottom: 3,
  },
  summaryBanner: {
    fontSize: 8.5,
    color: "rgba(255,255,255,0.8)",
    lineHeight: 1.3,
  },
  contactRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 3,
    marginTop: 6,
  },
  contactChip: {
    fontSize: 7.5,
    color: "rgba(255,255,255,0.9)",
  },
  contactSep: {
    fontSize: 7.5,
    color: "rgba(255,255,255,0.4)",
    marginHorizontal: 2,
  },
  body: {
    padding: 24,
    paddingTop: 16,
  },
  sectionHeader: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    color: "#047857",
    marginBottom: 4,
    marginTop: 8,
  },
  skillCatLabel: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: "#6b7280",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 2,
    marginTop: 3,
  },
  tagRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 3,
  },
  tag: {
    fontSize: 7.5,
    color: "#047857",
    backgroundColor: "#ecfdf5",
    borderWidth: 0.5,
    borderColor: "#a7f3d0",
    borderRadius: 8,
    padding: "2 6",
  },
  expEntry: {
    marginBottom: 5,
    paddingLeft: 8,
    borderLeftWidth: 1.5,
    borderLeftColor: "#a7f3d0",
  },
  expTitleRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" },
  expTitle: { fontFamily: "Helvetica-Bold", fontSize: 9, color: "#1f2937" },
  expOrg: { color: "#6b7280", fontSize: 9 },
  expDate: { fontSize: 7.5, color: "#059669", fontFamily: "Helvetica-Bold" },
  bullet: { flexDirection: "row", marginLeft: 4, marginTop: 1.5 },
  bulletDot: { width: 8, fontSize: 9, color: "#94a3b8" },
  bulletText: { flex: 1, fontSize: 8.5, color: "#4b5563" },
  techRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 2,
    marginTop: 2,
    marginLeft: 4,
  },
  techTag: {
    fontSize: 6.5,
    color: "#6b7280",
    backgroundColor: "#f3f4f6",
    padding: "1 4",
    borderRadius: 2,
  },
  twoCol: {
    flexDirection: "row",
    gap: 16,
    marginTop: 4,
  },
  col: { flex: 1 },
  eduDegree: { fontFamily: "Helvetica-Bold", fontSize: 9, color: "#1f2937" },
  eduInst: { fontSize: 8, color: "#6b7280" },
  eduDate: { fontSize: 7, color: "#059669", fontFamily: "Helvetica-Bold" },
  eduDetails: { fontSize: 7.5, color: "#9ca3af" },
  certItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 2,
  },
  certCheck: { fontSize: 8, color: "#059669", marginRight: 4 },
  certText: { fontSize: 8.5, color: "#4b5563", flex: 1 },
});

export default function CreativePDF({ cv }: { cv: StructuredCV }) {
  const pd = cv.personalDetails;

  const contactItems: { text: string; href?: string }[] = [];
  if (pd.email) contactItems.push({ text: pd.email, href: `mailto:${pd.email}` });
  if (pd.phone) contactItems.push({ text: pd.phone, href: `tel:${pd.phone}` });
  if (pd.location) contactItems.push({ text: pd.location });
  if (pd.linkedIn) {
    const href = pd.linkedIn.startsWith("http") ? pd.linkedIn : `https://${pd.linkedIn}`;
    contactItems.push({ text: "LinkedIn", href });
  }
  if (pd.github) {
    contactItems.push({ text: "GitHub", href: `https://github.com/${pd.github}` });
  }
  if (pd.website) {
    const href = pd.website.startsWith("http") ? pd.website : `https://${pd.website}`;
    contactItems.push({ text: "Portfolio", href });
  }

  return (
    <Page size="A4" style={s.page}>
      {/* Banner */}
      <View style={s.banner}>
        {pd.photoUrl && <Image src={pd.photoUrl} style={s.photo} />}
        <View style={s.bannerInfo}>
          {pd.fullName && <Text style={s.name}>{pd.fullName}</Text>}
          {cv.summary && <Text style={s.summaryBanner}>{cv.summary}</Text>}
          <View style={s.contactRow}>
            {contactItems.map((item, i) => (
              <View key={i} style={{ flexDirection: "row", alignItems: "center" }}>
                {i > 0 && <Text style={s.contactSep}>·</Text>}
                {item.href ? (
                  <Link src={item.href}>
                    <Text style={{ ...s.contactChip, textDecoration: "underline" }}>{item.text}</Text>
                  </Link>
                ) : (
                  <Text style={s.contactChip}>{item.text}</Text>
                )}
              </View>
            ))}
          </View>
        </View>
      </View>

      {/* Body */}
      <View style={s.body}>
        {cv.skills.length > 0 && (
          <View>
            <Text style={s.sectionHeader}>Skills</Text>
            {cv.skills.map((cat, i) => (
              <View key={i}>
                <Text style={s.skillCatLabel}>{cat.category}</Text>
                <View style={s.tagRow}>
                  {cat.items.map((item, j) => (
                    <Text key={j} style={s.tag}>{item}</Text>
                  ))}
                </View>
              </View>
            ))}
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

        <View style={s.twoCol}>
          {cv.education.length > 0 && (
            <View style={s.col}>
              <Text style={s.sectionHeader}>Education</Text>
              {cv.education.map((edu) => (
                <View key={edu.id} style={{ marginBottom: 4 }}>
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
            </View>
          )}

          {cv.certifications.length > 0 && (
            <View style={s.col}>
              <Text style={s.sectionHeader}>Certifications</Text>
              {cv.certifications.map((cert, i) => (
                <View key={i} style={s.certItem}>
                  <Text style={s.certCheck}>&#x2713;</Text>
                  <Text style={s.certText}>{cert}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </View>
    </Page>
  );
}
