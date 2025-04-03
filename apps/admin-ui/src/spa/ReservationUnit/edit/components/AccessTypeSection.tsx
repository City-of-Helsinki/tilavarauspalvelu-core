import { UseFormReturn } from "react-hook-form";
import {
  AccessTypes,
  ReservationUnitEditFormValues,
} from "@/spa/ReservationUnit/edit/form";
import { useTranslation } from "next-i18next";
import { EditAccordion } from "@/spa/ReservationUnit/edit/components/styled";
import { Flex } from "common/styles/util";
import { H6 } from "common";
import React from "react";
import styled from "styled-components";
import { ControlledSelect } from "common/src/components/form";

import { KVWrapper, Label, Value } from "@/styles/util";
import StatusLabel from "common/src/components/StatusLabel";

const CurrentAccessTypeContainer = styled(Flex)`
  background-color: var(--color-black-5);
  padding: var(--spacing-m);
  gap: var(--spacing-s);
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
`;

const WidthLimitedContainer = styled(Flex)`
  max-width: calc(var(--tilavaraus-page-max-width) * 0.6);
`;

function CurrentAccessType() {
  const { t } = useTranslation();

  return (
    <>
      <H6 $marginBottom={"none"}>{t("accessType:validity.currentlyActive")}</H6>
      <CurrentAccessTypeContainer>
        <KVWrapper>
          <Label>{t("accessType:accessTypeLabel")}:</Label>
          <Value>TODO</Value>
        </KVWrapper>
        <KVWrapper>
          <Label>{t("accessType:validity.activeFrom")}:</Label>
          <Value>TODO</Value>
        </KVWrapper>
        <StatusLabel type={"success"}>
          {t(`accessType:status.active`)}
        </StatusLabel>
      </CurrentAccessTypeContainer>
    </>
  );
}

export function AccessTypeSection({
  form,
}: {
  form: UseFormReturn<ReservationUnitEditFormValues>;
}) {
  const { t } = useTranslation();
  const { control } = form;

  const AccessTypeOptions = AccessTypes.map((n) => {
    return {
      value: n,
      label: n,
    };
  });

  return (
    <EditAccordion heading={t("accessType:accessTypeLabel")}>
      <WidthLimitedContainer>
        <CurrentAccessType />
        <ControlledSelect
          control={control}
          name="reservationUnitType"
          required
          label={t(`ReservationUnitEditor.label.reservationUnitType`)}
          options={AccessTypeOptions}
        />
      </WidthLimitedContainer>
    </EditAccordion>
  );
}
