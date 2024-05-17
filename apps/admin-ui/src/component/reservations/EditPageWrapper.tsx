import React from "react";
import { useTranslation } from "react-i18next";
import { type ReservationQuery } from "@gql/gql-types";
import styled from "styled-components";
import LinkPrev from "../LinkPrev";
import { Container } from "../../styles/layout";
import ReservationTitleSection from "./requested/ReservationTitleSection";
import { createTagString } from "./requested/util";

const PreviousLinkWrapper = styled.div`
  padding: var(--spacing-s);
`;

type ReservationType = NonNullable<ReservationQuery["reservation"]>;
const EditPageWrapper = ({
  children,
  reservation,
  title,
}: {
  children: React.ReactNode;
  title: string;
  reservation?: ReservationType;
}) => {
  const { t } = useTranslation();
  const tagline = reservation ? createTagString(reservation, t) : "";

  return (
    <>
      <PreviousLinkWrapper>
        <LinkPrev />
      </PreviousLinkWrapper>
      <Container>
        {reservation && (
          <ReservationTitleSection
            reservation={reservation}
            tagline={tagline}
            overrideTitle={title}
          />
        )}
        {children}
      </Container>
    </>
  );
};

export default EditPageWrapper;
