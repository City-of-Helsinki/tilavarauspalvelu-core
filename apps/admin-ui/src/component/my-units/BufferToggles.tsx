import React from "react";
import { Controller, useFormContext } from "react-hook-form";
import { Checkbox, Tooltip } from "hds-react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";

type BufferControllerProps = {
  name: "bufferTimeBefore" | "bufferTimeAfter";
  seconds: number;
};

const BufferController = ({ name, seconds }: BufferControllerProps) => {
  const { t } = useTranslation();

  const { control } = useFormContext();

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
};

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

const BufferToggles = ({
  before,
  after,
}: {
  before: number;
  after: number;
}) => {
  const { t } = useTranslation();
  return (
    <Wrapper>
      <LabelWithTooltip>
        {t("reservationApplication:buffers.label")}
        <Tooltip>{t("reservationApplication:buffers.tooltip")}</Tooltip>
      </LabelWithTooltip>
      {before !== 0 && (
        <BufferController name="bufferTimeBefore" seconds={before} />
      )}
      {after !== 0 && (
        <BufferController name="bufferTimeAfter" seconds={after} />
      )}
    </Wrapper>
  );
};

export default BufferToggles;
