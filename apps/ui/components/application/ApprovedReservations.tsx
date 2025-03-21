import {
  type ApplicationSectionReservationFragment,
  useApplicationReservationsQuery,
  type ReservationUnitNode,
  ReservationStateChoice,
  type ApplicationNode,
} from "@/gql/gql-types";
import {
  getApplicationReservationPath,
  getApplicationSectionPath,
  getReservationUnitPath,
} from "@/modules/urls";
import { breakpoints, fontMedium, fontRegular, H5 } from "common";
import {
  getTranslationSafe,
  toApiDate,
  toUIDate,
} from "common/src/common/util";
import { IconButton, StatusLabel } from "common/src/components";
import {
  filterNonNullable,
  formatApiTimeInterval,
  fromMondayFirst,
  getLocalizationLang,
  toNumber,
  type LocalizationLanguages,
} from "common/src/helpers";
import {
  Button,
  ButtonSize,
  ButtonVariant,
  Dialog,
  IconCalendarRecurring,
  IconClock,
  IconCross,
  IconInfoCircle,
  IconLinkExternal,
  IconLocation,
  IconPen,
  Table,
} from "hds-react";
import React, { useState } from "react";
import { useTranslation } from "next-i18next";
import styled from "styled-components";
import { Sanitize } from "common/src/components/Sanitize";
import { LinkLikeButton } from "common/styles/buttonCss";
import { type TFunction } from "i18next";
import { convertWeekday } from "common/src/conversion";
import { ButtonLikeLink } from "../common/ButtonLikeLink";
import { AccordionWithIcons } from "../AccordionWithIcons";
import { CenterSpinner } from "../common/common";
import { useMedia } from "react-use";
import { ButtonContainer, Flex } from "common/styles/util";
import { useRouter } from "next/router";
import {
  isReservationCancellableReason,
  ReservationCancellableReason,
} from "@/modules/reservation";
import { formatDateTimeStrings } from "@/modules/util";
import { PopupMenu } from "common/src/components/PopupMenu";
import { useSearchParams } from "next/navigation";
import type { StatusLabelType } from "common/src/tags";
import { gql } from "@apollo/client";

const N_RESERVATIONS_TO_SHOW = 20;

type ApplicationT = Pick<ApplicationNode, "id" | "pk">;
type Props = {
  application: ApplicationT;
};

const H3 = styled(H5).attrs({
  as: "h3",
  $noMargin: true,
})`
  ${fontMedium}
`;

export const BREAKPOINT = breakpoints.m;

// Tables can't do horizontal scroll without wrapping the table in a div
// NOTE HDS Table can't be styled so have to wrap it in an extra div.
// NOTE hide-on-desktop and hide-on-mobile function differently
// - hide-on-desktop hides only the element
// - hide-on-mobile hides the whole cell
// they are needed for different use cases (e.g. on mobile empty cells create extra gaps)
const TableWrapper = styled.div`
  /* TODO move this to a more general TableWrapper shared with admin-ui */
  /* Mobile uses cards, so no horizontal scroll */
  @media (min-width: ${BREAKPOINT}) {
    /* NOTE this requires using buttons (or other elements with padding) on every row */
    & tbody > tr > td {
      padding-top: 0;
      padding-bottom: 0;
    }
    & > div {
      overflow-x: auto;
      > table {
        width: max-content;
        min-width: 100%;
      }
    }
    .hide-on-desktop {
      display: none;
    }
  }

  @media (max-width: ${BREAKPOINT}) {
    && table {
      /* border can't be in tr because it can't be styled */
      --border-width: 1px;
      --border-color: var(--color-black-90);
      border-bottom: var(--border-width) solid var(--border-color);

      /* No heading, cards have their own headings */
      & thead {
        display: none;
      }
      /* absolute positioning of status tags */
      & tr {
        position: relative;
      }

      & td {
        padding: calc(var(--spacing-2-xs) / 2) var(--spacing-s);
        border: var(--border-width) solid var(--border-color);
        border-bottom: none;
        border-top: none;
        &:first-child {
          border-top: var(--border-width) solid var(--border-color);
        }

        & [class*="IconButton__"] > span {
          padding: 0;
        }
      }

      /* card padding has to be implemented with tds because we can't style tr */
      & td:first-of-type {
        padding-top: var(--spacing-s);
        font-size: var(--fontsize-heading-xs);
        ${fontMedium}
      }

      /* last-of-type is not enough because we are hiding some rows on mobile */
      & td:last-of-type,
      & td > *.last-on-mobile {
        padding-bottom: var(--spacing-s);
      }

      /* stylelint-disable no-descending-specificity */
      & > thead > tr > th,
      & > tbody > tr > td {
        display: flex;
        &:empty {
          display: none;
        }
        /* remove the whole td element if the child is hidden
         * NOTE this will remove the element if any child is hidden */
        :has(.hide-on-mobile) {
          display: none;
        }
      }
      /* stylelint-enable no-descending-specificity */
    }
  }
`;

