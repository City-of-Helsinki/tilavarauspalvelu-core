import React from "react";
import { Controller, useFormContext } from "react-hook-form";
import { Checkbox, Tooltip } from "hds-react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";

type BufferControllerProps = {
  name: "bufferTimeBefore" | "bufferTimeAfter";
  seconds: number;
  control: ReturnType<typeof useFormContext>["control"];
};

function BufferController({ name, seconds, control }: BufferControllerProps) {
  const { t } = useTranslation();

  return (
    <Controller
      name={name}
      control={control}
      render={({ field: { value, onChange } }) => (
        <Checkbox
          id={name}
          checked={String(value) === "true"}
          label={t(`reservationApplication:buffers.${name}`, {
            minutes: seconds / 60,
          })}
          value={String(value)}
          onChange={() => {
            onChange(!value);
          }}
          style={{ marginTop: 0 }}
        />
      )}
    />
  );
}

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--spacing-s);
`;

const LabelWithTooltip = styled.div`
  display: flex;
  flex-direction: row;
  gap: var(--spacing-xs);
`;

export function BufferToggles({
  before,
  after,
}: {
  before: number;
  after: number;
}) {
  const { t } = useTranslation();
  const { control } = useFormContext();

  if (before === 0 && after === 0) {
    return null;
  }

  return (
    <Wrapper>
      <LabelWithTooltip>
        {t("reservationApplication:buffers.label")}
        <Tooltip>{t("reservationApplication:buffers.tooltip")}</Tooltip>
      </LabelWithTooltip>
      {before !== 0 && (
        <BufferController
          name="bufferTimeBefore"
          control={control}
          seconds={before}
        />
      )}
      {after !== 0 && (
        <BufferController
          name="bufferTimeAfter"
          control={control}
          seconds={after}
        />
      )}
    </Wrapper>
  );
}
