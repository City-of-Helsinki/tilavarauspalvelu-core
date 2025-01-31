import React, { useState } from "react";
import {
  Button,
  ButtonVariant,
  IconArrowLeft,
  IconArrowRight,
  Notification,
  NotificationSize,
} from "hds-react";
import { useTranslation } from "next-i18next";
import { useRouter } from "next/router";
import styled from "styled-components";
import { useFormContext } from "react-hook-form";
import { type ApplicationQuery } from "@gql/gql-types";
import { filterNonNullable } from "common/src/helpers";
import type {
  ApplicationSectionFormValue,
  ApplicationFormValues,
} from "./form";
import {
  convertLanguageCode,
  getTranslationSafe,
} from "common/src/common/util";
import { getReadableList } from "@/modules/util";
import { AccordionWithState as Accordion } from "@/components/Accordion";
import { TimeSelector } from "./TimeSelector";
import {
  aesToCells,
  Cell,
  cellsToApplicationEventSchedules,
  convertToSchedule,
} from "./module";
import { errorToast } from "common/src/common/toast";
import { ButtonContainer } from "common/styles/util";
import { getApplicationPath } from "@/modules/urls";

type Node = NonNullable<ApplicationQuery["application"]>;
type Props = {
  application: Node;
  onNext: (appToSave: ApplicationFormValues) => void;
};

const StyledNotification = styled(Notification)`
  margin-top: var(--spacing-m);
`;

function getListOfApplicationEventTitles(
  applicationSections: ApplicationSectionFormValue[],
  ids: number[]
): string {
  return getReadableList(ids.map((id) => `"${applicationSections[id].name}"`));
}
function getLongestChunks(selectorData: Cell[][][]): number[] {
  return selectorData.map((n) => {
    const primarySchedules = cellsToApplicationEventSchedules(
      n.map((nn) => nn.filter((nnn) => nnn.state === 300))
    );
    const secondarySchedules = cellsToApplicationEventSchedules(
      n.map((nn) => nn.filter((nnn) => nnn.state === 200))
    );

    return [...primarySchedules, ...secondarySchedules].reduce((acc, cur) => {
      const start = parseInt(cur.begin, 10);
      const end = cur.end === "00:00" ? 24 : parseInt(cur.end, 10);
      const length = end - start;
      return length > acc ? length : acc;
    }, 0);
  });
}

function getApplicationEventsWhichMinDurationsIsNotFulfilled(
  applicationSections: ApplicationSectionFormValue[]
): number[] {
  const selected = applicationSections.map((ae) =>
    aesToCells(convertToSchedule(ae))
  );
  const selectedHours = getLongestChunks(selected);
  return filterNonNullable(
    applicationSections.map((ae, index) => {
      const minDuration = ae.minDuration ?? 0;
      return selectedHours[index] < minDuration / 3600 ? index : null;
    })
  );
}

