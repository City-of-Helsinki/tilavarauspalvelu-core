import React from "react";
import { StyleSheet, Text, View } from "@react-pdf/renderer";
import Logo from "./Logo";
import { B, FAMILY_BOLD } from "./Typography";

const styles = StyleSheet.create({
  pageHeader: {
    display: "flex",
    flexDirection: "row",
    marginHorizontal: 40,
    marginVertical: 40,
  },
  pageNumber: { fontFamily: FAMILY_BOLD, marginLeft: "auto" },
  cell: { width: 200 },
  wideCell: { width: 300 },
});

const PageHeader = (): JSX.Element => (
  <View style={styles.pageHeader} fixed>
    <View style={styles.cell}>
      <Logo />
    </View>
    <View style={styles.wideCell}>
      <B>Helsingin kaupunki</B>
      <Text>Kulttuurin ja vapaa-ajan toimiala</Text>
    </View>
    <View style={styles.cell}>
      <Text
        style={styles.pageNumber}
        render={({ pageNumber, totalPages }) =>
          ` ${pageNumber} / ${totalPages}`
        }
      />
    </View>
  </View>
);

export default PageHeader;
