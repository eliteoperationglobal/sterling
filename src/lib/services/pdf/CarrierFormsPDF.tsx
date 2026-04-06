import { renderToBuffer } from "@react-pdf/renderer";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { savePDFToStorage } from "./storage";

interface ISubmissionData {
  _id: string;
  clientContact: {
    name: string;
    email: string;
    phone: string;
    EIN?: string;
    businessAddress: {
      street: string;
      city: string;
      state: string;
      zip: string;
    };
  };
  state?: string;
  payload: Record<string, any>;
}

interface ICarrierData {
  name: string;
}

const styles = StyleSheet.create({
  page: {
    padding: 50,
    fontSize: 10,
    fontFamily: "Helvetica",
  },
  title: {
    fontSize: 20,
    marginBottom: 20,
    textAlign: "center",
    fontWeight: "bold",
  },
  sectionTitle: {
    fontSize: 14,
    marginTop: 15,
    marginBottom: 10,
    fontWeight: "bold",
    textDecoration: "underline",
  },
  text: {
    fontSize: 10,
    marginBottom: 5,
  },
  signatureLine: {
    marginTop: 30,
    paddingTop: 20,
    borderTop: "1pt solid #000",
  },
});

const CarrierFormsDocument = ({
  submission,
  carrier,
}: {
  submission: ISubmissionData;
  carrier: ICarrierData;
}) => (
  <Document>
    <Page size="LETTER" style={styles.page}>
      <Text style={styles.title}>Carrier Required Forms</Text>

      <Text style={styles.sectionTitle}>Application Information</Text>
      <Text style={styles.text}>Client Name: {submission.clientContact.name}</Text>
      <Text style={styles.text}>Email: {submission.clientContact.email}</Text>
      <Text style={styles.text}>Phone: {submission.clientContact.phone}</Text>
      {submission.clientContact.EIN && (
        <Text style={styles.text}>EIN: {submission.clientContact.EIN}</Text>
      )}
      <Text style={styles.text}>
        Address: {submission.clientContact.businessAddress.street},{" "}
        {submission.clientContact.businessAddress.city},{" "}
        {submission.clientContact.businessAddress.state}{" "}
        {submission.clientContact.businessAddress.zip}
      </Text>

      <Text style={styles.sectionTitle}>Carrier Information</Text>
      <Text style={styles.text}>Carrier: {carrier.name}</Text>

      <Text style={styles.sectionTitle}>Required Forms Checklist</Text>
      <Text style={styles.text}>☐ Application Form</Text>
      <Text style={styles.text}>☐ Risk Assessment Form</Text>
      <Text style={styles.text}>☐ Underwriting Questionnaire</Text>
      <Text style={styles.text}>☐ Additional Documentation</Text>

      <View style={styles.signatureLine}>
        <Text style={styles.sectionTitle}>Signature</Text>
        <Text style={styles.text}>
          By signing below, I acknowledge that I have provided accurate information:
        </Text>
        <View style={{ marginTop: 20, marginBottom: 10 }}>
          <View
            style={{
              borderBottom: "1pt solid #000",
              width: 250,
              marginBottom: 5,
            }}
          />
          <Text style={styles.text}>Applicant Signature</Text>
        </View>
        <Text style={styles.text}>Date: ___________</Text>
      </View>
    </Page>
  </Document>
);

export class CarrierFormsPDF {
  static async generate(
    submission: ISubmissionData,
    carrier: ICarrierData
  ): Promise<{ url: string; buffer: Buffer }> {
    try {
      const pdfBuffer = await renderToBuffer(
        <CarrierFormsDocument submission={submission} carrier={carrier} />
      );

      const url = await savePDFToStorage(
        pdfBuffer,
        `carrier_forms_${submission._id}.pdf`
      );

      return { url, buffer: pdfBuffer };
    } catch (error: any) {
      console.error("PDF generation error:", error);
      throw new Error(`Failed to generate carrier forms PDF: ${error.message}`);
    }
  }
}
