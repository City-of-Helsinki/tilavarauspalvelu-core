import { H2 } from "common/src/common/typography";
import { IconArrowRight } from "hds-react";
import React from "react";
import styled from "styled-components";
import { UnitType } from "../../common/gql-types";
import { myUnitUrl } from "../../common/urls";
import { BasicLink } from "../../styles/util";

type Props = {
  unit: UnitType;
};

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5em;
  padding: 1em 0.5em;
  color: black;
  text-decoration: none !important;
`;

const MyUnitCard = ({ unit }: Props): JSX.Element => {
  return (
    <BasicLink to={myUnitUrl(unit.pk as number)}>
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
    </BasicLink>
  );
};

export default MyUnitCard;
