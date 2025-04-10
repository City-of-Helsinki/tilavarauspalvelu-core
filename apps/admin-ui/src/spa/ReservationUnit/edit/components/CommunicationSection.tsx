import { UseFormReturn } from "react-hook-form";
import type { ReservationUnitEditFormValues } from "@/spa/ReservationUnit/edit/form";
import { useTranslation } from "next-i18next";
import { EditAccordion } from "@/spa/ReservationUnit/edit/components/styled";
import { ControlledRichTextInput } from "@/spa/ReservationUnit/edit/components/ControlledRichTextInput";
import { TextInput } from "hds-react";
import { getTranslatedTooltipTex } from "@/spa/ReservationUnit/edit/utils";
import React from "react";
import styled from "styled-components";
import { Flex, fontMedium, H4 } from "common/styled";

const SubAccordion = styled(EditAccordion)`
  border-bottom: none !important;

  & {
    --header-font-size: var(--fontsize-heading-xs);

    h3 {
      color: var(--color-bus);
    }
  }

  > div:nth-of-type(1) > div {
    display: flex;
    flex-direction: row;

    > div {
      font-size: var(--fontsize-heading-xxs);
      ${fontMedium};
      color: var(--color-bus);
      line-height: 1.5;
    }

    svg {
      margin: 0;
      color: var(--color-bus);
    }
  }
`;

export function CommunicationSection({
  form,
}: {
  form: UseFormReturn<ReservationUnitEditFormValues>;
}) {
  const { t } = useTranslation();
  const { control, register } = form;

  // NOTE no required fields
  return (
    <EditAccordion heading={t("ReservationUnitEditor.communication")}>
      <Flex>
        <H4 $noMargin>{t("ReservationUnitEditor.pendingInstructions")}</H4>
        {(
          [
            "reservationPendingInstructionsFi",
            "reservationPendingInstructionsEn",
            "reservationPendingInstructionsSv",
          ] as const
        ).map((n) => (
          <ControlledRichTextInput control={control} fieldName={n} key={n} />
        ))}
        <H4 $noMargin>{t("ReservationUnitEditor.confirmedInstructions")}</H4>
        {(
          [
            "reservationConfirmedInstructionsFi",
            "reservationConfirmedInstructionsEn",
            "reservationConfirmedInstructionsSv",
          ] as const
        ).map((n) => (
          <ControlledRichTextInput control={control} fieldName={n} key={n} />
        ))}
        <SubAccordion
          // don't open there is no errors under this
          heading={t("ReservationUnitEditor.cancelledSubAccordion")}
          headingLevel="h3"
        >
          <H4 $noMargin>{t("ReservationUnitEditor.cancelledInstructions")}</H4>
          {(
            [
              "reservationCancelledInstructionsFi",
              "reservationCancelledInstructionsEn",
              "reservationCancelledInstructionsSv",
            ] as const
          ).map((n) => (
            <ControlledRichTextInput control={control} fieldName={n} key={n} />
          ))}
        </SubAccordion>
        <TextInput
          {...register("contactInformation")}
          id="contactInformation"
          label={t("ReservationUnitEditor.contactInformationLabel")}
          helperText={t("ReservationUnitEditor.contactInformationHelperText")}
          tooltipText={getTranslatedTooltipTex(t, "contactInformation")}
        />
      </Flex>
    </EditAccordion>
  );
}
