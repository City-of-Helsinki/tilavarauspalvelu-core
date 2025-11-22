import React, { useState } from "react";
import { ApolloError, gql } from "@apollo/client";
import { IconCalendarEvent, IconClock, IconLocation, IconTrash } from "hds-react";
import type { GetServerSidePropsContext } from "next";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { useRouter } from "next/router";
import styled from "styled-components";
import { Card } from "ui/src/components";
import { ConfirmationDialog } from "ui/src/components/ConfirmationDialog";
import { useDisplayError } from "ui/src/hooks";
import { breakpoints } from "ui/src/modules/const";
import { parseApiDate, formatDateRange } from "ui/src/modules/date-utils";
import {
  createNodeId,
  filterNonNullable,
  formatApiTimeInterval,
  getLocalizationLang,
  getTranslation,
  ignoreMaybeArray,
  toNumber,
} from "ui/src/modules/helpers";
import { H1 } from "ui/src/styled";
import { Breadcrumb } from "@/components/Breadcrumb";
import { type CancelFormValues, CancellationForm } from "@/components/CancellationForm";
import { createApolloClient } from "@/modules/apolloClient";
import { isReservationCancellable } from "@/modules/reservation";
import { getCommonServerSideProps } from "@/modules/serverUtils";
import { getApplicationPath } from "@/modules/urls";
import { ReservationPageWrapper } from "@/styled/reservation";
import {
  ApplicationSectionCancelDocument,
  useCancelApplicationSectionMutation,
  type ApplicationSectionCancelQuery,
  type ApplicationSectionCancelQueryVariables,
} from "@gql/gql-types";

type PropsNarrowed = Exclude<Props, { notFound: boolean }>;

function ReservationCancelPage(props: PropsNarrowed): JSX.Element {
  const { t, i18n } = useTranslation();
  const { applicationSection } = props;
  const applicationPk = applicationSection?.application?.pk;
  const routes = [
    {
      slug: "/applications",
      title: t("breadcrumb:applications"),
    },
    {
      slug: getApplicationPath(applicationPk, "view"),
      title: t("breadcrumb:application", { id: applicationPk }),
    },
    {
      // NOTE Don't set slug. It hides the mobile breadcrumb
      slug: "",
      title: t("reservation:cancel.reservation"),
    },
  ];

  const [onAcceptHandler, setOnAcceptHandler] = useState<(() => void) | null>(null);

  const [mutation, { loading }] = useCancelApplicationSectionMutation();

  const backLink = getApplicationPath(applicationPk, "view");
  const router = useRouter();
  const displayError = useDisplayError();

  const onAccept = async (values: CancelFormValues) => {
    const { reason } = values;
    try {
      if (!applicationSection.pk || !reason) {
        throw new Error("Missing pk or reason");
      }
      setOnAcceptHandler(null);
      const { data, errors } = await mutation({
        variables: {
          input: {
            pk: applicationSection.pk,
            cancelReason: reason,
          },
        },
      });
      if (errors != null && errors.length > 0) {
        throw new ApolloError({
          graphQLErrors: errors,
        });
      } else {
        const res = data?.cancelAllApplicationSectionReservations;
        if (res) {
          const { future, cancelled } = res;
          const url = `${backLink}?cancelled=${cancelled}&future=${future}`;
          router.push(url);
        }
      }
    } catch (err) {
      displayError(err);
    }
  };

  const onSubmit = (values: CancelFormValues) => {
    if (!applicationSection.pk || !values.reason) {
      return;
    }
    setOnAcceptHandler(() => () => onAccept(values));
  };

  const title = t("reservation:cancelSection.title");
  const ingress = t("reservation:cancelSection.ingress");
  const infoBody = t("reservation:cancelSection.body");

  const lang = getLocalizationLang(i18n.language);
  const round = applicationSection?.application?.applicationRound;
  const { termsOfUse } = round ?? {};
  const cancellationTerms = termsOfUse ? getTranslation(termsOfUse, "text", lang) : null;

  const modalTitle = t("reservation:cancelSection.modal.title");
  const modalContent = t("reservation:cancelSection.modal.body");
  const modalAcceptLabel = t("reservation:cancelSection.modal.btnAccept");
  const modalCancelLabel = t("common:prev");

  return (
    <>
      <Breadcrumb routes={routes} />
      <ReservationPageWrapper>
        <div>
          <H1 $marginTop="none">{title}</H1>
          <p>{ingress}</p>
          <p>{infoBody}</p>
        </div>
        <ApplicationSectionInfoCard applicationSection={applicationSection} />
        <CancellationForm
          onNext={onSubmit}
          isLoading={loading}
          isDisabled={getNReservations(applicationSection) === 0}
          cancellationTerms={cancellationTerms}
          backLink={backLink}
        />
        {onAcceptHandler && (
          <ConfirmationDialog
            isOpen
            variant="danger"
            onAccept={onAcceptHandler}
            onCancel={() => setOnAcceptHandler(null)}
            heading={modalTitle}
            content={modalContent}
            acceptLabel={modalAcceptLabel}
            cancelLabel={modalCancelLabel}
            acceptIcon={<IconTrash />}
          />
        )}
      </ReservationPageWrapper>
    </>
  );
}

function getNReservations(applicationSection: Readonly<ApplicationSectionCancelQuery["applicationSection"]>) {
  const opts = applicationSection?.reservationUnitOptions;
  const allocatedSlots = opts?.flatMap((option) => option.allocatedTimeSlots);
  const reservations = allocatedSlots?.flatMap((slot) =>
    slot?.reservationSeries?.reservations.filter(isReservationCancellable)
  );
  return reservations?.length ?? 0;
}

