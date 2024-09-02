import React from "react";
import { useTranslation } from "next-i18next";
import { type ReservationQuery } from "@gql/gql-types";
import { LinkPrev } from "@/component/LinkPrev";
import { Container } from "@/styles/layout";
import ReservationTitleSection from "./ReservationTitleSection";
import { createTagString } from "./util";

type ReservationType = NonNullable<ReservationQuery["reservation"]>;

export function EditPageWrapper({
  children,
  reservation,
  title,
}: {
  children: React.ReactNode;
  title: string;
  reservation?: ReservationType;
}) {
  const { t } = useTranslation();
  const tagline = reservation ? createTagString(reservation, t) : "";

  return (
    <>
      <LinkPrev />
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
}
