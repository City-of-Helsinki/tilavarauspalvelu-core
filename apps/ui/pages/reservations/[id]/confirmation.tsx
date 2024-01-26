import React from "react";
import { useQuery } from "@apollo/client";
import type { Query, QueryReservationByPkArgs } from "common/types/gql-types";
import { useRouter } from "next/router";
import styled from "styled-components";
import { breakpoints, Container } from "common";
import ClientOnly from "common/src/ClientOnly";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import type { GetServerSidePropsContext } from "next";
import ReservationInfoCard from "@/components/reservation/ReservationInfoCard";
import ReservationConfirmation from "@/components/reservation/ReservationConfirmation";
import { GET_RESERVATION } from "@/modules/queries/reservation";
import { getCommonServerSideProps } from "@/modules/serverUtils";

// TODO styles are copies from [...params].tsx
const StyledContainer = styled(Container)`
  padding-top: var(--spacing-m);

  @media (min-width: ${breakpoints.m}) {
    margin-bottom: var(--spacing-layout-l);
  }
`;

const Columns = styled.div`
  grid-template-columns: 1fr;
  display: grid;
  align-items: flex-start;
  gap: var(--spacing-m);

  @media (min-width: ${breakpoints.m}) {
    & > div:nth-of-type(1) {
      order: 2;
    }

    margin-top: var(--spacing-xl);
    grid-template-columns: 1fr 378px;
  }
`;

function Confirmation({ apiBaseUrl }: Props) {
  const router = useRouter();
  const { id } = router.query;
  const { data, loading } = useQuery<Query, QueryReservationByPkArgs>(
    GET_RESERVATION,
    {
      variables: { pk: Number(id) },
      skip: !id || Number.isNaN(Number(id)),
      onError: () => {},
    }
  );

  if (loading || !data?.reservationByPk?.pk) return null;

  const { reservationByPk } = data;
  const reservation = reservationByPk;
  const reservationUnit = reservation.reservationUnits?.[0] ?? undefined;

  if (reservationUnit == null) {
    return null;
  }

  return (
    <StyledContainer>
      <Columns>
        <ReservationInfoCard
          reservation={reservation}
          reservationUnit={reservationUnit}
          type="confirmed"
        />
        <ReservationConfirmation
          apiBaseUrl={apiBaseUrl}
          reservation={reservation}
          reservationUnit={reservationUnit}
        />
      </Columns>
    </StyledContainer>
  );
}

type Props = Awaited<ReturnType<typeof getServerSideProps>>["props"];

export const getServerSideProps = async (ctx: GetServerSidePropsContext) => {
  const { locale } = ctx;

  return {
    props: {
      ...getCommonServerSideProps(),
      ...(await serverSideTranslations(locale ?? "fi")),
    },
  };
};

export default (props: Props) => (
  <ClientOnly>
    <Confirmation {...props} />
  </ClientOnly>
);