const MarginHeader = styled(H3)`
  margin-top: var(--spacing-m);
  margin-bottom: var(--spacing-2-xs);
  @media (min-width: ${breakpoints.m}) {
    margin-top: var(--spacing-l);
    margin-bottom: var(--spacing-s);
  }
`;

function getAesReservationUnits(aes: ApplicationSectionT) {
  return filterNonNullable(
    aes.reservationUnitOptions
      .map((x) => x.allocatedTimeSlots)
      .map((x) => x.map((y) => y.recurringReservation?.reservationUnit))
      .flat()
  );
}

function formatAesName(
  aes: ApplicationSectionT,
  lang: LocalizationLanguages
): string {
  const reservationUnits = getAesReservationUnits(aes);
  const firstResUnit = reservationUnits[0];
  if (firstResUnit == null) {
    return "-";
  }
  const { unit } = firstResUnit;
  const resUnitName = getTranslationSafe(firstResUnit, "name", lang);
  const unitName = unit != null ? getTranslationSafe(unit, "name", lang) : "";
  return `${resUnitName}, ${unitName}`;
}

function getAesReservationUnitCount(
  aes: ApplicationSectionReservationFragment
): number {
  return getAesReservationUnits(aes).length;
}

function formatNumberOfReservations(
  t: TFunction,
  aes: ApplicationSectionReservationFragment
): string {
  const reservations = aes.reservationUnitOptions.flatMap((ruo) =>
    ruo.allocatedTimeSlots.flatMap(
      (ats) => ats.recurringReservation?.reservations ?? []
    )
  );
  const count = reservations.length;
  return `${count} ${t("application:view.reservationsTab.reservationCountPostfix")}`;
}

function formatReservationTimes(
  t: TFunction,
  aes: ApplicationSectionReservationFragment
): string {
  const atsList = filterNonNullable(
    aes.reservationUnitOptions.flatMap((ruo) =>
      ruo.allocatedTimeSlots.map((a) => a)
    )
  );
  type TimeLabel = {
    day: number;
    label: string;
  };
  const times: TimeLabel[] = atsList.reduce<TimeLabel[]>((acc, ats) => {
    if (ats.recurringReservation == null) {
      return acc;
    }
    const { dayOfTheWeek } = ats;
    const day = convertWeekday(dayOfTheWeek);
    const time = formatApiTimeInterval(ats.recurringReservation);
    // NOTE our translations are sunday first
    // using enum translations is bad because we need to sort by day of the week
    const tday = t(`weekDay.${fromMondayFirst(day)}`);
    return [...acc, { day, label: `${tday} ${time}` }];
  }, []);
  times.sort((a, b) => a.day - b.day);

  return times.map((x) => x.label).join(" / ") || "-";
}

export function ApprovedReservations({ application }: Readonly<Props>) {
  const { t, i18n } = useTranslation();
  const searchParams = useSearchParams();
  const { data, loading } = useApplicationReservationsQuery({
    variables: {
      id: application.id,
      beginDate: toApiDate(new Date()) ?? "",
    },
  });
  const { application: app } = data || {};

  const sections = filterNonNullable(
    app?.applicationSections?.filter((aes) => {
      const slots = aes.reservationUnitOptions.flatMap(
        (x) => x.allocatedTimeSlots
      );
      return slots.length > 0;
    })
  );

  const lang = getLocalizationLang(i18n.language);
  const selectedSection = toNumber(searchParams.get("section"));
  const hasOnlyOneSection = sections.length === 1;

  return (
    <Flex>
      {loading && <CenterSpinner />}
      {sections.map((aes) => (
        <AccordionWithIcons
          heading={aes.name}
          initiallyOpen={hasOnlyOneSection || selectedSection === aes.pk}
          shouldScrollIntoView={selectedSection === aes.pk}
          headingLevel={2}
          icons={[
            {
              icon: <IconCalendarRecurring />,
              text: formatNumberOfReservations(t, aes),
            },
            {
              icon: <IconClock />,
              text: formatReservationTimes(t, aes),
            },
            {
              icon: <IconLocation />,
              text: formatAesName(aes, lang),
              textPostfix:
                getAesReservationUnitCount(aes) > 1
                  ? `+ ${getAesReservationUnitCount(aes) - 1} ${t("application:view:reservationsTab.others")}`
                  : undefined,
            },
          ]}
          key={aes.pk}
        >
          <ApplicationSection
            applicationSection={aes}
            key={aes.pk}
            application={application}
          />
        </AccordionWithIcons>
      ))}
    </Flex>
  );
}

