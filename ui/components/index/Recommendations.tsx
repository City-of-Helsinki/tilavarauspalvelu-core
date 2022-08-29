import React from "react";
import { useTranslation } from "next-i18next";
import styled from "styled-components";
import Container from "../common/Container";
import RelatedUnits from "../reservation-unit/RelatedUnits";
import { ReservationUnitType } from "../../modules/gql-types";

type Props = {
  recommendations: ReservationUnitType[];
};

const Wrapper = styled.div`
  padding: var(--spacing-m) 0 var(--spacing-xl);
`;

const Heading = styled.div`
  margin: var(--spacing-s) 0 var(--spacing-l);
  font-size: var(--fontsize-heading-m);
  font-family: var(--font-bold);
`;

const Recommendations = ({ recommendations }: Props): JSX.Element => {
  const { t } = useTranslation("home");

  return (
    <Wrapper>
      <Container>
        <Heading>{t("recommendations")}</Heading>
        <RelatedUnits units={recommendations} />
      </Container>
    </Wrapper>
  );
};

export default Recommendations;
