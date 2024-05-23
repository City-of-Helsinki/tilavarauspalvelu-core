import React from "react";
import { breakpoints } from "common/src/common/style";
import { H2 } from "common/src/common/typography";
import { useReservationQuery } from "@gql/gql-types";
import { LoadingSpinner } from "hds-react";
import type { GetServerSidePropsContext } from "next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { useTranslation } from "next-i18next";
import styled from "styled-components";
import { Container } from "common";
import ReservationConfirmation from "@/components/reservation/ReservationConfirmation";
import { ReservationInfoCard } from "@/components/reservation/ReservationInfoCard";
import { Paragraph } from "@/components/reservation/styles";
import { useOrder } from "@/hooks/reservation";
import { getCommonServerSideProps } from "@/modules/serverUtils";
import { base64encode } from "common/src/helpers";

type Props = Awaited<ReturnType<typeof getServerSideProps>>["props"];

export const getServerSideProps = async (ctx: GetServerSidePropsContext) => {
  const { locale, params } = ctx;
  const reservationPk = Number(params?.id);

  return {
    props: {
      ...getCommonServerSideProps(),
      key: `${reservationPk}${locale}`,
      reservationPk: Number.isNaN(reservationPk) ? null : reservationPk,
      ...(await serverSideTranslations(locale ?? "fi")),
    },
  };
};

const Heading = styled(H2).attrs({ as: "h1" })``;

const StyledContainer = styled(Container)`
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

const ReservationSuccess = ({ reservationPk, apiBaseUrl }: Props) => {
  const { t } = useTranslation();

  const id = base64encode(`ReservationNode:${reservationPk}`);
  const {
    data,
    loading: isReservationLoading,
    error: isError,
  } = useReservationQuery({
    skip: !reservationPk,
    fetchPolicy: "no-cache",
    variables: { id },
  });
  const { reservation } = data ?? {};

  const {
    order,
    isError: orderError,
    isLoading: orderLoading,
  } = useOrder({ orderUuid: reservation?.order?.orderUuid ?? "" });

  const isOrderUuidMissing = reservation && !reservation.order?.orderUuid;

  // TODO display error if the orderUuid is missing or the pk is invalid
  if (isError || orderError || isOrderUuidMissing) {
    return (
      <StyledContainer size="s">
        <Columns>
          <div>
            <Heading>{t("common:error.error")}</Heading>
            <Paragraph>{t("common:error.dataError")}</Paragraph>
          </div>
        </Columns>
      </StyledContainer>
    );
  }

  if (isReservationLoading || orderLoading || !reservation) {
    return (
      <StyledContainer size="s">
        <Columns style={{ justifyItems: "center" }}>
          <LoadingSpinner />
        </Columns>
      </StyledContainer>
    );
  }

  return (
    <StyledContainer size="s">
      <Columns>
        <div>
          <ReservationInfoCard reservation={reservation} type="confirmed" />
        </div>
        <ReservationConfirmation
          apiBaseUrl={apiBaseUrl}
          reservation={reservation}
          order={order}
        />
      </Columns>
    </StyledContainer>
  );
};

export default ReservationSuccess;
