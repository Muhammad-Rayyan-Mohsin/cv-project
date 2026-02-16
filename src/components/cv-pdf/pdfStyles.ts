import { StyleSheet } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: {
    paddingTop: 36,
    paddingBottom: 36,
    paddingHorizontal: 42,
    fontFamily: "Helvetica",
    fontSize: 9.5,
    lineHeight: 1.35,
    color: "#1a1a1a",
  },
  // Header
  headerBlock: {
    alignItems: "center",
    marginBottom: 2,
  },
  name: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    color: "#000000",
    marginBottom: 3,
    textAlign: "center",
  },
  contactRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    alignItems: "center",
    fontSize: 8,
    color: "#666666",
    marginBottom: 4,
  },
  contactItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  contactSep: {
    color: "#cccccc",
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
    borderBottomColor: "#dddddd",
    paddingBottom: 2,
    marginBottom: 4,
    marginTop: 8,
  },
  // Skills
  skillRow: {
    flexDirection: "row",
    marginBottom: 1.5,
  },
  skillCategory: {
    fontFamily: "Helvetica-Bold",
    fontSize: 9.5,
  },
  skillItems: {
    fontSize: 9.5,
    color: "#444444",
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
    fontSize: 9.5,
  },
  expOrg: {
    fontFamily: "Helvetica",
    color: "#666666",
    fontSize: 9.5,
  },
  expDate: {
    fontSize: 8,
    color: "#888888",
  },
  bulletItem: {
    flexDirection: "row",
    marginLeft: 10,
    marginTop: 1.5,
  },
  bulletDot: {
    width: 10,
    fontSize: 9.5,
    color: "#888888",
  },
  bulletText: {
    flex: 1,
    fontSize: 9,
    color: "#333333",
  },
  techLine: {
    fontSize: 7.5,
    color: "#999999",
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
    fontSize: 9.5,
  },
  eduInstitution: {
    fontFamily: "Helvetica",
    color: "#666666",
    fontSize: 9.5,
  },
  eduDetails: {
    fontSize: 8.5,
    color: "#888888",
    marginTop: 1,
  },
  // Body text
  bodyText: {
    fontSize: 9.5,
    color: "#444444",
    lineHeight: 1.4,
  },
  // Divider
  divider: {
    borderBottomWidth: 0.5,
    borderBottomColor: "#cccccc",
    marginTop: 4,
    marginBottom: 4,
  },
});

export default styles;
