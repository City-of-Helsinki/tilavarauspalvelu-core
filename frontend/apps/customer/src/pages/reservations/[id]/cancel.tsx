import React from "react";
import { gql } from "@apollo/client";
import { type TFunction } from "i18next";
import { type GetServerSidePropsContext } from "next";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { createNodeId, ignoreMaybeArray, toNumber } from "ui/src/modules/helpers";
import { Breadcrumb } from "@/components/Breadcrumb";
import { ReservationCancellation } from "@/lib/reservation/[id]/cancel";
import { createApolloClient } from "@/modules/apolloClient";
import { isReservationCancellable } from "@/modules/reservation";
import { getCommonServerSideProps } from "@/modules/serverUtils";
import { getApplicationPath, getReservationPath, reservationsPrefix } from "@/modules/urls";
import {
  ReservationCancelPageDocument,
  type ReservationCancelPageQuery,
  type ReservationCancelPageQueryVariables,
} from "@gql/gql-types";

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
        title: t("reservation:cancel.reservation"),
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
      title: t("reservation:reservationName", { id: reservation.pk }),
    },
    {
      title: t("reservation:cancel.reservation"),
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

  const { apiBaseUrl } = getCommonServerSideProps();
  const client = createApolloClient(apiBaseUrl, ctx);

  const pk = toNumber(ignoreMaybeArray(params?.id));
  if (Number.isFinite(Number(pk))) {
    const { data } = await client.query<ReservationCancelPageQuery, ReservationCancelPageQueryVariables>({
      query: ReservationCancelPageDocument,
      fetchPolicy: "no-cache",
      variables: { id: createNodeId("ReservationNode", pk ?? 0) },
    });
    const { reservation } = data || {};

    const canCancel = reservation != null && isReservationCancellable(reservation);
    if (canCancel) {
      return {
        props: {
          reservation: reservation,
          ...(await serverSideTranslations(locale ?? "fi")),
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