type ApplicationSectionT = ApplicationSectionReservationFragment;

const OnlyForMobile = styled.span`
  display: inline;
  @media (min-width: ${BREAKPOINT}) {
    display: none;
  }
`;

const IconTextWrapper = styled.span`
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-3-xs);

  /* mobile uses icons instead of header text */
  > svg {
    display: inline;
  }
  @media (min-width: ${BREAKPOINT}) {
    > svg {
      display: none;
    }
  }
`;

type ReservationUnitTableElem = {
  reservationUnit: Pick<
    ReservationUnitNode,
    | "id"
    | "pk"
    | "reservationConfirmedInstructionsFi"
    | "reservationConfirmedInstructionsSv"
    | "reservationConfirmedInstructionsEn"
    | "nameFi"
    | "nameSv"
    | "nameEn"
  >;
  dateOfWeek: string;
  // same for this actual end / start times or a combined string
  time: string;
};

/// Have to asign min-height on desktop otherwise the table rows are too small
/// can't assign it on mobile because it's card (and 44px is too much)
const StyledLinkLikeButton = styled(LinkLikeButton)`
  @media (min-width: ${BREAKPOINT}) {
    min-height: 44px;
  }
`;

function ReservationUnitTable({
  reservationUnits,
}: Readonly<{
  reservationUnits: ReservationUnitTableElem[];
}>) {
  const { t, i18n } = useTranslation();
  type ModalT = ReservationUnitTableElem["reservationUnit"];
  const [modal, setModal] = useState<ModalT | null>(null);

  const lang = getLocalizationLang(i18n.language);

  const isMobile = useMedia(`(max-width: ${BREAKPOINT})`, false);

  const cols = [
    {
      key: "reservationUnit",
      headerName: t("application:view.reservationsTab.reservationUnit"),
      isSortable: false,
      transform: (elem: ReservationUnitTableElem) =>
        createReservationUnitLink({
          reservationUnit: elem.reservationUnit,
          lang,
        }),
    },
    {
      key: "dateOfWeek",
      headerName: t("common:day"),
      isSortable: false,
      transform: ({ dateOfWeek }: ReservationUnitTableElem) => (
        <IconTextWrapper className="hide-on-mobile">
          {dateOfWeek}
        </IconTextWrapper>
      ),
    },
    {
      key: "time",
      headerName: t("common:timeLabel"),
      isSortable: false,
      transform: ({ dateOfWeek, time }: ReservationUnitTableElem) => (
        <IconTextWrapper aria-label={t("common:timeLabel")}>
          <IconClock />
          <OnlyForMobile>{dateOfWeek}</OnlyForMobile>
          {time}
        </IconTextWrapper>
      ),
    },
    {
      key: "helpLink",
      headerName: t("application:view.helpModal.title"),
      transform: ({ reservationUnit }: ReservationUnitTableElem) => (
        <StyledLinkLikeButton onClick={() => setModal(reservationUnit)}>
          <IconInfoCircle />
          {isMobile
            ? t("application:view.helpLinkLong")
            : t("application:view.helpLink")}
        </StyledLinkLikeButton>
      ),
      isSortable: false,
    },
  ];

  const getTranslation = (
    elem: ModalT | null,
    field: "name" | "reservationConfirmedInstructions"
  ) => {
    if (elem == null) {
      return "";
    }
    return getTranslationSafe(elem, field, lang);
  };

  return (
    <>
      <TableWrapper>
        <Table
          variant="light"
          indexKey="pk"
          rows={reservationUnits}
          cols={cols}
        />
      </TableWrapper>
      <Dialog
        id="reservation-unit-modal-help"
        isOpen={modal != null}
        title={t("application:view.helpModal.title")}
        aria-labelledby="reservation-unit-modal-help-header"
        closeButtonLabelText={t("common:close")}
        close={() => {
          setModal(null);
        }}
      >
        <Dialog.Header
          id="reservation-unit-modal-help-header"
          title={getTranslation(modal, "name")}
          iconStart={<IconInfoCircle />}
        />
        <Dialog.Content id="dialog-content">
          <Sanitize
            html={getTranslation(modal, "reservationConfirmedInstructions")}
          />
        </Dialog.Content>
        <Dialog.ActionButtons>
          <Button onClick={() => setModal(null)}>{t("common:close")}</Button>
        </Dialog.ActionButtons>
      </Dialog>
    </>
  );
}

