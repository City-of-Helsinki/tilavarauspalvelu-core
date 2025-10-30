import React from "react";
import { Button, ButtonSize, ButtonVariant, IconArrowLeft, IconArrowRight } from "hds-react";
import { useTranslation } from "next-i18next";
import { useRouter } from "next/router";
import { useFormContext } from "react-hook-form";
import { type ApplicationPage2Query } from "@gql/gql-types";
import { filterNonNullable } from "ui/src/modules/helpers";
import { convertLanguageCode, getTranslationSafe } from "ui/src/modules/util";
import { ButtonContainer } from "ui/src/styled";
import { AccordionWithState as Accordion } from "@/components/Accordion";
import { getApplicationPath } from "@/modules/urls";
import { type ApplicationPage2FormValues } from "./form";
import { TimeSelectorForm } from ".";

type Node = NonNullable<ApplicationPage2Query["application"]>;
type Props = {
  application: Pick<Node, "applicationSections" | "pk">;
  onNext: (appToSave: ApplicationPage2FormValues) => void;
};

export function Page2({ application, onNext }: Props): JSX.Element {
  const { t } = useTranslation();
  const router = useRouter();
  const { watch, handleSubmit, formState } = useFormContext<ApplicationPage2FormValues>();

  const applicationSections = filterNonNullable(watch("applicationSections"));

  const onBack = () => router.push(getApplicationPath(application.pk, "page1"));

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
          onClick={onBack}
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

  const selectedReservationUnitPk = watch(`applicationSections.${sectionIndex}.reservationUnitPk`);
  const reservationUnitOpeningHours =
    allOpeningHours?.find((n) => n.pk === selectedReservationUnitPk)?.openingHours ?? [];

  const reservationUnitOptions = filterNonNullable(section?.reservationUnitOptions)
    .map((n) => n.reservationUnit)
    .map((n) => ({
      value: n?.pk ?? 0,
      label: `${n.unit && getTranslationSafe(n.unit, "name", language) + ": "}${getTranslationSafe(n, "name", language)}`,
    }));

  const aes = watch(`applicationSections.${sectionIndex}`);

  return (
    <Accordion
      open={sectionIndex === 0}
      key={aes.pk}
      id={`timeSelector-${sectionIndex}`}
      heading={aes.name}
      theme="thin"
    >
      <TimeSelectorForm
        index={sectionIndex}
        reservationUnitOptions={reservationUnitOptions}
        reservationUnitOpeningHours={reservationUnitOpeningHours}
      />
    </Accordion>
  );
}
