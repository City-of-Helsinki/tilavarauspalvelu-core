import { IconAngleLeft, IconAngleRight, IconCalendarPlus } from "hds-react";
import { camelCase, startCase } from "lodash";
import React, { ChangeEvent, MutableRefObject } from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { breakpoint } from "../../modules/style";
import Checkbox from "./Checkbox";
import DateRangePicker from "./DateRangePicker";

export const testIds = {
  menu: "date-selector-menu",
};

interface Props {
  backBtnRef?: MutableRefObject<HTMLButtonElement | null>;
  customDatesBtnRef?: MutableRefObject<HTMLButtonElement | null>;
  dateTypes: string[];
  dateTypeOptions: string[];
  endDate: Date | null;
  isCustomDate: boolean;
  isOpen: boolean;
  name: string;
  onChangeDateTypes: (value: string[]) => void;
  onChangeEndDate: (date: Date | null) => void;
  onChangeStartDate: (date: Date | null) => void;
  onCloseMenu: () => void;
  startDate: Date | null;
  toggleIsCustomDate: () => void;
}

const Wrapper = styled.div`
  background: var(--color-white);
  color: var(--color-black-90);
  box-shadow: 0px 0px 8px 0px rgba(0, 0, 0, 0.2);
  z-index: 1;
  min-width: fit-content;

  @media (min-width: ${breakpoint.m}) {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
  }
`;

const CheckboxWrapper = styled.div`
  padding: 1rem;

  div {
    margin: 1rem 0;

    &:first-child {
      margin-top: 0;
    }

    &:last-child {
      margin-bottom: 0;
    }
  }
`;

const Btn = styled.button<{ $hidden: boolean }>`
  cursor: pointer;
  background: transparent;
  border: none;
  display: ${({ $hidden }) => ($hidden ? "none" : "flex")};
  width: 100%;
  padding: 1rem;
  align-items: center;

  svg:first-child {
    margin-right: 1rem;
  }

  svg:last-child {
    margin-left: 0.75rem;
  }

  &:focus {
    outline: 2px solid var(--color-black);
    outline-offset: -2px;
  }

  &.selectDates {
    border-top: 1px solid var(--color-silver);
    font-family: var(--font-medium);
    font-weight: 500;
  }

  &.back {
    font-family: var(--font-medium);
    font-weight: 500;
    border-bottom: 1px solid var(--color-silver);

    svg:first-child {
      margin-right: 0.75rem;
    }
  }

  &.close {
    border-top: 1px solid var(--color-silver);

    .buttonText {
      text-align: center;
    }
  }
`;

const BtnText = styled.div`
  flex: 1 1 0%;
  text-align: left;
`;

const CustomDateWrapper = styled.div`
  padding: 1rem;
`;

const DateSelectorMenu = ({
  backBtnRef,
  customDatesBtnRef,
  dateTypes,
  dateTypeOptions,
  endDate,
  isCustomDate,
  isOpen,
  name,
  onChangeDateTypes,
  onChangeEndDate,
  onChangeStartDate,
  onCloseMenu,
  startDate,
  toggleIsCustomDate,
}: Props): JSX.Element => {
  const { t } = useTranslation();

  const handleCheckboxChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (dateTypes.indexOf(event.target.value) !== -1) {
      onChangeDateTypes(
        dateTypes.filter((item) => item !== event.target.value)
      );
    } else {
      onChangeDateTypes([...dateTypes, event.target.value]);
    }
  };

  if (!isOpen) return null;

  return (
    <Wrapper data-testid={testIds.menu}>
      {!isCustomDate && (
        <CheckboxWrapper>
          {dateTypeOptions.map((option) => {
            return (
              <Checkbox
                key={option}
                checked={dateTypes.indexOf(option) !== -1}
                id={`name_${option}`}
                label={t(
                  `dateSelector:dateType${startCase(camelCase(option)).replace(
                    / /g,
                    ""
                  )}`
                )}
                name={name}
                onChange={handleCheckboxChange}
                value={option}
              />
            );
          })}
        </CheckboxWrapper>
      )}

      <Btn
        ref={customDatesBtnRef}
        className="selectDates"
        onClick={toggleIsCustomDate}
        type="button"
        $hidden={isCustomDate}
      >
        <IconCalendarPlus aria-hidden />
        <BtnText>{t("dateSelector:menu.buttonCustom")}</BtnText>
        <IconAngleRight aria-hidden />
      </Btn>

      <Btn
        ref={backBtnRef}
        className="back"
        onClick={toggleIsCustomDate}
        type="button"
        $hidden={!isCustomDate}
      >
        <IconAngleLeft aria-hidden />
        <BtnText>{t("dateSelector:menu.buttonBack")}</BtnText>
      </Btn>

      {isCustomDate && (
        <CustomDateWrapper>
          <DateRangePicker
            endDate={endDate}
            onChangeEndDate={onChangeEndDate}
            onChangeStartDate={onChangeStartDate}
            startDate={startDate}
          />
        </CustomDateWrapper>
      )}
      <Btn
        className="close"
        onClick={onCloseMenu}
        type="button"
        $hidden={isCustomDate}
      >
        <BtnText>{t("dateSelector:menu.buttonClose")}</BtnText>
      </Btn>
    </Wrapper>
  );
};

export default DateSelectorMenu;