const ApplicationInfo = styled(Card)`
  @media (min-width: ${breakpoints.m}) {
    grid-row: 1 / span 2;
    grid-column: 2;
  }
`;

function ApplicationSectionInfoCard({
  applicationSection,
}: {
  applicationSection: ApplicationSectionCancelQuery["applicationSection"];
}) {
  // NOTE assumes that the name of the reservationSeries is copied from applicationSection when it's created
  const name = applicationSection?.name;
  const opts = applicationSection?.reservationUnitOptions;
  const reservationUnits = filterNonNullable(opts?.flatMap((option) => option?.reservationUnit));
  const { t, i18n } = useTranslation();
  const lang = getLocalizationLang(i18n.language);
  const firstReservationUnit = reservationUnits.find(() => true);
  const allocatedSlots = opts?.flatMap((option) => option.allocatedTimeSlots);

  const times = filterNonNullable(allocatedSlots).map((slot) => {
    const dayOfWeek = slot?.dayOfTheWeek;
    const dayOfWeekString = dayOfWeek ? t(`common:weekdayLongEnum.${dayOfWeek}`) : "";
    const { beginTime, endTime } = slot;
    return `${dayOfWeekString} ${formatApiTimeInterval({ beginTime, endTime })}`;
  });

  const reservationUnitName = firstReservationUnit != null ? getTranslation(firstReservationUnit, "name", lang) : "-";
  const locationString = `${reservationUnitName}${reservationUnits.length > 1 ? ` +${reservationUnits.length - 1}` : ""}`;

  const icons = [
    {
      icon: <IconCalendarEvent aria-hidden="true" />,
      value: `${getNReservations(applicationSection)} ${t("reservation:cancelSection.reservations")}`,
    },
    {
      icon: <IconClock aria-hidden="true" />,
      value: times.join(", "),
    },
    {
      icon: <IconLocation aria-hidden="true" />,
      value: locationString,
    },
  ];

  const { reservationsBeginDate, reservationsEndDate } = applicationSection ?? {};
  const dateLabel = t("reservation:cancelSection.dateLabel");
  const text = `${dateLabel} ${formatDateRange(parseApiDate(reservationsBeginDate ?? ""), parseApiDate(reservationsEndDate ?? ""), { includeWeekday: false })}`;
  return <ApplicationInfo heading={name ?? ""} text={text} variant="vertical" infos={icons} />;
}

type Props = Awaited<ReturnType<typeof getServerSideProps>>["props"];

export async function getServerSideProps(ctx: GetServerSidePropsContext) {
  const { locale, params } = ctx;

  const { apiBaseUrl } = getCommonServerSideProps();
  const client = createApolloClient(apiBaseUrl, ctx);

  const pk = toNumber(ignoreMaybeArray(params?.section));
  if (Number.isFinite(Number(pk))) {
    const { data } = await client.query<ApplicationSectionCancelQuery, ApplicationSectionCancelQueryVariables>({
      query: ApplicationSectionCancelDocument,
      fetchPolicy: "no-cache",
      variables: { id: createNodeId("ApplicationSectionNode", pk ?? 0) },
    });
    const { applicationSection } = data || {};
    const section = applicationSection;

    // TODO do we need a check for all sections? so do we have to query their reservations also?
    // or is it just reservationUnit since the cancel reason is tied to the unit not the reservation
    //
    // TODO we should at least check if the section has any reservations and if any of them are cancellable
    // but that requires we query the CancelFields for the reservations
    // - should we disable the cancel button? probably
    // - should we redirect here or show an error if the section can't be cancelled? (assuming url access)
    const canCancel = section != null; // && isReservationCancellable(reservation);
    if (canCancel) {
      return {
        props: {
          ...(await serverSideTranslations(locale ?? "fi")),
          applicationSection: section,
        },
      };
    } /* TODO redirect if the applicationSection is already cancelled?
    else if (reservation != null) {
      return {
        redirect: {
          permanent: true,
          destination: getReservationPath(reservation.pk),
        },
        props: {
          notFound: true, // for prop narrowing
        },
      };
    }*/
  }

  return {
    notFound: true,
    props: {
      notFound: true,
      ...(await serverSideTranslations(locale ?? "fi")),
    },
  };
}

export default ReservationCancelPage;

// TODO remove the extra reservationUnit fields (included in the CanUserCancelReservationFragment)
// need to do frontend mods to call the function but the query is a lot simpler for backend
export const APPLICATION_SECTION_CANCEL_QUERY = gql`
  query ApplicationSectionCancel($id: ID!) {
    applicationSection(id: $id) {
      pk
      id
      name
      reservationsBeginDate
      reservationsEndDate
      reservationUnitOptions {
        id
        reservationUnit {
          id
          pk
          nameEn
          nameFi
          nameSv
        }
        allocatedTimeSlots {
          id
          dayOfTheWeek
          beginTime
          endTime
          reservationSeries {
            id
            reservations {
              id
              state
              ...CanUserCancelReservation
            }
          }
        }
      }
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
`;

export const CANCEL_APPLICATION_SECTION_MUTATION = gql`
  mutation CancelApplicationSection($input: ApplicationSectionReservationCancellationMutationInput!) {
    cancelAllApplicationSectionReservations(input: $input) {
      future
      cancelled
    }
  }
`;
