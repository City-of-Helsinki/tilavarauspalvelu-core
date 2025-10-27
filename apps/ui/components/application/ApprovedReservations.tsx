import React, { useState } from "react";
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
  Tooltip,
} from "hds-react";
import { useTranslation } from "next-i18next";
import { useSearchParams } from "next/navigation";
import styled from "styled-components";
import { type TFunction } from "i18next";
import { useMedia } from "react-use";
import { useRouter } from "next/router";
import { isBefore } from "date-fns";
import {
  fontBold,
  fontMedium,
  fontRegular,
  ButtonContainer,
  Flex,
  LinkLikeButton,
  H5,
  CenterSpinner,
} from "common/src/styled";
import { breakpoints } from "common/src/modules/const";
import { getTranslationSafe } from "common/src/modules/util";
import {
  filterNonNullable,
  formatApiTimeInterval,
  getLocalizationLang,
  sort,
  toNumber,
} from "common/src/modules/helpers";
import type { LocalizationLanguages } from "common/src/modules/urlBuilder";
import { convertWeekday } from "common/src/modules/conversion";
import { PopupMenu } from "common/src/components/PopupMenu";
import { IconButton, StatusLabel } from "common/src/components";
import type { StatusLabelType } from "common/src/components/StatusLabel";
import { Sanitize } from "common/src/components/Sanitize";
import {
  type ApplicationSectionReservationFragment,
  useApplicationReservationsQuery,
  ReservationStateChoice,
  AccessType,
  type ApplicationNode,
  ApplicationSectionReservationUnitFragment,
  AccessTypeWithMultivalued,
  PindoraSectionFragment,
  PindoraReservationFragment,
  ReservationUnitAccessTypeNode,
  Maybe,
  ApplicationRoundNode,
} from "@/gql/gql-types";
import { gql } from "@apollo/client";
import { getApplicationReservationPath, getApplicationSectionPath, getReservationUnitPath } from "@/modules/urls";
import { ButtonLikeLink } from "common/src/components/ButtonLikeLink";
import { AccordionWithIcons } from "@/components/AccordionWithIcons";
import { isReservationCancellableReason, ReservationCancellableReason } from "@/modules/reservation";
import {
  formatDate,
  formatDateRange,
  applicationReservationDateTime,
  setMondayFirst,
  formatApiDate,
} from "common/src/date-utils";
import { getReservationUnitAccessPeriods } from "@/modules/reservationUnit";

const N_RESERVATIONS_TO_SHOW = 20;

type ApplicationT = Pick<ApplicationNode, "id" | "pk">;
type ApplicationRoundT = Pick<ApplicationRoundNode, "reservationPeriodBeginDate" | "reservationPeriodEndDate">;
type Props = {
  application: ApplicationT;
  applicationRound: ApplicationRoundT;
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
      .map((x) => x.map((y) => y.reservationSeries?.reservationUnit))
      .flat()
  );
}

