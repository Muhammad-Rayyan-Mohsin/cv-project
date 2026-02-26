import { StyleSheet } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: {
    paddingTop: 36,
    paddingBottom: 36,
    paddingHorizontal: 42,
    fontFamily: "Helvetica",
    fontSize: 10.5,
    lineHeight: 1.35,
    color: "#1a1a1a",
  },
  // Header
  headerBlock: {
    alignItems: "center",
    marginBottom: 2,
  },
  name: {
    fontSize: 20,
    fontFamily: "Helvetica-Bold",
    color: "#000000",
    marginBottom: 6,
    textAlign: "center",
  },
  contactRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    alignItems: "center",
    fontSize: 8.5,
    color: "#4b5563",
    marginBottom: 4,
  },
  contactItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  contactSep: {
    color: "#d1d5db",
    marginHorizontal: 4,
  },
  contactLink: {
    color: "#666666",
  },
  // Section
  sectionHeader: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase" as const,
    letterSpacing: 0.8,
    color: "#000000",
    borderBottomWidth: 0.5,
    borderBottomColor: "#e5e7eb",
    paddingBottom: 2,
    marginBottom: 6,
    marginTop: 12,
  },
  // Skills
  skillRow: {
    flexDirection: "row",
    marginBottom: 1.5,
  },
  skillCategory: {
    fontFamily: "Helvetica-Bold",
    fontSize: 10.5,
  },
  skillItems: {
    fontSize: 10.5,
    color: "#374151",
  },
  // Experience
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
  },
  expOrg: {
    fontFamily: "Helvetica",
    color: "#6b7280",
    fontSize: 10.5,
  },
  expDate: {
    fontSize: 8.5,
    color: "#6b7280",
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
    marginTop: 1,
  },
  // Education
  eduEntry: {
    marginBottom: 3,
  },
  eduTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  eduDegree: {
    fontFamily: "Helvetica-Bold",
    fontSize: 10.5,
  },
  eduInstitution: {
    fontFamily: "Helvetica",
    color: "#6b7280",
    fontSize: 10.5,
  },
  eduDetails: {
    fontSize: 9,
    color: "#6b7280",
    marginTop: 1,
  },
  // Body text
  bodyText: {
    fontSize: 10.5,
    color: "#374151",
    lineHeight: 1.4,
  },
  // Divider
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: "#d1d5db",
    marginTop: 4,
    marginBottom: 4,
  },
});

export default styles;