type ReservationsTableElem = {
  date: Date;
  dayOfWeek: string;
  time: string;
  reservationUnit: Pick<
    ReservationUnitNode,
    "nameSv" | "nameFi" | "nameEn" | "id" | "pk"
  >;
  status: "" | "rejected" | "modified" | "cancelled";
  isCancellableReason: ReservationCancellableReason;
  pk: number;
};

// TODO this should not wrap on mobile, use truncate instead (it looks better and should be a rare case)
const ReservationUnitLink = styled(IconButton)`
  & span {
    display: inline-flex;
    flex-wrap: wrap;

    text-decoration: underline;
    ${fontRegular}
  }

  /* table hides icons by default, override this behaviour */
  &&& svg {
    display: inline;
  }
`;

function createReservationUnitLink({
  reservationUnit,
  lang,
}: {
  lang: LocalizationLanguages;
  reservationUnit: Pick<
    ReservationUnitNode,
    "nameSv" | "nameFi" | "nameEn" | "id" | "pk"
  >;
}): JSX.Element {
  const { pk } = reservationUnit;
  const name = getTranslationSafe(reservationUnit, "name", lang);
  if (pk == null || pk <= 0) {
    return <span>{name}</span>;
  }
  return (
    <ReservationUnitLink
      href={getReservationUnitPath(pk)}
      label={name}
      openInNewTab
      icon={<IconLinkExternal />}
    />
  );
}

const StyledStatusLabel = styled(StatusLabel)`
  @media (max-width: ${BREAKPOINT}) {
    position: absolute;
    right: var(--spacing-s);
    top: var(--spacing-s);
  }
`;

function getStatusLabelProps(status: string): {
  icon: JSX.Element;
  type: StatusLabelType;
} {
  switch (status) {
    case "cancelled":
      return {
        icon: <IconCross />,
        type: "neutral",
      };
    case "modified":
      return {
        icon: <IconPen />,
        type: "neutral",
      };
    case "denied":
    default:
      return {
        icon: <IconCross />,
        type: "error",
      };
  }
}

function ReservationsTable({
  reservations,
  application,
}: Readonly<{
  reservations: ReservationsTableElem[];
  application: Pick<ApplicationT, "pk">;
}>) {
  const { i18n } = useTranslation();
  const { t } = useTranslation();

  const lang = getLocalizationLang(i18n.language);
  const router = useRouter();

  const handleCancel = (pk: number) => {
    router.push(getApplicationReservationPath(application.pk, pk));
  };

  const cols = [
    {
      key: "date",
      headerName: t("common:dateLabel"),
      isSortable: false,
      transform: ({
        pk,
        date,
        dayOfWeek,
        isCancellableReason,
      }: ReservationsTableElem) => {
        const isDisabled = isCancellableReason !== "";
        const items = [
          {
            name: t("common:cancel"),
            onClick: () => handleCancel(pk),
            disabled: isDisabled,
          },
        ] as const;

        return (
          <Flex
            $direction="row"
            $gap="2-xs"
            $justifyContent="space-between"
            $width="full"
          >
            <span aria-label={t("common:dateLabel")}>
              <span>{toUIDate(date)}</span>
              <OnlyForMobile>
                {/* span removes whitespace */}
                <pre style={{ display: "inline" }}>{" - "}</pre>
                <span>{dayOfWeek}</span>
              </OnlyForMobile>
            </span>
            {!isDisabled ? (
              <PopupMenu
                items={items}
                className="popover-menu-toggle hide-on-desktop"
              />
            ) : null}
          </Flex>
        );
      },
    },
    {
      key: "dayOfWeek",
      headerName: t("common:day"),
      isSortable: false,
      transform: ({ dayOfWeek }: ReservationsTableElem) => (
        <IconTextWrapper className="hide-on-mobile">
          {dayOfWeek}
        </IconTextWrapper>
      ),
    },
    {
      key: "time",
      headerName: t("common:timeLabel"),
      isSortable: false,
      transform: ({ dayOfWeek, time }: ReservationsTableElem) => (
        <IconTextWrapper aria-label={t("common:timeLabel")}>
          <IconClock />
          <OnlyForMobile>{dayOfWeek}</OnlyForMobile>
          {time}
        </IconTextWrapper>
      ),
    },
    {
      key: "reservationUnit",
      headerName: t("application:view.reservationsTab.reservationUnit"),
      isSortable: false,
      transform: (elem: ReservationsTableElem) => (
        <IconTextWrapper
          className="last-on-mobile"
          aria-label={t("application:view.reservationsTab.reservationUnit")}
        >
          <IconLocation />
          {createReservationUnitLink({
            reservationUnit: elem.reservationUnit,
            lang,
          })}
        </IconTextWrapper>
      ),
    },
    {
      key: "status",
      headerName: "",
      isSortable: false,
      transform: ({ status }: ReservationsTableElem) => {
        if (status === "") {
          return "";
        }
        const labelProps = getStatusLabelProps(status);
        return (
          <StyledStatusLabel icon={labelProps.icon} type={labelProps.type}>
            {t(`application:view.reservationsTab.${status}`)}
          </StyledStatusLabel>
        );
      },
    },
    {
      key: "cancelButton",
      headerName: "",
      isSortable: false,
      transform: ({ pk, isCancellableReason }: ReservationsTableElem) => (
        <Button
          variant={ButtonVariant.Supplementary}
          size={ButtonSize.Small}
          iconStart={<IconCross />}
          onClick={() => handleCancel(pk)}
          disabled={isCancellableReason !== ""}
          title={
            isCancellableReason === ""
              ? t("common:cancel")
              : t(`reservations:modifyTimeReasons.${isCancellableReason}`)
          }
          // Corresponding mobile menu is on the first row
          className="hide-on-mobile"
        >
          {t("common:cancel")}
        </Button>
      ),
    },
  ];

  return (
    <TableWrapper>
      <Table variant="light" indexKey="date" rows={reservations} cols={cols} />
    </TableWrapper>
  );
}

