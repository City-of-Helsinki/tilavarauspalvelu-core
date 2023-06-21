import React from "react";
import { Controller, useFormContext } from "react-hook-form";
import { Checkbox } from "hds-react";
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

const BufferToggles = ({
  before,
  after,
}: {
  before?: number;
  after?: number;
}) => {
  const { t } = useTranslation();
  return (
    <Wrapper>
      <div>{t("reservationApplication:buffers.label")}</div>
      {before && <BufferController name="bufferTimeBefore" seconds={before} />}
      {after && <BufferController name="bufferTimeAfter" seconds={after} />}
    </Wrapper>
  );
};

export default BufferToggles;
