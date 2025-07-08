import React from "react";
import styled from "styled-components";
import { Checkbox } from "hds-react";
import { useTranslation } from "next-i18next";
import { useSearchParams } from "next/navigation";
import { useSetSearchParams } from "@/hooks/useSetSearchParams";

// "&& > *" needed to position the checkbox and label correctly in the grid block
const CenteredCheckbox = styled(Checkbox)`
  display: grid;
  height: 84px;
  && > * {
    top: var(--spacing-m);
  }
`;

export function CheckboxFilter({ name }: { name: string }) {
  const searchParams = useSearchParams();
  const setParams = useSetSearchParams();
  const { t } = useTranslation();
  const handleChange = (val: boolean) => {
    const params = new URLSearchParams(searchParams);
    if (val) {
      params.set(name, "true");
    } else {
      params.delete(name);
    }
    setParams(params);
  };

  return (
    <CenteredCheckbox
      id={name}
      label={t(`filters:label.${name}`)}
      onChange={(e) => handleChange(e.target.checked)}
      checked={searchParams.has(name)}
    />
  );
}
