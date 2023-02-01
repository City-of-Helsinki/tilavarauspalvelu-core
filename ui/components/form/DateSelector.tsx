import React from "react";
import styled from "styled-components";
import { IconAngleDown, IconAngleUp, IconCalendarClock } from "hds-react";
import { camelCase, startCase } from "lodash";
import { toUIDate } from "common/src/common/util";
import { useTranslation } from "next-i18next";
import { DATE_TYPES } from "../../modules/const";
import DateSelectorMenu from "./DateSelectorMenu";

const dateTypeOptions = [
  DATE_TYPES.TODAY,
  DATE_TYPES.TOMORROW,
  DATE_TYPES.THIS_WEEK,
  DATE_TYPES.WEEKEND,
];

export interface DateSelectorProps {
  dateTypes: string[];
  endDate: Date | null;
  isCustomDate: boolean;
  name: string;
  onChangeDateTypes: (value: string[]) => void;
  onChangeEndDate: (date: Date | null) => void;
  onChangeStartDate: (date: Date | null) => void;
  startDate: Date | null;
  toggleIsCustomDate: () => void;
}

const Wrapper = styled.div`
  position: relative;
  background: var(--color-white);
  box-sizing: border-box;
`;

const Btn = styled.button<{ $isFocused: boolean }>`
  &:focus {
    border-color: var(--color-black-90);
  }
  border: 2px solid
    var(--color-black-${({ $isFocused }) => ($isFocused ? "90" : "50")});
  background: transparent;
  color: var(--color-black);
  min-height: 3.375rem;
  padding: 0 1rem;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
`;

const IconWrapper = styled.div`
  display: flex;
  align-self: center;

  svg {
    margin-right: 1rem;
  }
`;

const Info = styled.div`
  flex: 1 1 0%;
  text-align: left;
  color: var(--color-black);
  position: relative;
  height: 1.25rem;

  div {
    white-space: nowrap;
    overflow: hidden;
    position: absolute;
    left: 0;
    top: 0;
    line-height: 1.25rem;
    right: 0;
    text-overflow: ellipsis;
  }
`;

const ArrowWrapper = styled.div`
  display: flex;
  align-self: center;

  svg {
    margin-left: 0.75rem;
    pointer-events: none;
  }
`;

const DateSelector = ({
  dateTypes,
  endDate,
  isCustomDate,
  name,
  onChangeDateTypes,
  onChangeEndDate,
  onChangeStartDate,
  startDate,
  toggleIsCustomDate,
}: DateSelectorProps): JSX.Element => {
  const { t } = useTranslation();
  const backBtnRef = React.useRef<HTMLButtonElement | null>(null);
  const customDatesBtnRef = React.useRef<HTMLButtonElement | null>(null);
  const dateSelector = React.useRef<HTMLDivElement | null>(null);
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  const ensureMenuIsOpen = React.useCallback(() => {
    if (!isMenuOpen) {
      setIsMenuOpen(true);
    }
  }, [isMenuOpen]);

  const ensureMenuIsClosed = React.useCallback(() => {
    if (isMenuOpen) {
      setIsMenuOpen(false);
    }
  }, [isMenuOpen]);

  const handleDocumentClick = React.useCallback(
    (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const { current } = dateSelector;

      // Close menu when clicking outside of the component
      if (
        !(target instanceof Node && current?.contains(target)) &&
        target?.isConnected
      ) {
        // target might not be part of dom anymore
        ensureMenuIsClosed();
      }
    },
    [ensureMenuIsClosed]
  );

  const isComponentFocused = React.useCallback(() => {
    const active = document.activeElement;
    const { current } = dateSelector;

    return !!(active instanceof Node && current?.contains(active));
  }, [dateSelector]);

  const handleDocumentFocusin = React.useCallback(() => {
    if (!isComponentFocused()) {
      ensureMenuIsClosed();
    }
  }, [ensureMenuIsClosed, isComponentFocused]);

  const handleDocumentKeyDown = React.useCallback(
    (event: KeyboardEvent) => {
      if (!isComponentFocused()) return;

      switch (event.key) {
        case "ArrowUp":
        case "ArrowDown":
          ensureMenuIsOpen();
          event.preventDefault();
          break;
        case "Escape":
          ensureMenuIsClosed();
          event.preventDefault();
          break;
        default:
      }
    },
    [ensureMenuIsClosed, ensureMenuIsOpen, isComponentFocused]
  );

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  React.useLayoutEffect(() => {
    document.addEventListener("click", handleDocumentClick);
    document.addEventListener("keydown", handleDocumentKeyDown);
    document.addEventListener("focusin", handleDocumentFocusin);
    // Clean up event listener to prevent memory leaks
    return () => {
      document.removeEventListener("click", handleDocumentClick);
      document.removeEventListener("keydown", handleDocumentKeyDown);
      document.removeEventListener("focusin", handleDocumentFocusin);
    };
  }, [handleDocumentClick, handleDocumentFocusin, handleDocumentKeyDown]);

  const handleToggleIsCustomDate = () => {
    toggleIsCustomDate();
  };

  const selectedText = React.useMemo(() => {
    if (!!startDate || !!endDate) {
      return `${toUIDate(startDate)} -
            ${toUIDate(endDate)}`;
    }

    const sortDateTypes = (a: string, b: string): number =>
      dateTypeOptions.indexOf(a) < dateTypeOptions.indexOf(b) ? -1 : 1;

    const dateTypeLabels = dateTypes
      .sort(sortDateTypes)
      .map((val) =>
        t(`dateSelector:dateType${startCase(camelCase(val)).replace(/ /g, "")}`)
      );

    if (dateTypeLabels.length > 1) {
      return `${dateTypeLabels[0]} + ${dateTypeLabels.length - 1}`;
    }
    return dateTypeLabels.join();
  }, [dateTypes, endDate, startDate, t]);

  React.useEffect(() => {
    if (isComponentFocused() && !isCustomDate) {
      customDatesBtnRef.current?.focus();
    }
  }, [isComponentFocused, isCustomDate]);

  return (
    <Wrapper ref={dateSelector}>
      <Btn
        aria-haspopup="true"
        aria-expanded={isMenuOpen}
        aria-label={t("dateSelector:title")}
        onClick={toggleMenu}
        type="button"
        $isFocused={isMenuOpen}
      >
        <IconWrapper>
          <IconCalendarClock aria-hidden />
        </IconWrapper>
        <Info>
          <div>{selectedText || t("dateSelector:title")}</div>
        </Info>
        <ArrowWrapper>
          {isMenuOpen ? (
            <IconAngleUp aria-hidden />
          ) : (
            <IconAngleDown aria-hidden />
          )}
        </ArrowWrapper>
      </Btn>
      <DateSelectorMenu
        backBtnRef={backBtnRef}
        customDatesBtnRef={customDatesBtnRef}
        dateTypes={dateTypes}
        dateTypeOptions={dateTypeOptions}
        endDate={endDate}
        isCustomDate={isCustomDate}
        isOpen={isMenuOpen}
        name={name}
        onChangeDateTypes={onChangeDateTypes}
        onChangeEndDate={onChangeEndDate}
        onChangeStartDate={onChangeStartDate}
        startDate={startDate}
        toggleIsCustomDate={handleToggleIsCustomDate}
        onCloseMenu={ensureMenuIsClosed}
      />
    </Wrapper>
  );
};

export default DateSelector;
