import React from "react";
import {
  Button,
  ButtonSize,
  ButtonVariant,
  IconArrowLeft,
  IconArrowRight,
} from "hds-react";
import { useTranslation } from "next-i18next";
import { useRouter } from "next/router";
import { useFormContext } from "react-hook-form";
import { type ApplicationPage2Query } from "@gql/gql-types";
import { filterNonNullable } from "common/src/helpers";
import { type ApplicationPage2FormValues } from "./form";
import {
  convertLanguageCode,
  getTranslationSafe,
} from "common/src/common/util";
import { AccordionWithState as Accordion } from "@/components/Accordion";
import { TimeSelector } from "./TimeSelector";
import { aesToCells } from "./module";
import { ButtonContainer } from "common/styled";
import { getApplicationPath } from "@/modules/urls";

type Node = NonNullable<ApplicationPage2Query["application"]>;
type Props = {
  application: Pick<Node, "applicationSections" | "pk">;
  onNext: (appToSave: ApplicationPage2FormValues) => void;
};

export function Page2({ application, onNext }: Props): JSX.Element {
  const { t } = useTranslation();
  const router = useRouter();
  const { watch, handleSubmit, formState } =
    useFormContext<ApplicationPage2FormValues>();

  const applicationSections = filterNonNullable(watch("applicationSections"));

  const { isSubmitting, isValid } = formState;
  const enableSubmit = !isSubmitting && isValid;

  return (
    <form noValidate onSubmit={handleSubmit(onNext)}>
      {applicationSections.map((section, index) =>
        application?.applicationSections?.[index] != null ? (
          <ApplicationSectionTimePicker
            key={section.pk}
            index={index}
            section={application?.applicationSections[index]}
          />
        ) : null
      )}
      <ButtonContainer>
        <Button
          variant={ButtonVariant.Secondary}
          size={ButtonSize.Small}
          onClick={() =>
            router.push(getApplicationPath(application.pk, "page1"))
          }
          iconStart={<IconArrowLeft />}
        >
          {t("common:prev")}
        </Button>
        <Button
          id="button__application--next"
          iconEnd={<IconArrowRight />}
          size={ButtonSize.Small}
          disabled={!enableSubmit}
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
  section: NonNullable<Node["applicationSections"]>[0] | undefined;
}): JSX.Element {
  const { watch } = useFormContext<ApplicationPage2FormValues>();

  const { i18n } = useTranslation();
  const language = convertLanguageCode(i18n.language);

  const allOpeningHours = section?.reservationUnitOptions.map((ruo) => ({
    pk: ruo.reservationUnit.pk ?? 0,
    openingHours: ruo.reservationUnit.applicationRoundTimeSlots,
  }));

  const selectedReservationUnitPk = watch(
    `applicationSections.${sectionIndex}.reservationUnitPk`
  );
  const reservationUnitOpeningHours =
    allOpeningHours?.find((n) => n.pk === selectedReservationUnitPk)
      ?.openingHours ?? [];

  const reservationUnitOptions = filterNonNullable(
    section?.reservationUnitOptions
  )
    .map((n) => n.reservationUnit)
    .map((n) => ({
      value: n?.pk ?? 0,
      label: `${n.unit && getTranslationSafe(n.unit, "name", language) + ": "}${getTranslationSafe(n, "name", language)}`,
    }));

  const applicationSections = filterNonNullable(watch("applicationSections"));
  const selectorData = applicationSections.map((ae) =>
    aesToCells(ae.suitableTimeRanges, reservationUnitOpeningHours)
  );
  const aes = watch(`applicationSections.${sectionIndex}`);

  return (
    <Accordion
      open={sectionIndex === 0}
      key={aes.pk}
      id={`timeSelector-${sectionIndex}`}
      heading={aes.name}
      theme="thin"
    >
      <TimeSelector
        index={sectionIndex}
        cells={selectorData[sectionIndex] ?? []}
        reservationUnitOptions={reservationUnitOptions}
        reservationUnitOpeningHours={reservationUnitOpeningHours}
      />
    </Accordion>
  );
}
