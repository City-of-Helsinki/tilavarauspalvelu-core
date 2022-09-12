import React from "react";
import { Document, Page, StyleSheet, Font, View } from "@react-pdf/renderer";
import { Application } from "common/types/common";
import { FAMILY_BOLD, FAMILY_REGULAR, SIZE } from "./Typography";
import PageHeader from "./PageHeader";
import PageFooter from "./PageFooter";

const styles = StyleSheet.create({
  page: {
    fontFamily: FAMILY_REGULAR,
    fontSize: SIZE,
    lineHeight: 1.6,
    paddingBottom: 100,
  },

  section: {
    paddingHorizontal: 75,
  },
});

export const getPDFTitle = (
  application: Application,
  hasReservations: boolean
): string =>
  `${application.contactPerson?.firstName} ${
    application.contactPerson?.lastName
  } - Paatos - ${
    hasReservations ? "Myönnetyt vuorot" : "Ei myönnettyjä vuoroja"
  }`;

// disable hyphenation
Font.registerHyphenationCallback((word) => [word]);

Font.register({
  family: FAMILY_BOLD,
  src: "/Roboto-Bold.ttf",
});

Font.register({
  family: FAMILY_REGULAR,
  src: "/Roboto-Regular.ttf",
});

type Props = {
  application: Application;
  hasReservations: boolean;
  children?: React.ReactNode;
};

export const PDFDocument = ({
  children,
  application,
  hasReservations,
}: Props): JSX.Element => (
  <Document
    title={getPDFTitle(application, hasReservations)}
    author="Helsingin kaupunki"
    language="fi"
  >
    {children}
  </Document>
);

export const PDFPage = ({
  children,
}: {
  children: React.ReactNode;
}): JSX.Element => (
  <Page wrap size="A4" style={styles.page}>
    <PageHeader />
    <View style={styles.section} wrap>
      {children}
    </View>
    <PageFooter />
  </Page>
);
