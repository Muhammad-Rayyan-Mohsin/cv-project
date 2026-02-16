import { Document, Page, View, Text, Link } from "@react-pdf/renderer";
import { StructuredCV } from "@/lib/cv-types";
import styles from "./pdfStyles";

export default function CVDocument({ cv }: { cv: StructuredCV }) {
  const pd = cv.personalDetails;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        {pd.fullName && (
          <View>
            <Text style={styles.name}>{pd.fullName}</Text>
            <View style={styles.contactRow}>
              {pd.email && <Text>{pd.email}</Text>}
              {pd.phone && (
                <>
                  <Text style={styles.contactSep}>|</Text>
                  <Text>{pd.phone}</Text>
                </>
              )}
              {pd.location && (
                <>
                  <Text style={styles.contactSep}>|</Text>
                  <Text>{pd.location}</Text>
                </>
              )}
              {pd.linkedIn && (
                <>
                  <Text style={styles.contactSep}>|</Text>
                  <Link src={pd.linkedIn.startsWith("http") ? pd.linkedIn : `https://${pd.linkedIn}`}>
                    <Text style={{ color: "#666666" }}>{pd.linkedIn}</Text>
                  </Link>
                </>
              )}
              {pd.github && (
                <>
                  <Text style={styles.contactSep}>|</Text>
                  <Link src={`https://github.com/${pd.github}`}>
                    <Text style={{ color: "#666666" }}>github.com/{pd.github}</Text>
                  </Link>
                </>
              )}
              {pd.website && (
                <>
                  <Text style={styles.contactSep}>|</Text>
                  <Link src={pd.website.startsWith("http") ? pd.website : `https://${pd.website}`}>
                    <Text style={{ color: "#666666" }}>{pd.website}</Text>
                  </Link>
                </>
              )}
            </View>
            <View style={styles.divider} />
          </View>
        )}

        {/* Summary */}
        {cv.summary && (
          <View>
            <Text style={styles.sectionHeader}>Summary</Text>
            <Text style={styles.bodyText}>{cv.summary}</Text>
          </View>
        )}

        {/* Skills */}
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

        {/* Experience */}
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
                      {exp.startDate}
                      {exp.endDate && ` – ${exp.endDate}`}
                    </Text>
                  )}
                </View>
                {exp.bullets
                  .filter((b) => b.trim())
                  .map((bullet, bi) => (
                    <View key={bi} style={styles.bulletItem}>
                      <Text style={styles.bulletDot}>•</Text>
                      <Text style={styles.bulletText}>{bullet}</Text>
                    </View>
                  ))}
                {exp.technologies.length > 0 && (
                  <Text style={styles.techLine}>
                    {exp.technologies.join(" · ")}
                  </Text>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Education */}
        {cv.education.length > 0 && (
          <View>
            <Text style={styles.sectionHeader}>Education</Text>
            {cv.education.map((edu) => (
              <View key={edu.id} style={styles.eduEntry}>
                <View style={styles.eduTitleRow}>
                  <View style={{ flexDirection: "row" }}>
                    <Text style={styles.eduDegree}>{edu.degree}</Text>
                    {edu.institution && (
                      <Text style={styles.eduInstitution}>
                        {" "}
                        — {edu.institution}
                      </Text>
                    )}
                  </View>
                  {(edu.startDate || edu.endDate) && (
                    <Text style={styles.expDate}>
                      {edu.startDate}
                      {edu.endDate && ` – ${edu.endDate}`}
                    </Text>
                  )}
                </View>
                {edu.details && (
                  <Text style={styles.eduDetails}>{edu.details}</Text>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Certifications */}
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
    </Document>
  );
}
