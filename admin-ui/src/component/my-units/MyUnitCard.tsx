import { IconArrowRight } from "hds-react";
import React from "react";
import styled from "styled-components";
import { UnitType } from "../../common/gql-types";
import { H2 } from "../../styles/new-typography";

type Props = {
  unit: UnitType;
};

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5em;
  padding: 1em 0.5em;
`;

const MyUnitCard = ({ unit }: Props): JSX.Element => {
  return (
    <Wrapper>
      <H2
        style={{
          lineHeight: "1.555555",
          margin: 0,
          fontSize: "var(--fontsize-heading-xs)",
        }}
      >
        {unit.nameFi}
      </H2>
      <IconArrowRight />
    </Wrapper>
  );
};

export default MyUnitCard;
