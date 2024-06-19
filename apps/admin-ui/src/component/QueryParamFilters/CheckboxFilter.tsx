import styled from "styled-components";
import {Checkbox} from "hds-react";
import {useSearchParams} from "react-router-dom";
import {useTranslation} from "react-i18next";
import React from "react";

// "&& > *" needed to position the checkbox and label correctly in the grid block
// eslint-disable no-duplicate-selectors
const CenteredCheckbox = styled(Checkbox)`
  display: grid;
  height: 84px;
  && > * {
    top: var(--spacing-m);
  }
`;
// eslint-enable no-duplicate-selectors

export function CheckboxFilter({ name }: { name: string }) {
  const [searchParams, setParams] = useSearchParams();
  const { t } = useTranslation();
  const handleChange = (val: boolean) => {
    const params = new URLSearchParams(searchParams);
    if (val) {
      params.set(name, "true");
      setParams(params, { replace: true });
    } else {
      params.delete(name);
      setParams(params, { replace: true });
    }
  };
  return (
    <CenteredCheckbox
      id={name}
      label={t(`filters.label.${name}`)}
      onChange={(e) => handleChange(e.target.checked)}
      checked={searchParams.has(name)}
    />
  );
}
