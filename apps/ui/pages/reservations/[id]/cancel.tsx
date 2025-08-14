import { Breadcrumb } from "@/components/common/Breadcrumb";
import { ReservationCancellation } from "@/components/reservation/ReservationCancellation";
import { createApolloClient } from "@/modules/apolloClient";
import { isReservationCancellable } from "@/modules/reservation";
import { getCommonServerSideProps } from "@/modules/serverUtils";
import { getApplicationPath, getReservationPath, reservationsPrefix } from "@/modules/urls";
import { gql } from "@apollo/client";
import {
  ReservationCancelPageDocument,
  type ReservationCancelPageQuery,
  type ReservationCancelPageQueryVariables,
} from "@gql/gql-types";
import { base64encode } from "common/src/helpers";
import { type TFunction } from "i18next";
import type { GetServerSidePropsContext } from "next";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import React from "react";

type PropsNarrowed = Exclude<Props, { notFound: boolean }>;

function getBreadcrumbs(t: TFunction, reservation: PropsNarrowed["reservation"]) {
  const applicationPk =
    reservation?.reservationSeries?.allocatedTimeSlot?.reservationUnitOption?.applicationSection?.application?.pk;
  if (applicationPk) {
    return [
      {
        slug: "/applications",
        title: t("breadcrumb:applications"),
      },
      {
        slug: getApplicationPath(applicationPk, "view"),
        title: t("breadcrumb:application", { id: applicationPk }),
      },
      {
        title: t("reservations:cancel.reservation"),
      },
    ];
  }
  return [
    {
      slug: reservationsPrefix,
      title: t("breadcrumb:reservations"),
    },
    {
      slug: getReservationPath(reservation.pk),
      title: t("reservations:reservationName", { id: reservation.pk }),
    },
    {
      title: t("reservations:cancel.reservation"),
    },
  ] as const;
}

function ReservationCancelPage(props: PropsNarrowed): JSX.Element {
  const { t } = useTranslation();
  const { reservation } = props;
  const routes = getBreadcrumbs(t, reservation);
  return (
    <>
      <Breadcrumb routes={routes} />
      <ReservationCancellation {...props} reservation={reservation} />
    </>
  );
}

type Props = Awaited<ReturnType<typeof getServerSideProps>>["props"];

export async function getServerSideProps(ctx: GetServerSidePropsContext) {
  const { locale, params } = ctx;
  const pk = params?.id;

  const commonProps = getCommonServerSideProps();
  const client = createApolloClient(commonProps.apiBaseUrl, ctx);

  if (Number.isFinite(Number(pk))) {
    const id = base64encode(`ReservationNode:${pk}`);
    const { data } = await client.query<ReservationCancelPageQuery, ReservationCancelPageQueryVariables>({
      query: ReservationCancelPageDocument,
      fetchPolicy: "no-cache",
      variables: { id },
    });
    const { reservation } = data || {};

    const canCancel = reservation != null && isReservationCancellable(reservation);
    if (canCancel) {
      return {
        props: {
          ...commonProps,
          ...(await serverSideTranslations(locale ?? "fi")),
          reservation: reservation ?? null,
        },
      };
    } else if (reservation != null) {
      return {
        redirect: {
          permanent: false,
          destination: getReservationPath(reservation.pk),
        },
        props: {
          notFound: true, // for prop narrowing
        },
      };
    }
  }

  return {
    notFound: true,
    props: {
      notFound: true,
      ...commonProps,
      ...(await serverSideTranslations(locale ?? "fi")),
    },
  };
}

export const RESERVATION_CANCEL_PAGE_QUERY = gql`
  query ReservationCancelPage($id: ID!) {
    reservation(id: $id) {
      id
      ...ReservationInfoCard
      name
      reservationUnit {
        id
        ...CancellationRuleFields
        cancellationTerms {
          ...TermsOfUseTextFields
        }
      }
      reservationSeries {
        id
        name
        allocatedTimeSlot {
          id
          pk
          reservationUnitOption {
            id
            applicationSection {
              id
              application {
                id
                pk
                applicationRound {
                  id
                  termsOfUse {
                    ...TermsOfUseTextFields
                  }
                }
              }
            }
          }
        }
      }
    }
  }
`;

export default ReservationCancelPage;
