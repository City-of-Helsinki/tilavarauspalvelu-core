import React, { useState } from "react";
import { useFormContext } from "react-hook-form";
import {
  Button,
  ButtonSize,
  ButtonVariant,
  IconArrowLeft,
  IconArrowRight,
  Notification,
  NotificationSize,
} from "hds-react";
import { useTranslation } from "next-i18next/pages";
import { useRouter } from "next/router";
import { filterNonNullable, getLocalizationLang, getTranslation } from "ui/src/modules/helpers";
import { ButtonContainer } from "ui/src/styled";
import type { ApplicationPage2Query, TimeSelectorFragment } from "@gql/gql-types";
import { Accordion } from "@/components/Accordion";
import { TimeSelectorForm } from "@/components/application/funnel/TimeSelector";
import { getApplicationPath } from "@/modules/urls";
import { ApplicationSectionSummary } from "./ApplicationSectionSummary";
import { convertApplicationSectionPage1, getSectionsOpeningHours } from "./form";
import type { ApplicationPage2FormValues } from "./form";
import { TimesErrorSummary } from "./TimesErrorSummary";

type Node = NonNullable<ApplicationPage2Query["application"]>;

const getSectionId = (index: number) => `timeSelector-${index}`;

type Props = {
  application: Pick<Node, "applicationSections" | "pk">;
  onNext: (appToSave: ApplicationPage2FormValues) => void;
};

export function Page2({ application, onNext }: Props): React.ReactElement {
  const { t } = useTranslation();
  const router = useRouter();
  const { watch, handleSubmit, formState } = useFormContext<ApplicationPage2FormValues>();

  const applicationSections = filterNonNullable(watch("applicationSections"));

  const onBack = () => router.push(getApplicationPath(application.pk, "page1"));

  // A time can be applied for in a section when any of its reservation units is open then.
  const allSectionsOpeningHours = getSectionsOpeningHours(application.applicationSections ?? []);

  const { isSubmitting, isValid } = formState;
  const enableSubmit = !isSubmitting && isValid;

  // Kept here rather than in each accordion, so that the error summary can open the section it links to.
  const [openSections, setOpenSections] = useState<ReadonlySet<number>>(() => new Set([0]));
  const toggleSection = (index: number) =>
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (!next.delete(index)) {
        next.add(index);
      }
      return next;
    });
  const showSection = (index: number) => {
    setOpenSections((prev) => new Set(prev).add(index));
    // The heading is shown whether the section is open or not, so it can take the focus right away.
    const heading = document.querySelector<HTMLButtonElement>(`#${getSectionId(index)} button`);
    heading?.scrollIntoView({ behavior: "smooth", block: "start" });
    heading?.focus({ preventScroll: true });
  };

  return (
    <form noValidate onSubmit={handleSubmit(onNext)}>
      <Notification label={t("application:Page2.info")} size={NotificationSize.Small} type="info">
        {t("application:Page2.info")}
      </Notification>
      {applicationSections.map((section, index) =>
        application?.applicationSections?.[index] != null ? (
          <ApplicationSectionTimePicker
            key={section.pk}
            index={index}
            section={application?.applicationSections[index]}
            allSectionsOpeningHours={allSectionsOpeningHours}
            isOpen={openSections.has(index)}
            onToggle={() => toggleSection(index)}
          />
        ) : null
      )}
      <TimesErrorSummary
        allSectionsOpeningHours={allSectionsOpeningHours}
        onShowSection={showSection}
        getSectionId={getSectionId}
      />
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
  allSectionsOpeningHours,
  isOpen,
  onToggle,
}: {
  index: number;
  section: NonNullable<Node["applicationSections"]>[0] | undefined;
  allSectionsOpeningHours: ReadonlyArray<Readonly<TimeSelectorFragment[]>>;
  isOpen: boolean;
  onToggle: () => void;
}): React.ReactElement {
  const { watch } = useFormContext<ApplicationPage2FormValues>();

  const { i18n } = useTranslation();
  const language = getLocalizationLang(i18n.language);

  const allOpeningHours = section?.reservationUnitOptions.map((ruo) => ({
    pk: ruo.reservationUnit.pk ?? 0,
    openingHours: ruo.reservationUnit.applicationRoundTimeSlots,
  }));

  const selectedReservationUnitPk = watch(`applicationSections.${sectionIndex}.reservationUnitPk`);
  const reservationUnitOpeningHours =
    allOpeningHours?.find((n) => n.pk === selectedReservationUnitPk)?.openingHours ?? [];
  const sectionOpeningHours = allSectionsOpeningHours[sectionIndex] ?? [];

  const reservationUnitOptions = filterNonNullable(section?.reservationUnitOptions)
    .map((n) => n.reservationUnit)
    .map((n) => ({
      value: n?.pk ?? 0,
      label: `${n.unit && getTranslation(n.unit, "name", language) + ": "}${getTranslation(n, "name", language)}`,
    }));

  const aes = watch(`applicationSections.${sectionIndex}`);

  return (
    <Accordion
      open={isOpen}
      onToggle={onToggle}
      key={aes.pk}
      id={getSectionId(sectionIndex)}
      heading={aes.name}
      theme="thin"
    >
      {/* Show the page 1 answers so the user does not need to go back to check them */}
      {section != null && (
        <ApplicationSectionSummary applicationSection={convertApplicationSectionPage1(section)} name={section.name} />
      )}
      <TimeSelectorForm
        index={sectionIndex}
        reservationUnitOptions={reservationUnitOptions}
        reservationUnitOpeningHours={reservationUnitOpeningHours}
        sectionOpeningHours={sectionOpeningHours}
        allSectionsOpeningHours={allSectionsOpeningHours}
      />
    </Accordion>
  );
}