function getReservationStatusChoice(
  state: ReservationStateChoice | null | undefined,
  isModified?: boolean
): "" | "rejected" | "modified" | "cancelled" {
  switch (state) {
    case ReservationStateChoice.Denied:
      return "rejected";
    case ReservationStateChoice.Cancelled:
      return "cancelled";
    default:
      return isModified ? "modified" : "";
  }
}

function sectionToreservations(
  t: TFunction,
  section: ApplicationSectionReservationFragment
): ReservationsTableElem[] {
  const recurringReservations = filterNonNullable(
    section.reservationUnitOptions.flatMap((ruo) =>
      ruo.allocatedTimeSlots.map((ats) =>
        ats.recurringReservation != null
          ? {
              ...ats.recurringReservation,
              allocatedTimeSlot: {
                dayOfTheWeek: ats.dayOfTheWeek,
                beginTime: ats.beginTime,
                endTime: ats.endTime,
              },
            }
          : null
      )
    )
  );

  function getRejected(
    r: (typeof recurringReservations)[0]
  ): ReservationsTableElem[] {
    return r.rejectedOccurrences.map((res) => {
      const reservation = { begin: res.beginDatetime, end: res.endDatetime };
      const rest = formatDateTimeStrings(t, reservation);
      return {
        ...rest,
        reservationUnit: r.reservationUnit,
        status: "rejected",
        isCancellableReason: "ALREADY_CANCELLED",
        pk: 0,
      };
    });
  }

  function getReservations(
    r: (typeof recurringReservations)[0]
  ): ReservationsTableElem[] {
    return r.reservations.map((res) => {
      const { isModified, ...rest } = formatDateTimeStrings(
        t,
        res,
        r.allocatedTimeSlot
      );

      const status = getReservationStatusChoice(res.state, isModified);

      return {
        ...rest,
        reservationUnit: r.reservationUnit,
        status,
        isCancellableReason: isReservationCancellableReason(res),
        pk: res.pk ?? 0,
      };
    });
  }

  return (
    recurringReservations
      .reduce<ReservationsTableElem[]>((acc, r) => {
        const rejected = getRejected(r);
        const expanded: ReservationsTableElem[] = getReservations(r);
        return [...acc, ...expanded, ...rejected];
      }, [])
      // NOTE have to sort here because we are combining two lists
      .sort((a, b) => a.date.getTime() - b.date.getTime())
  );
}