export function Page2({ application, onNext }: Props): JSX.Element {
  const { t } = useTranslation();

  const [minDurationMsg, setMinDurationMsg] = useState(true);
  const router = useRouter();
  const { watch, handleSubmit } = useFormContext<ApplicationFormValues>();

  const onSubmit = (data: ApplicationFormValues) => {
    const selectorData = filterNonNullable(data.applicationSections).map((ae) =>
      aesToCells(convertToSchedule(ae))
    );
    // TODO test the checking of that there is at least one primary or secondary
    // TODO this should be a form refinement, but we need separate refinements
    // for pages or a Page specific checker
    const selectedAppEvents = selectorData
      .map((cell) => cellsToApplicationEventSchedules(cell))
      .map((aes) =>
        aes.filter((ae) => ae.priority === 300 || ae.priority === 200)
      )
      .flat();
    if (selectedAppEvents.length === 0) {
      errorToast({
        label: t("application:error.missingSchedule"),
        text: t("application:error.missingSchedule"),
        dataTestId: "application__page2--notification-error",
      });
      return;
    }
    onNext(data);
  };

  const applicationSections = filterNonNullable(watch("applicationSections"));
  const sectionsNotFullfilled: number[] =
    getApplicationEventsWhichMinDurationsIsNotFulfilled(applicationSections);

  const shouldShowMinDurationMessage =
    minDurationMsg && sectionsNotFullfilled.length > 0;

  return (
    <form noValidate onSubmit={handleSubmit(onSubmit)}>
      {applicationSections.map((section, index) =>
        application?.applicationSections?.[index] != null ? (
          <ApplicationSectionTimePicker
            key={section.formKey}
            index={index}
            section={application?.applicationSections[index]}
          />
        ) : null
      )}
      {shouldShowMinDurationMessage && (
        <Notification
          type="alert"
          label={t("application:Page2.notification.minDuration.title")}
          dismissible
          onClose={() => setMinDurationMsg(false)}
          closeButtonLabelText={t("common:close")}
          data-testid="application__page2--notification-min-duration"
          style={{ marginBottom: "var(--spacing-m)" }}
        >
          {applicationSections.length === 1
            ? t("application:Page2.notification.minDuration.bodySingle")
            : t("application:Page2.notification.minDuration.body", {
                title: getListOfApplicationEventTitles(
                  applicationSections,
                  sectionsNotFullfilled
                ),
                count: sectionsNotFullfilled.length,
              })}
        </Notification>
      )}
      <ButtonContainer>
        <Button
          variant={ButtonVariant.Secondary}
          onClick={() =>
            router.push(getApplicationPath(application.pk, "page1"))
          }
          iconStart={<IconArrowLeft />}
        >
          {t("common:prev")}
        </Button>
        <Button
          id="button__application--next"
          iconEnd={<IconArrowRight aria-hidden="true" />}
          type="submit"
        >
          {t("common:next")}
        </Button>
      </ButtonContainer>
    </form>
  );
}

function ApplicationSectionTimePicker({
  index: sectionIndex,
  section,
}: {
  index: number;
  section: NonNullable<Node["applicationSections"]>[0];
}): JSX.Element {
  const { watch } = useFormContext<ApplicationFormValues>();

  const { t, i18n } = useTranslation();
  const language = convertLanguageCode(i18n.language);

  const allOpeningHours = section.reservationUnitOptions.map((ruo) => ({
    pk: ruo.reservationUnit.pk ?? 0,
    openingHours: ruo.reservationUnit.applicationRoundTimeSlots,
  }));

  const selectedReservationUnitPk = watch(
    `applicationSections.${sectionIndex}.reservationUnitPk`
  );
  const reservationUnitOpeningHours =
    allOpeningHours.find((n) => n.pk === selectedReservationUnitPk)
      ?.openingHours ?? [];

  const reservationUnitOptions = filterNonNullable(
    section.reservationUnitOptions
  )
    .map((n) => n.reservationUnit)
    .map((n) => ({
      value: n?.pk ?? 0,
      label: getTranslationSafe(n, "name", language),
    }));

  const applicationSections = filterNonNullable(watch("applicationSections"));
  const selectorData = applicationSections.map((ae) =>
    aesToCells(convertToSchedule(ae), reservationUnitOpeningHours)
  );

  return (
    <Accordion
      open={sectionIndex === 0}
      key={watch(`applicationSections.${sectionIndex}.pk`) ?? "NEW"}
      id={`timeSelector-${sectionIndex}`}
      heading={watch(`applicationSections.${sectionIndex}.name`) ?? ""}
      theme="thin"
    >
      <StyledNotification
        label={t("application:Page2.info")}
        size={NotificationSize.Small}
        type="info"
      >
        {t("application:Page2.info")}
      </StyledNotification>
      <TimeSelector
        index={sectionIndex}
        cells={selectorData[sectionIndex]}
        reservationUnitOptions={reservationUnitOptions}
        reservationUnitOpeningHours={reservationUnitOpeningHours}
      />
    </Accordion>
  );
}
