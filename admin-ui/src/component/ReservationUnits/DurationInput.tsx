import React, { useEffect, useState } from "react";
import { Select, TextInput } from "hds-react";
import i18next from "i18next";
import styled from "styled-components";
import { convertHMSToSeconds, secondsToHms } from "../../common/util";

const editorDuration = (duration: string): { value: string; unit: Unit } => {
  const seconds = convertHMSToSeconds(duration);
  if (seconds === null) {
    return { value: "0", unit: "min" as Unit };
  }
  let value = Math.round(seconds / 60);
  let unit: Unit = "min";

  if (value > 120) {
    unit = "tun";
    value = Math.round(value / 60);
  }

  return { value: String(value), unit }; // to do be smart amout the unit
};

type Unit = "min" | "tun";

type OptionType = {
  label: string;
  value: Unit;
};

const minOption: OptionType = {
  value: "min",
  label: i18next.t("common.minutesUnitLong_plural"),
};
const hourOption: OptionType = {
  value: "tun",
  label: i18next.t("common.hoursUnitLong_plural"),
};
const unitOptions = [minOption, hourOption];

const Wrapper = styled.div`
  display: flex;
  gap: 1em;
`;

const padStart = (n: number | undefined) =>
  typeof n === "number" ? String(n).padStart(2, "0") : "-";

const toDuration = (value: string, unit: "min" | "tun"): string => {
  const { h, m, s } = secondsToHms(
    Number(value) * (unit === "min" ? 60 : 60 * 60)
  );
  return `${padStart(h)}:${padStart(m)}:${padStart(s)}`;
};

const DurationInput = ({
  id,
  label,
  duration,
  onChange,
  required = false,
}: {
  id: string;
  label: string;
  required?: boolean;
  duration: string;
  onChange: (value: string) => void;
}): JSX.Element => {
  const [unit, setUnit] = useState<Unit>("min");
  const [value, setValue] = useState<string>("");

  useEffect(() => {
    const ed = editorDuration(duration);
    setUnit(ed.unit);
    setValue(ed.value);
  }, [duration]);
  return (
    <div>
      <label htmlFor={id}>
        {label} {required ? "*" : null}
      </label>
      <Wrapper>
        <TextInput
          value={value}
          id={id}
          onChange={(e) => {
            if (Number.isInteger(e.target.value)) {
              onChange(toDuration(e.target.value, unit));
            }
            onChange(toDuration(e.target.value, unit));
          }}
          required
        />
        <Select
          label=""
          options={unitOptions}
          value={unitOptions.find((o) => o.value === unit)}
          id={`${id}.select`}
          onChange={(e: OptionType) => {
            if (Number.isInteger(value)) {
              onChange(toDuration(value, e.value));
            }
          }}
        />
      </Wrapper>
    </div>
  );
};

export default DurationInput;
