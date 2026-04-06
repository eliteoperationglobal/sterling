import { renderToBuffer } from "@react-pdf/renderer";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { savePDFToStorage } from "./storage";

interface ISubmissionData {
  _id: string;
  clientContact: {
    name: string;
    email: string;
    phone: string;
    businessAddress: {
      street: string;
      city: string;
      state: string;
      zip: string;
    };
  };
}

interface IFinancePlanData {
  _id: string;
  downPaymentUSD: number;
  tenureMonths: number;
  annualInterestPercent: number;
  monthlyInstallmentUSD: number;
  totalPayableUSD: number;
  quoteId: any;
}

interface IQuoteData {
  finalAmountUSD: number;
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
  signatureLine: {
    marginTop: 30,
    paddingTop: 20,
    borderTop: "1pt solid #000",
  },
});

const FinanceAgreementDocument = ({
  submission,
  quote,
  financePlan,
}: {
  submission: ISubmissionData;
  quote: IQuoteData;
  financePlan: IFinancePlanData;
}) => (
  <Document>
    <Page size="LETTER" style={styles.page}>
      <Text style={styles.title}>Finance Agreement</Text>

      <Text style={styles.sectionTitle}>Borrower Information</Text>
      <Text style={styles.text}>Name: {submission.clientContact.name}</Text>
      <Text style={styles.text}>Email: {submission.clientContact.email}</Text>
      <Text style={styles.text}>Phone: {submission.clientContact.phone}</Text>

      <Text style={styles.sectionTitle}>Finance Terms</Text>
      <View style={styles.tableRow}>
        <Text style={styles.tableLabel}>Down Payment:</Text>
        <Text style={styles.tableValue}>
          ${financePlan.downPaymentUSD.toFixed(2)}
        </Text>
      </View>
      <View style={styles.tableRow}>
        <Text style={styles.tableLabel}>Monthly Installment:</Text>
        <Text style={styles.tableValue}>
          ${financePlan.monthlyInstallmentUSD.toFixed(2)}
        </Text>
      </View>
      <View style={styles.tableRow}>
        <Text style={styles.tableLabel}>Total Financed Amount:</Text>
        <Text style={styles.tableValue}>
          ${financePlan.totalPayableUSD.toFixed(2)}
        </Text>
      </View>
      <View style={styles.tableRow}>
        <Text style={styles.tableLabel}>APR (Annual Interest Rate):</Text>
        <Text style={styles.tableValue}>
          {financePlan.annualInterestPercent.toFixed(2)}%
        </Text>
      </View>
      <View style={styles.tableRow}>
        <Text style={styles.tableLabel}>Tenure:</Text>
        <Text style={styles.tableValue}>{financePlan.tenureMonths} months</Text>
      </View>

      <Text style={styles.sectionTitle}>Terms and Conditions</Text>
      <Text style={styles.text}>
        By signing this agreement, the borrower agrees to make monthly payments
        of ${financePlan.monthlyInstallmentUSD.toFixed(2)} for{" "}
        {financePlan.tenureMonths} months.
      </Text>
      <Text style={styles.text}>
        The total amount financed is ${financePlan.totalPayableUSD.toFixed(2)}
        at an annual interest rate of{" "}
        {financePlan.annualInterestPercent.toFixed(2)}%.
      </Text>

      <View style={styles.signatureLine}>
        <Text style={styles.sectionTitle}>Required Signatures</Text>
        <View style={{ marginTop: 20, marginBottom: 10 }}>
          <View
            style={{
              borderBottom: "1pt solid #000",
              width: 250,
              marginBottom: 5,
            }}
          />
          <Text style={styles.text}>Borrower Signature</Text>
        </View>
        <Text style={styles.text}>Date: ___________</Text>
      </View>
    </Page>
  </Document>
);

export class FinanceAgreementPDF {
  static async generate(
    submission: ISubmissionData,
    quote: IQuoteData,
    financePlan: IFinancePlanData
  ): Promise<{ url: string; buffer: Buffer }> {
    try {
      const pdfBuffer = await renderToBuffer(
        <FinanceAgreementDocument
          submission={submission}
          quote={quote}
          financePlan={financePlan}
        />
      );

      const url = await savePDFToStorage(
        pdfBuffer,
        `finance_agreement_${submission._id}.pdf`
      );

      return { url, buffer: pdfBuffer };
    } catch (error: any) {
      console.error("PDF generation error:", error);
      throw new Error(
        `Failed to generate finance agreement PDF: ${error.message}`
      );
    }
  }
}
