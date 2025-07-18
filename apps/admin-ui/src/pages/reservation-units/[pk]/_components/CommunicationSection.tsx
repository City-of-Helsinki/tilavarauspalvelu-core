import React from "react";
import styled from "styled-components";
import { useTranslation } from "next-i18next";
import { type UseFormReturn } from "react-hook-form";
import { TextInput } from "hds-react";
import type { ReservationUnitEditFormValues } from "./form";
import { EditAccordion } from "./styled";
import { ControlledRichTextInput } from "./ControlledRichTextInput";
import { getTranslatedTooltipTex } from "./utils";
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

export function CommunicationSection({ form }: { form: UseFormReturn<ReservationUnitEditFormValues> }) {
  const { t } = useTranslation();
  const { control, register } = form;

  // NOTE no required fields
  return (
    <EditAccordion heading={t("reservationUnitEditor:communication")}>
      <Flex>
        <H4 $noMargin>{t("reservationUnitEditor:pendingInstructions")}</H4>
        {(
          [
            "reservationPendingInstructionsFi",
            "reservationPendingInstructionsEn",
            "reservationPendingInstructionsSv",
          ] as const
        ).map((n) => (
          <ControlledRichTextInput control={control} fieldName={n} key={n} />
        ))}
        <H4 $noMargin>{t("reservationUnitEditor:confirmedInstructions")}</H4>
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
          heading={t("reservationUnitEditor:cancelledSubAccordion")}
          headingLevel="h3"
        >
          <H4 $noMargin>{t("reservationUnitEditor:cancelledInstructions")}</H4>
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
          label={t("reservationUnitEditor:contactInformationLabel")}
          helperText={t("reservationUnitEditor:contactInformationHelperText")}
          tooltipText={getTranslatedTooltipTex(t, "contactInformation")}
        />
      </Flex>
    </EditAccordion>
  );
}
