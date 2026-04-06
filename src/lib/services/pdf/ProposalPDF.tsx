import { renderToBuffer } from "@react-pdf/renderer";
import { Document, Page, Text, View, StyleSheet, Font } from "@react-pdf/renderer";
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
  agencyId: any;
  state?: string;
}

interface IQuoteData {
  _id: string;
  carrierQuoteUSD: number;
  wholesaleFeePercent: number;
  wholesaleFeeAmountUSD: number;
  brokerFeeAmountUSD: number;
  finalAmountUSD: number;
  carrierId: any;
}

interface IAgencyData {
  name: string;
  email?: string;
  phone?: string;
}

interface ICarrierData {
  name: string;
  email?: string;
}

// Define styles
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
  date: {
    fontSize: 10,
    textAlign: "right",
    marginBottom: 20,
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
  tableRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
    paddingVertical: 5,
  },
  tableLabel: {
    fontSize: 10,
  },
  tableValue: {
    fontSize: 10,
    fontWeight: "bold",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
    paddingTop: 10,
    borderTop: "1pt solid #000",
  },
  signatureLine: {
    marginTop: 30,
    paddingTop: 20,
    borderTop: "1pt solid #000",
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 50,
    right: 50,
    textAlign: "center",
    fontSize: 8,
    color: "#666",
  },
});

// PDF Component
const ProposalDocument = ({
  submission,
  quote,
  agency,
  carrier,
}: {
  submission: ISubmissionData;
  quote: IQuoteData;
  agency: IAgencyData;
  carrier: ICarrierData;
}) => (
  <Document>
    <Page size="LETTER" style={styles.page}>
      <Text style={styles.title}>Insurance Proposal</Text>
      <Text style={styles.date}>Date: {new Date().toLocaleDateString()}</Text>

      <Text style={styles.sectionTitle}>Insured Information</Text>
      <Text style={styles.text}>Name: {submission.clientContact.name}</Text>
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

      <Text style={styles.sectionTitle}>Agency Information</Text>
      <Text style={styles.text}>Agency Name: {agency.name}</Text>
      {agency.email && <Text style={styles.text}>Email: {agency.email}</Text>}
      {agency.phone && <Text style={styles.text}>Phone: {agency.phone}</Text>}

      <Text style={styles.sectionTitle}>Carrier Information</Text>
      <Text style={styles.text}>Carrier: {carrier.name}</Text>
      {carrier.email && <Text style={styles.text}>Email: {carrier.email}</Text>}

      <Text style={styles.sectionTitle}>Premium Breakdown</Text>
      <View style={styles.tableRow}>
        <Text style={styles.tableLabel}>Carrier Quote:</Text>
        <Text style={styles.tableValue}>
          ${quote.carrierQuoteUSD.toFixed(2)}
        </Text>
      </View>
      <View style={styles.tableRow}>
        <Text style={styles.tableLabel}>Wholesale Fee:</Text>
        <Text style={styles.tableValue}>
          ${quote.wholesaleFeeAmountUSD.toFixed(2)} ({quote.wholesaleFeePercent}%)
        </Text>
      </View>
      <View style={styles.tableRow}>
        <Text style={styles.tableLabel}>Broker Fee:</Text>
        <Text style={styles.tableValue}>
          ${quote.brokerFeeAmountUSD.toFixed(2)}
        </Text>
      </View>
      <View style={styles.totalRow}>
        <Text style={[styles.tableLabel, { fontWeight: "bold" }]}>
          Total Cost:
        </Text>
        <Text style={[styles.tableValue, { fontSize: 12 }]}>
          ${quote.finalAmountUSD.toFixed(2)}
        </Text>
      </View>

      <Text style={styles.sectionTitle}>Finance Options Available</Text>
      <Text style={styles.text}>
        Financing options are available for this proposal. Please contact your
        agency for details.
      </Text>

      <View style={styles.signatureLine}>
        <Text style={styles.sectionTitle}>Signature</Text>
        <Text style={styles.text}>
          By signing below, I acknowledge that I have reviewed this proposal:
        </Text>
        <View style={{ marginTop: 20, marginBottom: 10 }}>
          <View
            style={{
              borderBottom: "1pt solid #000",
              width: 250,
              marginBottom: 5,
            }}
          />
          <Text style={styles.text}>Insured Signature</Text>
        </View>
        <Text style={styles.text}>Date: ___________</Text>
      </View>

      <Text style={styles.footer}>
        This is a proposal document. Coverage is subject to carrier approval and
        binding.
      </Text>
    </Page>
  </Document>
);

export class ProposalPDF {
  /**
   * Generate Proposal PDF document using @react-pdf/renderer
   */
  static async generate(
    submission: ISubmissionData,
    quote: IQuoteData,
    agency: IAgencyData,
    carrier: ICarrierData
  ): Promise<{ url: string; buffer: Buffer }> {
    try {
      const pdfBuffer = await renderToBuffer(
        <ProposalDocument
          submission={submission}
          quote={quote}
          agency={agency}
          carrier={carrier}
        />
      );

      const url = await savePDFToStorage(
        pdfBuffer,
        `proposal_${submission._id}.pdf`
      );

      return { url, buffer: pdfBuffer };
    } catch (error: any) {
      console.error("PDF generation error:", error);
      throw new Error(`Failed to generate proposal PDF: ${error.message}`);
    }
  }
}
