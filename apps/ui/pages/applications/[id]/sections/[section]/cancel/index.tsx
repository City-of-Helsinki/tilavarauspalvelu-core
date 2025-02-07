import React, { useState } from "react";
import type { GetServerSidePropsContext } from "next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import {
  ApplicationSectionCancelDocument,
  useCancelApplicationSectionMutation,
  type ApplicationSectionCancelQuery,
  type ApplicationSectionCancelQueryVariables,
} from "@gql/gql-types";
import {
  type CancelFormValues,
  CancellationForm,
} from "@/components/CancellationForm";
import { ReservationPageWrapper } from "@/components/reservations/styles";
import { getCommonServerSideProps } from "@/modules/serverUtils";
import { createApolloClient } from "@/modules/apolloClient";
import {
  base64encode,
  filterNonNullable,
  formatApiTimeInterval,
} from "common/src/helpers";
import { getApplicationPath } from "@/modules/urls";
import { useTranslation } from "next-i18next";
import { gql } from "@apollo/client";
import { breakpoints, H1 } from "common";
import {
  convertLanguageCode,
  fromApiDate,
  getTranslationSafe,
  toUIDate,
} from "common/src/common/util";
import { useRouter } from "next/router";
import { errorToast } from "common/src/common/toast";
import {
  IconCalendarEvent,
  IconClock,
  IconLocation,
  IconTrash,
} from "hds-react";
import { Card } from "common/src/components";
import styled from "styled-components";
import { isReservationCancellable } from "@/modules/reservation";
import { ConfirmationDialog } from "common/src/components/ConfirmationDialog";
import { Breadcrumb } from "@/components/common/Breadcrumb";

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
      title: t("reservations:cancel.reservation"),
    },
  ];

  const [onAcceptHandler, setOnAcceptHandler] = useState<(() => void) | null>(
    null
  );

  const [mutation, { loading }] = useCancelApplicationSectionMutation();

  const backLink = getApplicationPath(applicationPk, "view");
  const router = useRouter();

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
        errorToast({ text: t("RequestedReservation.DenyDialog.errorSaving") });
      } else {
        const res = data?.cancelAllApplicationSectionReservations;
        if (res) {
          const { future, cancelled } = res;
          const url = `${backLink}?cancelled=${cancelled}&future=${future}`;
          router.push(url);
        }
      }
    } catch (e) {
      errorToast({
        text: t("reservations:cancel.mutationFailed"),
      });
    }
  };

  const onSubmit = async (values: CancelFormValues) => {
    if (!applicationSection.pk || !values.reason) {
      return;
    }
    setOnAcceptHandler(() => () => onAccept(values));
  };

  const title = t("reservations:cancelSection.title");
  const ingress = t("reservations:cancelSection.ingress");
  const infoBody = t("reservations:cancelSection.body");

  const lang = convertLanguageCode(i18n.language);
  const round = applicationSection?.application?.applicationRound;
  const { termsOfUse } = round ?? {};
  const cancellationTerms = termsOfUse
    ? getTranslationSafe(termsOfUse, "text", lang)
    : null;

  const modalTitle = t("reservations:cancelSection.modal.title");
  const modalContent = t("reservations:cancelSection.modal.body");
  const modalAcceptLabel = t("reservations:cancelSection.modal.btnAccept");
  const modalCancelLabel = t("common:prev");

  return (
    <>
      <Breadcrumb routes={routes} />
      <ReservationPageWrapper>
        <div>
          <H1 $noMargin>{title}</H1>
          <p>{ingress}</p>
          <p>{infoBody}</p>
        </div>
        <ApplicationSectionInfoCard applicationSection={applicationSection} />
        <CancellationForm
          onNext={onSubmit}
          isLoading={loading}
          isDisabled={getNReservations(applicationSection) === 0}
          cancelReasons={props.reasons}
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

function getNReservations(
  applicationSection: Readonly<
    ApplicationSectionCancelQuery["applicationSection"]
  >
) {
  const opts = applicationSection?.reservationUnitOptions;
  const allocatedSlots = opts?.flatMap((option) => option.allocatedTimeSlots);
  const reservations = allocatedSlots?.flatMap((slot) =>
    slot?.recurringReservation?.reservations.filter(isReservationCancellable)
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
  // NOTE assumes that the name of the recurringReservation is copied from applicationSection when it's created
  const name = applicationSection?.name;
  const opts = applicationSection?.reservationUnitOptions;
  const reservationUnits = filterNonNullable(
    opts?.flatMap((option) => option?.reservationUnit)
  );
  const { t, i18n } = useTranslation();
  const lang = convertLanguageCode(i18n.language);
  const firstReservationUnit = reservationUnits.find(() => true);
  const allocatedSlots = opts?.flatMap((option) => option.allocatedTimeSlots);

  const times = filterNonNullable(allocatedSlots).map((slot) => {
    const dayOfWeek = slot?.dayOfTheWeek;
    const dayOfWeekString = dayOfWeek
      ? t(`common:weekdayLongEnum.${dayOfWeek}`)
      : "";
    const { beginTime, endTime } = slot;
    return `${dayOfWeekString} ${formatApiTimeInterval({ beginTime, endTime })}`;
  });

  const reservationUnitName =
    firstReservationUnit != null
      ? getTranslationSafe(firstReservationUnit, "name", lang)
      : "-";
  const locationString = `${reservationUnitName}${reservationUnits.length > 1 ? ` +${reservationUnits.length - 1}` : ""}`;

  const icons = [
    {
      icon: <IconCalendarEvent aria-hidden="true" />,
      value: `${getNReservations(applicationSection)} ${t("reservations:cancelSection.reservations")}`,
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

  const { reservationsBeginDate, reservationsEndDate } =
    applicationSection ?? {};
  const dateLabel = t("reservations:cancelSection.dateLabel");
  const begin = toUIDate(fromApiDate(reservationsBeginDate ?? ""));
  const end = toUIDate(fromApiDate(reservationsEndDate ?? ""));
  const text = `${dateLabel} ${begin} - ${end}`;
  return (
    <ApplicationInfo
      heading={name ?? ""}
      text={text}
      variant="vertical"
      infos={icons}
    />
  );
}

type Props = Awaited<ReturnType<typeof getServerSideProps>>["props"];

export async function getServerSideProps(ctx: GetServerSidePropsContext) {
  const { locale, params } = ctx;
  const pk = params?.section;

  const commonProps = getCommonServerSideProps();
  const client = createApolloClient(commonProps.apiBaseUrl, ctx);

  if (Number.isFinite(Number(pk))) {
    const id = base64encode(`ApplicationSectionNode:${pk}`);
    const { data } = await client.query<
      ApplicationSectionCancelQuery,
      ApplicationSectionCancelQueryVariables
    >({
      query: ApplicationSectionCancelDocument,
      fetchPolicy: "no-cache",
      variables: { id },
    });
    const { applicationSection } = data || {};
    const section = applicationSection;

    const reasons = filterNonNullable(
      data?.reservationCancelReasons?.edges.map((edge) => edge?.node)
    );

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
          ...commonProps,
          ...(await serverSideTranslations(locale ?? "fi")),
          applicationSection: section,
          reasons,
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
      ...commonProps,
      ...(await serverSideTranslations(locale ?? "fi")),
    },
  };
}

// TODO remove the extra reservationUnit fields (included in the CanUserCancelReservationFragment)
// need to do frontend mods to call the function but the query is a lot simpler for backend
export const APPLICATION_SECTION_CANCEL = gql`
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
          recurringReservation {
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
    reservationCancelReasons {
      edges {
        node {
          ...CancelReasonFields
        }
      }
    }
  }
`;

export default ReservationCancelPage;
