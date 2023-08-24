/* eslint-disable @typescript-eslint/naming-convention */
import React from "react";
import { Text } from "@react-pdf/renderer";

type Props = {
  children?: React.ReactNode;
};

export const SIZE_SMALL = 10;
export const SIZE = 12;
export const SIZE_MEDIUM = 15;
export const SIZE_LARGE = 18;

export const FAMILY_BOLD = "HelsinkiGrotesk-Bold";
export const FAMILY_REGULAR = "HelsinkiGrotesk-Regular";

const H1 = ({ children }: Props): JSX.Element => (
  <Text
    style={{
      marginBottom: SIZE_LARGE,
      fontFamily: FAMILY_BOLD,
      fontSize: SIZE_LARGE,
    }}
  >
    {children}
  </Text>
);

const H2 = ({ children }: Props): JSX.Element => (
  <Text
    style={{
      marginBottom: SIZE_MEDIUM,
      fontFamily: FAMILY_BOLD,
      fontSize: SIZE_LARGE,
    }}
  >
    {children}
  </Text>
);

const P = ({ children }: Props): JSX.Element => (
  <Text style={{ marginBottom: SIZE * 2 }}>{children}</Text>
);

const B = ({ children }: Props): JSX.Element => (
  <Text style={{ fontFamily: FAMILY_BOLD }}>{children}</Text>
);

export { H1, H2, B, P };
