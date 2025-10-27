import React from "react";
import styled from "styled-components";
import { useTranslation } from "next-i18next";
import { useFieldArray, UseFormReturn } from "react-hook-form";
import { AccessTypes, type ReservationUnitEditFormValues } from "./form";
import { EditAccordion } from "./styled";
import { ControlledDateInput, ControlledSelect } from "common/src/components/form";
import { formatDate, parseUIDate, parseValidDateObject } from "common/src/modules/date-utils";
import StatusLabel from "common/src/components/StatusLabel";
import { AutoGrid, Flex, H6 } from "common/src/styled";
import { KVWrapper, Label, Value } from "@/styled";
import { Button, ButtonVariant, IconPlus, IconTrash } from "hds-react";
import { AccessType, ReservationUnitEditQuery } from "@gql/gql-types";
import { getTranslatedError } from "@/modules/util";
import { NotificationInline } from "@/components/NotificationInline";

type QueryData = ReservationUnitEditQuery["reservationUnit"];
type Node = NonNullable<QueryData>;

const CurrentAccessTypeContainer = styled(Flex).attrs({
  $gap: "s",
  $alignItems: "center",
  $justifyContent: "space-between",
  $direction: "row",
})`
  background-color: var(--color-black-5);
  padding: var(--spacing-m);
`;

const WidthLimitedContainer = styled(Flex)`
  max-width: calc(var(--tilavaraus-page-max-width) * 0.6);
`;

function CurrentAccessType({ currentAccessType }: { currentAccessType?: Node["accessTypes"][0] }) {
  const { t } = useTranslation();

  const accessType = currentAccessType?.accessType;
  const beginDate = currentAccessType?.beginDate;

  return (
    <div>
      <H6 $marginBottom={"s"}>{t("accessType:validity.currentlyActive")}</H6>
      <CurrentAccessTypeContainer>
        <KVWrapper>
          <Label>{t("accessType:accessTypeLabel")}:</Label>
          <Value>{accessType ? t(`accessType:type.${accessType}`) : "-"}</Value>
        </KVWrapper>
        <KVWrapper>
          <Label>{t("accessType:validity.activeFrom")}:</Label>
          <Value>{beginDate ? formatDate(parseValidDateObject(beginDate)) : "-"}</Value>
        </KVWrapper>
        <StatusLabel type={beginDate ? "success" : "error"}>
          {beginDate ? t(`accessType:status.active`) : t(`accessType:status.inactive`)}
        </StatusLabel>
      </CurrentAccessTypeContainer>
    </div>
  );
}

function AccessTypePart({
  form,
  index,
  removeSelf,
}: {
  form: UseFormReturn<ReservationUnitEditFormValues>;
  index: number;
  removeSelf: () => void;
}) {
  const { t } = useTranslation();
  const {
    control,
    getValues,
    formState: { errors, dirtyFields },
  } = form;

  // Remove ACCESS_CODE option when creating a new reservation unit
  const reservationUnitPk = getValues("pk");
  const accessTypeOptions = AccessTypes.filter(
    (option) => !(reservationUnitPk === 0 && option === AccessType.AccessCode)
  ).map((option) => {
    return {
      value: option,
      label: t(`accessType:type.${option}`),
    };
  });

  const firstAccessType = getValues("accessTypes")[0];
  // Access Type exists and has already begun
  const isAccessTypeStarted =
    firstAccessType?.pk &&
    firstAccessType?.beginDate &&
    (parseUIDate(firstAccessType.beginDate) || new Date()) <= new Date();
  // Only the first access type can be active, and it must have already started.
  const isActiveAccessType = !!(
    index === 0 &&
    isAccessTypeStarted &&
    // If the beginDate is changed to Today, don't recognize it as active until it's saved
    !(dirtyFields.accessTypes && dirtyFields.accessTypes[0]?.beginDate)
  );

  return (
    <AutoGrid>
      <ControlledSelect
        control={control}
        name={`accessTypes.${index}.accessType`}
        required
        label={t(`accessType:accessTypeLabel`)}
        options={accessTypeOptions}
      />
      <ControlledDateInput
        control={control}
        name={`accessTypes.${index}.beginDate`}
        label={t("accessType:validity.activeFrom")}
        error={getTranslatedError(t, errors.accessTypes?.[index]?.beginDate?.message)}
        disabled={isActiveAccessType}
        disableConfirmation
      />
      {!isActiveAccessType && (
        <div style={{ marginTop: "auto" }}>
          <Button variant={ButtonVariant.Secondary} iconStart={<IconTrash />} onClick={removeSelf}>
            {t("common:remove")}
          </Button>
        </div>
      )}
    </AutoGrid>
  );
}

export function AccessTypeSection({
  form,
  accessTypes,
}: {
  form: UseFormReturn<ReservationUnitEditFormValues>;
  accessTypes: Node["accessTypes"];
}) {
  const { t } = useTranslation();
  const {
    control,
    formState: { errors },
  } = form;
  const { fields, append, remove } = useFieldArray({
    control,
    name: "accessTypes",
  });

  const handleAddNewAccessType = () => {
    append({
      accessType: AccessType.Unrestricted,
      beginDate: "",
    });
  };

  return (
    <EditAccordion heading={t("accessType:accessTypeLabel")} open={!!errors?.accessTypes}>
      <WidthLimitedContainer>
        <CurrentAccessType currentAccessType={accessTypes[0]} />

        {errors?.accessTypes && fields.length === 0 && (
          <NotificationInline type="error">
            {getTranslatedError(t, errors?.accessTypes?.message ?? errors?.accessTypes?.root?.message)}
          </NotificationInline>
        )}

        {fields.map((accessType, index) => (
          <AccessTypePart key={`${accessType.id}`} form={form} index={index} removeSelf={() => remove(index)} />
        ))}

        <div style={{ marginTop: "var(--spacing-s)" }}>
          <Button onClick={handleAddNewAccessType} variant={ButtonVariant.Secondary} iconStart={<IconPlus />}>
            {t("accessType:actions.addNewAccessType")}
          </Button>
        </div>
      </WidthLimitedContainer>
    </EditAccordion>
  );
}
