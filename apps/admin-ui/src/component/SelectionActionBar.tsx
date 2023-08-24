import { Button, IconArrowRight, IconMenuDots, Select } from "hds-react";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { H2 } from "common/src/common/typography";
import { breakpoints } from "common/src/common/style";
import { OptionType } from "../common/types";
import { truncatedText } from "../styles/typography";

interface IProps {
  selections: number[];
  options: OptionType[];
  callback: (option: string) => void;
  isSaving?: boolean;
}

const Wrapper = styled.div`
  display: flex;
  align-items: center;
  background-color: var(--tilavaraus-admin-blue);
  color: var(--color-white);
  width: 100vw;
  height: 104px;
  position: fixed;
  bottom: 0;
  left: 0;
  z-index: var(--tilavaraus-admin-stack-dialog);

  .content {
    display: flex;
    justify-content: space-between;
    width: 88%;
    padding-left: var(--spacing-m);
  }

  @media (min-width: ${breakpoints.xl}) {
    display: grid;
    grid-template-columns: calc(var(--main-menu-width) + 2.625rem) auto;
  }
`;

const Count = styled(H2).attrs({ $legacy: true })`
  ${truncatedText}
  overflow-y: hidden;
  display: none;
  padding-right: var(--spacing-m);

  @media (min-width: ${breakpoints.s}) {
    display: inline;
  }
`;

const MassActions = styled.div`
  display: flex;
  justify-content: space-between;
  gap: var(--spacing-m);
`;

const MassSelectionOptions = styled(Select).attrs((props) => ({
  ...props,
  style: {
    "--border-color": "var(--color-black-50)",
    "--border-color-focus": "var(--color-black)",
    "--border-color-hover": "var(--color-black)",
  } as React.CSSProperties,
}))`
  button {
    > svg {
      display: none;
    }

    ${truncatedText}
  }

  ul[role="listbox"] {
    bottom: 253px;
    border-top-color: var(--color-black);
    border-bottom-color: var(--color-black-20);
  }

  @media (min-width: ${breakpoints.l}) {
    width: 22rem;

    ul[role="listbox"] {
      bottom: 211px;
    }
  }
`;

const MassSelectSubmit = styled(Button).attrs({
  variant: "primary",
  style: {
    "--background-color": "var(--color-white)",
    "--background-color-disabled": "var(--color-white)",
    "--border-color": "var(--color-black-50)",
    "--border-color-focus": "var(--color-black)",
    "--border-color-hover": "var(--color-black)",
    "--color": "var(--color-black)",
    "--color-disabled": "var(--color-black-20)",
  } as React.CSSProperties,
})`
  & > div {
    margin: 0 !important;
  }

  height: 54px;

  span {
    display: none;
    white-space: nowrap;
  }

  @media (min-width: ${breakpoints.m}) {
    & > div {
      display: none;
    }
    span {
      display: inline;
    }
  }
`;

function SelectionActionBar({
  selections,
  options,
  callback,
  isSaving,
}: IProps): JSX.Element {
  const [massSelectionAction, setMassSelectionAction] =
    useState<OptionType | null>(null);
  const { t } = useTranslation();

  const countStr = t("Application.applicationsSelected", {
    count: selections.length,
  });

  const submitBtnTxt = t("Recommendation.actionMassActionSubmit");

  return (
    <Wrapper>
      <div />
      <div className="content">
        <Count title={countStr}>{countStr}</Count>
        <MassActions>
          <MassSelectionOptions
            label=""
            placeholder={t("common.chooseAction")}
            icon={<IconMenuDots />}
            options={options}
            onChange={(selected: unknown) =>
              setMassSelectionAction(selected as OptionType)
            }
            value={massSelectionAction}
          />
          <MassSelectSubmit
            onClick={() =>
              massSelectionAction?.value &&
              callback(String(massSelectionAction.value))
            }
            disabled={!massSelectionAction || isSaving}
            iconRight={<IconArrowRight />}
            title={submitBtnTxt}
          >
            {submitBtnTxt}
          </MassSelectSubmit>
        </MassActions>
      </div>
    </Wrapper>
  );
}

export default SelectionActionBar;
