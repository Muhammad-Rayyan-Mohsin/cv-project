import { Page, View, Text, Link } from "@react-pdf/renderer";
import { StructuredCV } from "@/lib/cv-types";
import styles from "../pdfStyles";

function cleanUrl(url: string): string {
  return url.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "");
}

export default function ClassicPDF({ cv }: { cv: StructuredCV }) {
  const pd = cv.personalDetails;

  const contactItems: { text: string; href?: string }[] = [];
  if (pd.email) contactItems.push({ text: pd.email, href: `mailto:${pd.email}` });
  if (pd.phone) contactItems.push({ text: pd.phone, href: `tel:${pd.phone}` });
  if (pd.location) contactItems.push({ text: pd.location });
  if (pd.linkedIn) {
    const href = pd.linkedIn.startsWith("http") ? pd.linkedIn : `https://${pd.linkedIn}`;
    contactItems.push({ text: cleanUrl(pd.linkedIn), href });
  }
  if (pd.github) {
    contactItems.push({ text: `github.com/${pd.github}`, href: `https://github.com/${pd.github}` });
  }
  if (pd.website) {
    const href = pd.website.startsWith("http") ? pd.website : `https://${pd.website}`;
    contactItems.push({ text: cleanUrl(pd.website), href });
  }

  return (
    <Page size="A4" style={styles.page}>
      {pd.fullName && (
        <View>
          <Text style={styles.name}>{pd.fullName}</Text>
          <View style={styles.contactRow}>
            {contactItems.map((item, i) => (
              <View key={i} style={{ flexDirection: "row", alignItems: "center" }}>
                {i > 0 && <Text style={styles.contactSep}>|</Text>}
                {item.href ? (
                  <Link src={item.href}>
                    <Text style={{ color: "#2563eb", fontSize: 8 }}>{item.text}</Text>
                  </Link>
                ) : (
                  <Text style={{ fontSize: 8 }}>{item.text}</Text>
                )}
              </View>
            ))}
          </View>
          <View style={styles.divider} />
        </View>
      )}

      {cv.summary && (
        <View>
          <Text style={styles.sectionHeader}>Summary</Text>
          <Text style={styles.bodyText}>{cv.summary}</Text>
        </View>
      )}

      {cv.skills.length > 0 && (
        <View>
          <Text style={styles.sectionHeader}>Skills</Text>
          {cv.skills.map((cat, i) => (
            <View key={i} style={styles.skillRow}>
              <Text style={styles.skillCategory}>{cat.category}: </Text>
              <Text style={styles.skillItems}>{cat.items.join(", ")}</Text>
            </View>
          ))}
        </View>
      )}

      {cv.experience.length > 0 && (
        <View>
          <Text style={styles.sectionHeader}>Experience</Text>
          {cv.experience.map((exp) => (
            <View key={exp.id} style={styles.expEntry}>
              <View style={styles.expTitleRow}>
                <View style={{ flexDirection: "row" }}>
                  <Text style={styles.expTitle}>{exp.title}</Text>
                  {exp.organization && (
                    <Text style={styles.expOrg}> — {exp.organization}</Text>
                  )}
                </View>
                {(exp.startDate || exp.endDate) && (
                  <Text style={styles.expDate}>
                    {exp.startDate}{exp.endDate && ` – ${exp.endDate}`}
                  </Text>
                )}
              </View>
              {exp.bullets.filter((b) => b.trim()).map((bullet, bi) => (
                <View key={bi} style={styles.bulletItem}>
                  <Text style={styles.bulletDot}>•</Text>
                  <Text style={styles.bulletText}>{bullet}</Text>
                </View>
              ))}
              {exp.technologies.length > 0 && (
                <Text style={styles.techLine}>{exp.technologies.join(" · ")}</Text>
              )}
            </View>
          ))}
        </View>
      )}

      {cv.education.length > 0 && (
        <View>
          <Text style={styles.sectionHeader}>Education</Text>
          {cv.education.map((edu) => (
            <View key={edu.id} style={styles.eduEntry}>
              <View style={styles.eduTitleRow}>
                <View style={{ flexDirection: "row" }}>
                  <Text style={styles.eduDegree}>{edu.degree}</Text>
                  {edu.institution && (
                    <Text style={styles.eduInstitution}> — {edu.institution}</Text>
                  )}
                </View>
                {(edu.startDate || edu.endDate) && (
                  <Text style={styles.expDate}>
                    {edu.startDate}{edu.endDate && ` – ${edu.endDate}`}
                  </Text>
                )}
              </View>
              {edu.details && <Text style={styles.eduDetails}>{edu.details}</Text>}
            </View>
          ))}
        </View>
      )}

      {cv.certifications.length > 0 && (
        <View>
          <Text style={styles.sectionHeader}>Certifications</Text>
          {cv.certifications.map((cert, i) => (
            <View key={i} style={styles.bulletItem}>
              <Text style={styles.bulletDot}>•</Text>
              <Text style={styles.bulletText}>{cert}</Text>
            </View>
          ))}
        </View>
      )}
    </Page>
  );
}
