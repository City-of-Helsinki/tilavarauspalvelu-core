import React from "react";
import {
  ReservationDocument,
  type ReservationQuery,
  type ReservationQueryVariables,
  useReservationQuery,
} from "@gql/gql-types";
import { useRouter } from "next/router";
import styled from "styled-components";
import { breakpoints, Container } from "common";
import ClientOnly from "common/src/ClientOnly";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import type { GetServerSidePropsContext } from "next";
import { ReservationInfoCard } from "@/components/reservation/ReservationInfoCard";
import ReservationConfirmation from "@/components/reservation/ReservationConfirmation";
import { getCommonServerSideProps } from "@/modules/serverUtils";
import { base64encode } from "common/src/helpers";
import { CenterSpinner } from "@/components/common/common";
import Error from "next/error";
import { createApolloClient } from "@/modules/apolloClient";

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
  const { id: pk } = router.query;

  // TODO check that the pk parameter is valid in getServerSideProps and return 404 if it's not
  // TODO this could be moved to getServerSideProps
  // TODO why is there no user check here? are regular users allowed to access a reservation of another user?
  const typename = "ReservationNode";
  const id = base64encode(`${typename}:${pk}`);
  const {
    data,
    loading: isLoading,
    error,
  } = useReservationQuery({
    variables: { id },
    skip: !pk || Number.isNaN(Number(pk)),
    onError: () => {},
  });

  const { reservation } = data ?? {};

  if (isLoading) {
    return <CenterSpinner />;
  }

  if (error) {
    // eslint-disable-next-line no-console
    console.error(error);
    return <Error statusCode={500} />;
  }

  // TODO show an error page instead of returning null
  if (reservation == null) {
    return <Error statusCode={404} />;
  }

  return (
    <StyledContainer>
      <Columns>
        <ReservationInfoCard reservation={reservation} type="confirmed" />
        <ReservationConfirmation
          apiBaseUrl={apiBaseUrl}
          reservation={reservation}
        />
      </Columns>
    </StyledContainer>
  );
}

type Props = Awaited<ReturnType<typeof getServerSideProps>>["props"];

export const getServerSideProps = async (ctx: GetServerSidePropsContext) => {
  const { locale, params } = ctx;
  const pk = params?.id;

  const commonProps = getCommonServerSideProps();
  const client = createApolloClient(commonProps.apiBaseUrl, ctx);

  if (Number.isFinite(Number(pk))) {
    const typename = "ReservationNode";
    const id = base64encode(`${typename}:${pk}`);

    const { data: reservationData } = await client.query<
      ReservationQuery,
      ReservationQueryVariables
    >({
      query: ReservationDocument,
      fetchPolicy: "no-cache",
      variables: { id },
    });
    const { reservation } = reservationData || {};

    if (reservation) {
      return {
        props: {
          ...getCommonServerSideProps(),
          ...(await serverSideTranslations(locale ?? "fi")),
        },
      };
    }
  }
  return {
    props: {
      notFound: true,
      ...commonProps,
      ...(await serverSideTranslations(locale ?? "fi")),
      key: `${pk}-confirmation-${locale}`,
    },
  };
};

export default (props: Props) => (
  <ClientOnly>
    <Confirmation {...props} />
  </ClientOnly>
);
