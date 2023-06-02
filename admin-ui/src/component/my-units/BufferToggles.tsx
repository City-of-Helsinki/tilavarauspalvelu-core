import React from "react";
import { Controller, useFormContext } from "react-hook-form";
import { Checkbox } from "hds-react";
import { useTranslation } from "react-i18next";

type BufferControllerProps = {
  name: "bufferTimeBefore" | "bufferTimeAfter";
  seconds: number;
};
const BufferController = ({ name, seconds }: BufferControllerProps) => {
  const { t } = useTranslation();

  const { control, setValue } = useFormContext();

  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <Checkbox
          id={name}
          checked={String(field.value) === "true"}
          label={t(`reservationApplication:${name}`, {
            minutes: seconds / 60,
          })}
          {...field}
          value={String(field.value)}
          onChange={() => {
            setValue(name, !field.value);
          }}
        />
      )}
    />
  );
};

const BufferToggles = ({
  before,
  after,
}: {
  before?: number;
  after?: number;
}) => {
  return (
    <>
      {before && <BufferController name="bufferTimeBefore" seconds={before} />}
      {after && <BufferController name="bufferTimeAfter" seconds={after} />}
    </>
  );
};

export default BufferToggles;
