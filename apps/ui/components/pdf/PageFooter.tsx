import { StyleSheet, Text, View } from "@react-pdf/renderer";
import React from "react";
import { B, SIZE_SMALL } from "./Typography";

const styles = StyleSheet.create({
  footer: {
    position: "absolute",
    bottom: 0,
    display: "flex",
    flexDirection: "row",
    paddingHorizontal: 40,
    paddingVertical: 40,
    fontSize: SIZE_SMALL,
  },
});

const PageFooter = (): JSX.Element => (
  <View fixed style={styles.footer}>
    <View style={{ width: 257.5 }}>
      <B>Postiosoite: PL 50000, 00099 Helsingin kaupunki</B>
      <Text>(09) 310 8900 (vaihde)</Text>
    </View>
    <View style={{ textAlign: "right", width: 257.5 }}>
      <Text>www.hel.fi</Text>
      <Text>y-tunnus: 0201256-6</Text>
    </View>
  </View>
);

export default PageFooter;