function formatAesName(aes: ApplicationSectionT, lang: LocalizationLanguages): string {
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

function getAesReservationUnitCount(aes: ApplicationSectionReservationFragment): number {
  return getAesReservationUnits(aes).length;
}

function formatNumberOfReservations(t: TFunction, aes: ApplicationSectionReservationFragment): string {
  const reservations = aes.reservationUnitOptions.flatMap((ruo) =>
    ruo.allocatedTimeSlots.flatMap((ats) => ats.reservationSeries?.reservations ?? [])
  );
  const count = reservations.length;
  return `${count} ${t("application:view.reservationsTab.reservationCountPostfix")}`;
}

function formatReservationTimes(t: TFunction, aes: ApplicationSectionReservationFragment): string {
  const atsList = filterNonNullable(aes.reservationUnitOptions.flatMap((ruo) => ruo.allocatedTimeSlots.map((a) => a)));
  type TimeLabel = {
    day: number;
    label: string;
  };
  const times: TimeLabel[] = atsList.reduce<TimeLabel[]>((acc, ats) => {
    if (ats.reservationSeries == null) {
      return acc;
    }
    const { dayOfTheWeek } = ats;
    const day = convertWeekday(dayOfTheWeek);
    const time = formatApiTimeInterval(ats.reservationSeries);
    // NOTE our translations are sunday first
    // using enum translations is bad because we need to sort by day of the week
    const tday = t(`weekDay.${setMondayFirst(day)}`);
    return [...acc, { day, label: `${tday} ${time}` }];
  }, []);
  times.sort((a, b) => a.day - b.day);

  return times.map((x) => x.label).join(" / ") || "-";
}

function accessCodeSafe(pindoraInfo: PindoraSectionFragment | null, t: TFunction) {
  if (!pindoraInfo?.accessCode) {
    return t("reservations:contactSupport");
  } else {
    return pindoraInfo.accessCode;
  }
}

export function ApprovedReservations({ application, applicationRound }: Readonly<Props>) {
  const { t, i18n } = useTranslation();
  const searchParams = useSearchParams();
  const { data, loading } = useApplicationReservationsQuery({
    variables: {
      id: application.id,
      beginDate: formatApiDate(new Date()) ?? "",
    },
  });
  const { application: app } = data || {};

  const sections = filterNonNullable(
    app?.applicationSections?.filter((aes) => {
      const slots = aes.reservationUnitOptions.flatMap((x) => x.allocatedTimeSlots);
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
            applicationRound={applicationRound}
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
  position: relative;
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

type ReservationSeriesTableElem = {
  reservationUnit: ApplicationSectionReservationUnitFragment;
  dateOfWeek: string;
  // same for this actual end / start times or a combined string
  time: string;
  accessType: AccessTypeWithMultivalued | null;
  usedAccessTypes: Readonly<AccessType[]> | null;
  pindoraInfo: PindoraSectionFragment | null;
};

/// Have to asign min-height on desktop otherwise the table rows are too small
/// can't assign it on mobile because it's card (and 44px is too much)
const StyledLinkLikeButton = styled(LinkLikeButton)`
  @media (min-width: ${BREAKPOINT}) {
    min-height: 44px;
  }
`;

const TooltipIconWrapper = styled.span`
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-3-xs);
  > div {
    justify-self: center;
  }
`;

function ReservationSeriesTable({
  reservationUnits,
  applicationRound,
}: Readonly<{
  reservationUnits: ReservationSeriesTableElem[];
  applicationRound: ApplicationRoundT;
}>) {
  const { t, i18n } = useTranslation();
  type ModalT = ReservationSeriesTableElem["reservationUnit"];
  const [modal, setModal] = useState<ModalT | null>(null);

  const lang = getLocalizationLang(i18n.language);

  const isMobile = useMedia(`(max-width: ${BREAKPOINT})`, false);

  const cols = [
    {
      key: "reservationUnit",
      headerName: t("application:view.reservationsTab.reservationUnit"),
      isSortable: false,
      transform: (elem: ReservationSeriesTableElem) =>
        createReservationUnitLink({
          reservationUnit: elem.reservationUnit,
          lang,
        }),
    },
    {
      key: "dateOfWeek",
      headerName: t("common:day"),
      isSortable: false,
      transform: ({ dateOfWeek }: ReservationSeriesTableElem) => (
        <IconTextWrapper className="hide-on-mobile">{dateOfWeek}</IconTextWrapper>
      ),
    },
    {
      key: "time",
      headerName: t("common:timeLabel"),
      isSortable: false,
      transform: ({ dateOfWeek, time }: ReservationSeriesTableElem) => (
        <IconTextWrapper aria-label={t("common:timeLabel")}>
          <IconClock />
          <OnlyForMobile>{dateOfWeek}</OnlyForMobile>
          {time}
        </IconTextWrapper>
      ),
    },
    {
      key: "accessTypes",
      headerName: t("reservationUnit:accessType"),
      isSortable: false,
      transform: (elem: ReservationSeriesTableElem) => (
        <TooltipIconWrapper>
          {getReservationSeriesAccessText(elem, t)}
          {elem.accessType === AccessTypeWithMultivalued.Multivalued && (
            <Tooltip>{t("application:view.accessTypeWarning")}</Tooltip>
          )}
        </TooltipIconWrapper>
      ),
    },
    {
      key: "helpLink",
      headerName: t("application:view.helpModal.title"),
      transform: ({ reservationUnit }: ReservationSeriesTableElem) => (
        <StyledLinkLikeButton onClick={() => setModal(reservationUnit)}>
          <IconInfoCircle />
          {isMobile ? t("application:view.helpLinkLong") : t("application:view.helpLink")}
        </StyledLinkLikeButton>
      ),
      isSortable: false,
    },
  ];

  const getTranslation = (elem: ModalT | null, field: "name" | "reservationConfirmedInstructions") => {
    if (elem == null) {
      return "";
    }
    return getTranslationSafe(elem, field, lang);
  };

  return (
    <>
      <TableWrapper>
        <Table variant="light" indexKey="pk" rows={reservationUnits} cols={cols} />
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
          <Sanitize html={getTranslation(modal, "reservationConfirmedInstructions")} />
          {modal?.accessTypes.some((aT: { accessType: AccessType }) => aT.accessType !== AccessType.Unrestricted) && (
            <ReservationUnitAccessTypeList
              accessTypes={modal.accessTypes}
              reservationUnits={reservationUnits}
              pk={modal?.pk}
              roundReservationBegin={new Date(applicationRound.reservationPeriodBeginDate)}
              roundReservationEnd={new Date(applicationRound.reservationPeriodEndDate)}
            />
          )}
        </Dialog.Content>
        <Dialog.ActionButtons>
          <Button onClick={() => setModal(null)}>{t("common:close")}</Button>
        </Dialog.ActionButtons>
      </Dialog>
    </>
  );
}

const ModalAccessInfo = styled.div`
  margin: var(--spacing-m) 0 0;
  padding: var(--spacing-m);
  background-color: var(--color-silver);
`;

const AccessTypeList = styled.ul`
  margin: 0;
  padding: 0;
  list-style-type: none;
  li {
    display: flex;
    span {
      width: 50%;
    }
    &:first-child {
      ${fontBold}
    }
  }
`;

function ReservationUnitAccessTypeList({
  accessTypes,
  reservationUnits,
  pk,
  roundReservationBegin,
  roundReservationEnd,
}: Readonly<{
  accessTypes: Readonly<Pick<ReservationUnitAccessTypeNode, "pk" | "beginDate" | "accessType">[]>;
  reservationUnits: ReservationSeriesTableElem[];
  pk: number | null | undefined;
  roundReservationBegin: Date;
  roundReservationEnd: Date;
}>) {
  const { t, i18n } = useTranslation();
  const locale = getLocalizationLang(i18n.language);
  if (!accessTypes || accessTypes.length === 0 || !pk) {
    return null;
  }
  const reservationUnit = reservationUnits.find((rU) => rU.reservationUnit.pk === pk);

  return (
    <ModalAccessInfo>
      <AccessTypeList>
        <li>
          <span>{`${t("reservationUnit:accessType")}:`}</span>
          <span>{`${t("common:validity")}:`}</span>
        </li>
        {getReservationUnitAccessPeriods(accessTypes)
          .filter(
            // Filter out access periods which end before the season starts, or start after the season has ended
            (accessTypePeriod) =>
              (!accessTypePeriod.endDate || isBefore(roundReservationBegin, accessTypePeriod.endDate)) &&
              isBefore(accessTypePeriod.beginDate, roundReservationEnd)
          )
          .map((period) => {
            // If an access period starts before the season show the season's start as the access period begin date
            const periodBeginDate = isBefore(period.beginDate, roundReservationBegin)
              ? roundReservationBegin
              : period.beginDate;
            // If an access period ends after the season (or doesn't end) show the season's end as the access period end date
            const periodEndDate =
              !period.endDate || isBefore(roundReservationEnd, period.endDate) ? roundReservationEnd : period.endDate;
            return (
              <li key={period.pk}>
                <span>
                  {t(`reservationUnit:accessTypes.${period.accessType}`) +
                    (period.accessType === AccessType.AccessCode && reservationUnit?.pindoraInfo?.accessCode
                      ? ` (${reservationUnit?.pindoraInfo?.accessCode})`
                      : "")}
                </span>
                <span>{formatDateRange(periodBeginDate, periodEndDate, { includeWeekday: false, locale })}</span>
              </li>
            );
          })}
      </AccessTypeList>
    </ModalAccessInfo>
  );
}

function getReservationSeriesAccessText(reservationUnit: ReservationSeriesTableElem, t: TFunction) {
  const { accessType, usedAccessTypes, pindoraInfo } = reservationUnit;
  if (usedAccessTypes == null || usedAccessTypes.length === 0) {
    return "-";
  }

  switch (accessType) {
    case AccessTypeWithMultivalued.Multivalued:
      if (usedAccessTypes.includes(AccessType.AccessCode)) {
        return `${t("reservationUnit:accessTypes." + AccessType.AccessCode)}: ${accessCodeSafe(pindoraInfo, t)}`;
      } else
        return usedAccessTypes
          .filter((aT) => aT != null && aT !== AccessType.Unrestricted)
          .map((aT) => t(`reservationUnit:accessTypes.${aT}`))
          .join(" / ");
    case AccessTypeWithMultivalued.AccessCode:
      return `${t("reservationUnit:accessTypes." + accessType)}: ${accessCodeSafe(pindoraInfo, t)}`;
    default:
      return t(`reservationUnit:accessTypes.${accessType}`);
  }
}

type ReservationsTableElem = {
  date: Date;
  dayOfWeek: string;
  time: string;
  reservationUnit: Omit<
    ApplicationSectionReservationUnitFragment,
    "reservationCancelledInstructionsFi" | "reservationCancelledInstructionsEn" | "reservationCancelledInstructionsSv"
  >;
  accessType?: Maybe<AccessType>;
  accessTypeChanged?: boolean;
  accessCodeTime?: string | null;
  pindoraInfo?: PindoraReservationFragment | null;
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
    ApplicationSectionReservationUnitFragment,
    "nameSv" | "nameFi" | "nameEn" | "id" | "pk" | "unit"
  >;
}): JSX.Element {
  const { pk } = reservationUnit;
  const name = getTranslationSafe(reservationUnit, "name", lang);
  const unit = reservationUnit.unit ? `, ${getTranslationSafe(reservationUnit.unit, "name", lang)}` : "";
  if (pk == null || pk <= 0) {
    return (
      <span>
        {name}
        {unit}
      </span>
    );
  }
  return (
    <ReservationUnitLink
      href={getReservationUnitPath(pk)}
      label={name + unit}
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

const StyledTooltip = styled(Tooltip)`
  position: absolute;
  top: 0;
  right: calc(var(--spacing-l) * -1);
`;

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
      transform: ({ pk, date, dayOfWeek, isCancellableReason }: ReservationsTableElem) => {
        const isDisabled = isCancellableReason !== "";
        const items = [
          {
            name: t("common:cancel"),
            onClick: () => handleCancel(pk),
            disabled: isDisabled,
          },
        ] as const;

        return (
          <Flex $direction="row" $gap="2-xs" $justifyContent="space-between" $width="full">
            <span style={{ position: "relative" }} aria-label={t("common:dateLabel")}>
              <span>{formatDate(date)}</span>
              <OnlyForMobile>
                {/* span removes whitespace */}
                <pre style={{ display: "inline" }}>{" - "}</pre>
                <span>{dayOfWeek}</span>
              </OnlyForMobile>
            </span>
            {!isDisabled && <PopupMenu items={items} className="popover-menu-toggle hide-on-desktop" />}
          </Flex>
        );
      },
    },
    {
      key: "dayOfWeek",
      headerName: t("common:day"),
      isSortable: false,
      transform: ({ dayOfWeek }: ReservationsTableElem) => (
        <IconTextWrapper className="hide-on-mobile">{dayOfWeek}</IconTextWrapper>
      ),
    },
    {
      key: "time",
      headerName: t("common:timeLabel"),
      isSortable: false,
      transform: ({ dayOfWeek, time, accessCodeTime }: ReservationsTableElem) => (
        <IconTextWrapper aria-label={t("common:timeLabel")}>
          <IconClock />
          <OnlyForMobile>{dayOfWeek}</OnlyForMobile>
          {time}
          {accessCodeTime && time !== accessCodeTime && (
            <StyledTooltip>{`${t("reservations:accessCodeDuration")}: ${accessCodeTime}`}</StyledTooltip>
          )}
        </IconTextWrapper>
      ),
    },
    {
      key: "reservationUnit",
      headerName: t("application:view.reservationsTab.reservationUnit"),
      isSortable: false,
      transform: (elem: ReservationsTableElem) => (
        <IconTextWrapper className="last-on-mobile" aria-label={t("application:view.reservationsTab.reservationUnit")}>
          <IconLocation />
          {createReservationUnitLink({
            reservationUnit: elem.reservationUnit,
            lang,
          })}
        </IconTextWrapper>
      ),
    },
    {
      key: "accessTypes",
      headerName: reservations.some((r) => r.accessType != null) ? t("reservationUnit:accessType") : "",
      isSortable: false,
      transform: (elem: ReservationsTableElem) => {
        if (elem.accessType == null) {
          return "";
        }
        return (
          <IconTextWrapper>
            {t(`reservationUnit:accessTypes.${elem.accessType}`)}
            {elem.accessTypeChanged && <StyledTooltip>{t("reservations:accessTypeChanged")}</StyledTooltip>}
          </IconTextWrapper>
        );
      },
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
            isCancellableReason === "" ? t("common:cancel") : t(`reservations:modifyTimeReasons.${isCancellableReason}`)
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

function sectionToreservations(t: TFunction, section: ApplicationSectionReservationFragment): ReservationsTableElem[] {
  const reservationSeries = filterNonNullable(
    section.reservationUnitOptions.flatMap((ruo) =>
      ruo.allocatedTimeSlots.map((ats) =>
        ats.reservationSeries != null
          ? {
              ...ats.reservationSeries,
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

  function getRejected(r: (typeof reservationSeries)[0]): ReservationsTableElem[] {
    return r.rejectedOccurrences.map((res) => {
      const reservation = { beginsAt: res.beginDatetime, endsAt: res.endDatetime };
      const rest = applicationReservationDateTime({ t, reservation });
      return {
        ...rest,
        reservationUnit: r.reservationUnit,
        status: "rejected",
        isCancellableReason: "ALREADY_CANCELLED",
        pk: 0,
      };
    });
  }

  function getAccessCodeValidThru(pindoraInfo: PindoraReservationFragment | undefined | null) {
    if (!pindoraInfo) {
      return null;
    }
    return {
      beginsAt: pindoraInfo.accessCodeBeginsAt,
      endsAt: pindoraInfo.accessCodeEndsAt,
    };
  }

  function getReservations(r: (typeof reservationSeries)[0]): ReservationsTableElem[] {
    return r.reservations.reduce<ReservationsTableElem[]>((acc, res, idx, ar) => {
      const { isModified, ...rest } = applicationReservationDateTime({
        t,
        reservation: res,
        orig: r.allocatedTimeSlot,
      });
      const status = getReservationStatusChoice(res.state, isModified);
      const accessTypeChanged = idx !== 0 && res.accessType !== ar[idx - 1]?.accessType;
      const accessCodeValidThru = getAccessCodeValidThru(res.pindoraInfo);
      const accessCodeTime =
        accessCodeValidThru != null
          ? applicationReservationDateTime({ t, reservation: accessCodeValidThru }).time
          : null;
      const reservationTableElem: ReservationsTableElem = {
        ...rest,
        reservationUnit: r.reservationUnit,
        status,
        isCancellableReason: isReservationCancellableReason(res),
        pk: res.pk ?? 0,
        accessType: res.accessType,
        accessTypeChanged,
        accessCodeTime,
      };
      return [...acc, reservationTableElem];
    }, []);
  }

  return (
    reservationSeries
      .reduce<ReservationsTableElem[]>((acc, r) => {
        const rejected = getRejected(r);
        const expanded: ReservationsTableElem[] = getReservations(r);
        return [...acc, ...expanded, ...rejected];
      }, [])
      // NOTE have to sort here because we are combining two lists
      .sort((a, b) => a.date.getTime() - b.date.getTime())
  );
}

function sectionToReservationUnits(t: TFunction, section: ApplicationSectionT): ReservationSeriesTableElem[] {
  const reservationUnitsByDay = filterNonNullable(
    section.reservationUnitOptions
      .map((ruo) => ruo.allocatedTimeSlots.map((ats) => ats))
      .flat()
      .map((ats) => {
        const { reservationSeries: r, dayOfTheWeek } = ats;
        if (r == null) {
          return null;
        }
        const { reservationUnit } = r;
        const day = convertWeekday(dayOfTheWeek);
        return {
          reservationUnit,
          // NOTE monday first for sorting
          day,
          reservationSeries: r,
          time: formatApiTimeInterval(r),
        };
      })
  );
  return sort(reservationUnitsByDay, (a, b) => a.day - b.day).map((x) => {
    const { reservationUnit, day, time, reservationSeries } = x;
    return {
      reservationUnit,
      // NOTE our translations are sunday first
      dateOfWeek: t(`weekDayLong.${setMondayFirst(day)}`),
      time,
      accessType: reservationSeries.accessType,
      usedAccessTypes: filterNonNullable(reservationSeries.usedAccessTypes),
      pindoraInfo: reservationSeries.pindoraInfo,
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
      <H3 $noMargin>{t("application:view.reservationsTab.reservationsTitle")}</H3>
      <ReservationsTable reservations={reservations} application={application} />
    </>
  );
}

export function ApplicationSection({
  applicationSection,
  application,
  applicationRound,
}: Readonly<{
  applicationSection: ApplicationSectionT;
  application: Pick<ApplicationT, "pk">;
  applicationRound: ApplicationRoundT;
}>) {
  const { t } = useTranslation();

  const reservationUnits: ReservationSeriesTableElem[] = sectionToReservationUnits(t, applicationSection);
  const reservations = sectionToreservations(t, applicationSection)
    // NOTE we need to slice even if backend returns only 20 of each
    // because we want to keep the total at 20
    .slice(0, N_RESERVATIONS_TO_SHOW);

  return (
    <Flex>
      <div>
        <MarginHeader>{t("application:view.reservationsTab.reservationUnitsTitle")}</MarginHeader>
        <ReservationSeriesTable reservationUnits={reservationUnits} applicationRound={applicationRound} />
        <MarginHeader>{t("application:view.reservationsTab.reservationsTitle")}</MarginHeader>
        <ReservationsTable reservations={reservations} application={application} />
      </div>
      <ButtonContainer $justifyContent="center">
        <ButtonLikeLink
          href={getApplicationSectionPath(applicationSection.pk, application.pk)}
          target="_blank"
          rel="noopener noreferrer"
        >
          {t("application:view.reservationsTab.showAllReservations")}
          <IconLinkExternal />
        </ButtonLikeLink>
        <ButtonLikeLink href={getApplicationSectionPath(applicationSection.pk, application.pk, "cancel")}>
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
    pindoraInfo {
      ...PindoraSection
    }
    reservationUnitOptions {
      id
      allocatedTimeSlots {
        id
        dayOfTheWeek
        beginTime
        endTime
        reservationSeries {
          id
          pk
          beginTime
          endTime
          weekdays
          accessType
          usedAccessTypes
          pindoraInfo {
            ...PindoraSeries
          }
          reservationUnit {
            ...ApplicationSectionReservationUnit
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
          reservations(orderBy: [beginsAtAsc], beginDate: $beginDate) {
            id
            pk
            endsAt
            state
            ...CanUserCancelReservation
            accessType
            accessCodeIsActive
            pindoraInfo {
              ...PindoraReservation
            }
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

export const APPLICATION_SECTION_RESERVATION_UNIT_FRAGMENT = gql`
  fragment ApplicationSectionReservationUnit on ReservationUnitNode {
    nameFi
    nameSv
    nameEn
    id
    pk
    unit {
      id
      nameFi
      nameSv
      nameEn
    }
    reservationCancelledInstructionsFi
    reservationCancelledInstructionsSv
    reservationCancelledInstructionsEn
    accessTypes {
      id
      pk
      accessType
      beginDate
    }
    currentAccessType
  }
`;
