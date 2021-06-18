import React from "react";
import { Text } from "@react-pdf/renderer";
import { B, P } from "./Typography";

type Props = {
  decisionMaker: string;
};
const DecisionMaker = ({ decisionMaker }: Props): JSX.Element => (
  <>
    <P />
    <P>
      <B>Ystävällisin terveisin,</B>
    </P>
    <Text>{decisionMaker}</Text>
    <Text>Kulttuurin ja vapaa-ajan toimiala, Nuorisopalvelut</Text>
  </>
);

export default DecisionMaker;