function sectionToReservationUnits(
  t: TFunction,
  section: ApplicationSectionT
): ReservationUnitTableElem[] {
  const reservationUnitsByDay = filterNonNullable(
    section.reservationUnitOptions
      .map((ruo) => ruo.allocatedTimeSlots.map((ats) => ats))
      .flat()
      .map((ats) => {
        const { recurringReservation: r, dayOfTheWeek } = ats;
        if (r == null) {
          return null;
        }
        const { reservationUnit } = r;
        const day = convertWeekday(dayOfTheWeek);
        return {
          reservationUnit,
          // NOTE monday first for sorting
          day,
          recurringReservation: r,
          time: formatApiTimeInterval(r),
        };
      })
  );
  reservationUnitsByDay.sort((a, b) => a.day - b.day);
  return reservationUnitsByDay.map((x) => {
    const { reservationUnit, day, time } = x;
    return {
      reservationUnit,
      // NOTE our translations are sunday first
      dateOfWeek: t(`weekDayLong.${fromMondayFirst(day)}`),
      time,
    };
  });
}

export function AllReservations({
  applicationSection,
  application,
}: Readonly<{
  applicationSection: ApplicationSectionT;
  application: Pick<ApplicationT, "pk">;
}>) {
  const { t } = useTranslation();
  const reservations = sectionToreservations(t, applicationSection);
  return (
    <>
      <H3 $noMargin>
        {t("application:view.reservationsTab.reservationsTitle")}
      </H3>
      <ReservationsTable
        reservations={reservations}
        application={application}
      />
    </>
  );
}

export function ApplicationSection({
  applicationSection,
  application,
}: Readonly<{
  applicationSection: ApplicationSectionT;
  application: Pick<ApplicationT, "pk">;
}>) {
  const { t } = useTranslation();

  const reservationUnits: ReservationUnitTableElem[] =
    sectionToReservationUnits(t, applicationSection);
  const reservations = sectionToreservations(t, applicationSection)
    // NOTE we need to slice even if backend returns only 20 of each
    // because we want to keep the total at 20
    .slice(0, N_RESERVATIONS_TO_SHOW);

  return (
    <Flex>
      <div>
        <MarginHeader>
          {t("application:view.reservationsTab.reservationUnitsTitle")}
        </MarginHeader>
        <ReservationUnitTable reservationUnits={reservationUnits} />
        <MarginHeader>
          {t("application:view.reservationsTab.reservationsTitle")}
        </MarginHeader>
        <ReservationsTable
          reservations={reservations}
          application={application}
        />
      </div>
      <ButtonContainer $justifyContent="center">
        <ButtonLikeLink
          href={getApplicationSectionPath(
            applicationSection.pk,
            application.pk
          )}
          target="_blank"
          rel="noopener noreferrer"
        >
          {t("application:view.reservationsTab.showAllReservations")}
          <IconLinkExternal />
        </ButtonLikeLink>
        <ButtonLikeLink
          href={getApplicationSectionPath(
            applicationSection.pk,
            application.pk,
            "cancel"
          )}
        >
          {t("application:view.reservationsTab.cancelApplication")}
          <IconCross />
        </ButtonLikeLink>
      </ButtonContainer>
    </Flex>
  );
}

export const APPLICATION_SECTION_RESERVATION_FRAGMENT = gql`
  fragment ApplicationSectionReservation on ApplicationSectionNode {
    id
    pk
    name
    reservationUnitOptions {
      id
      allocatedTimeSlots {
        id
        dayOfTheWeek
        beginTime
        endTime
        recurringReservation {
          id
          pk
          beginTime
          endTime
          weekdays
          reservationUnit {
            id
            pk
            nameFi
            nameEn
            nameSv
            reservationConfirmedInstructionsFi
            reservationConfirmedInstructionsEn
            reservationConfirmedInstructionsSv
            unit {
              id
              nameFi
              nameEn
              nameSv
            }
          }
          rejectedOccurrences {
            id
            beginDatetime
            endDatetime
          }
          reservations(orderBy: [beginAsc], beginDate: $beginDate) {
            id
            pk
            end
            state
            ...CanUserCancelReservation
          }
        }
      }
    }
  }
`;

// client side query, for now take all the data needed for this Tab
// client side because the SSR query is too complex already
// this allows faster iteration and splitting the query if needed (based on open Accordions)
// we can cache data on client side (when user opens Accordions)
export const APPLICATION_RESERVATIONS_QUERY = gql`
  query ApplicationReservations($id: ID!, $beginDate: Date!) {
    application(id: $id) {
      id
      pk
      applicationSections {
        ...ApplicationSectionReservation
      }
    }
  }
`;
