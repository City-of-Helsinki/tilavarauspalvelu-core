import { IconAngleDown, IconAngleUp, IconSearch } from "hds-react";
import React from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import classNames from "classnames";
import { OptionType } from "common/types/common";
import useKeyboardNavigation from "../../hooks/useDropdownKeyboardNavigation";
import Checkbox from "./Checkbox";
import Dropdown from "./Dropdown";
import ScrollIntoViewWithFocus from "./ScrollIntoViewWithFocus";
import SearchLabel from "./SearchLabel";

const SELECT_ALL = "SELECT_ALL";

export interface MultiselectDropdownProps {
  id: string;
  checkboxName: string;
  icon?: React.ReactElement;
  inputPlaceholder?: string;
  inputValue?: string;
  name: string;
  onChange: (values: string[]) => void;
  options: OptionType[];
  renderOptionText?: (optionValue: string) => React.ReactChild;
  setInputValue?: (newVal: string) => void;
  showSearch?: boolean;
  title: string;
  value: string[];
  className?: string;
}

const Wrapper = styled.div`
  position: relative;
  background: var(--color-white);
  box-sizing: border-box;

  .dropdownItem {
    margin: 0;
    padding: var(--spacing-xs) var(--spacing-s);
    display: block !important;

    &--first {
      padding-top: 1rem;
    }

    &--isFocused {
      background-color: var(--color-fog);
    }
  }

  .checkbox--isFocused {
    background-color: var(--color-fog);
  }
`;

const ToggleButton = styled.button`
  cursor: pointer;
  background: transparent;
  min-height: 56px;
  padding: 0 0.875rem;
  width: 100%;
  display: flex;
  align-items: center;
  border: 2px solid var(--color-black-50);
  outline: none;
  margin-top: var(--spacing-3-xs);

  &:focus {
    border-color: var(--color-black);
  }

  svg {
    height: 1.25rem;
    width: 1.25rem;
  }
`;

const IconWrapper = styled.div`
  display: flex;
  align-self: center;

  svg {
    margin-right: 1rem;
  }
`;

const InputWrapper = styled.div`
  position: relative;
  border-bottom: 2px solid var(--color-black-10);

  input {
    height: var(--spacing-2-xl);
    width: 100%;
    padding: 0 var(--spacing-s) 0 var(--spacing-2-xl);
    border: none;
    outline: none;
  }

  svg {
    position: absolute;
    top: 50%;
    left: var(--spacing-s);
    transform: translateY(-50%);
  }
`;

const Title = styled.div`
  flex: 1 1 0%;
  text-align: left;
  color: var(--color-black);
  position: relative;
  overflow: hidden;

  input {
    height: 100%;
    line-height: 1.25rem;
    padding-left: 0;
    width: 100%;
    border: none;
    outline: none;
  }
`;

const TitleText = styled.div<{ $empty }>`
  line-height: 1.5rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: var(--fontsize-body-l);
  ${({ $empty }) => $empty && `color: var(--color-black-60);`}
`;

const ArrowWrapper = styled.div`
  display: flex;
  align-self: center;

  svg {
    margin-left: 0.75rem;
    pointer-events: none;
  }
`;

const MultiSelectDropdown: React.FC<MultiselectDropdownProps> = ({
  id,
  checkboxName,
  icon,
  inputPlaceholder,
  inputValue,
  name,
  onChange,
  options,
  renderOptionText,
  setInputValue,
  showSearch,
  title,
  value,
  className,
}) => {
  const { t } = useTranslation();
  const inputPlaceholderText = inputPlaceholder || t("forms:inputPlaceholder");
  const [internalInput, setInternalInput] = React.useState("");
  const input = inputValue !== undefined ? inputValue : internalInput;

  const dropdown = React.useRef<HTMLDivElement | null>(null);
  const toggleButton = React.useRef<HTMLButtonElement | null>(null);
  const inputRef = React.useRef<HTMLInputElement | null>(null);

  const filteredOptions = React.useMemo(() => {
    return [
      ...options.filter((option) => {
        return option.label?.toLowerCase().includes(input?.toLowerCase());
      }),
    ].filter((e) => e) as OptionType[];
  }, [input, options]);

  const handleInputValueChange = React.useCallback(
    (val: string) => {
      setInternalInput(val);

      if (setInputValue) {
        setInputValue(val);
      }
    },
    [setInputValue]
  );

  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  const handleDocumentClick = React.useCallback(
    (event: MouseEvent) => {
      const { target } = event;
      const { current } = dropdown;

      // Close menu when clicking outside of the component
      if (
        !(target instanceof Node && current?.contains(target)) &&
        isMenuOpen
      ) {
        setIsMenuOpen(false);
      }
    },
    [isMenuOpen]
  );

  const toggleOption = React.useCallback(
    (option: string) => {
      onChange(
        value?.includes(option)
          ? value.filter((v) => v !== option)
          : [...value, option]
      );
    },
    [onChange, value]
  );

  const ensureDropdownIsOpen = React.useCallback(() => {
    if (!isMenuOpen) {
      setIsMenuOpen(true);
    }
  }, [isMenuOpen]);

  const isToggleButtonFocused = () => {
    const active = document.activeElement;
    const { current } = toggleButton;

    return !!current?.contains(active);
  };

  const setFocusToToggleButton = () => {
    toggleButton.current?.focus();
  };

  const toggleMenu = React.useCallback(() => {
    setIsMenuOpen(!isMenuOpen);
  }, [isMenuOpen]);

  const handleDocumentFocusin = (event: FocusEvent) => {
    const { target } = event;
    const { current } = dropdown;

    if (!(target instanceof Node && current?.contains(target))) {
      setIsMenuOpen(false);
    }
  };

  const setFocusToInput = () => {
    inputRef.current?.focus();
  };

  const handleToggleButtonClick = () => {
    toggleMenu();

    setTimeout(() => {
      if (!isMenuOpen) {
        setFocusToInput();
      }
    }, 0);
  };

  const {
    focusedIndex,
    setup: setupKeyboardNav,
    teardown: teardownKeyboardNav,
  } = useKeyboardNavigation({
    container: dropdown,
    listLength: filteredOptions.length,
    onKeyDown: (event: KeyboardEvent) => {
      switch (event.key) {
        // Close menu on ESC key
        case "Escape":
          setIsMenuOpen(false);
          setFocusToToggleButton();
          break;
        case "ArrowUp":
          ensureDropdownIsOpen();
          break;
        case "ArrowDown":
          ensureDropdownIsOpen();
          break;
        case "Enter":
          if (isToggleButtonFocused()) {
            handleToggleButtonClick();
          }
          break;
        default:
      }
    },
  });

  React.useEffect(() => {
    setupKeyboardNav();
    document.addEventListener("click", handleDocumentClick);
    document.addEventListener("focusin", handleDocumentFocusin);
    // Clean up event listener to prevent memory leaks
    return () => {
      teardownKeyboardNav();
      document.removeEventListener("click", handleDocumentClick);
      document.removeEventListener("focusin", handleDocumentFocusin);
    };
  }, [handleDocumentClick, setupKeyboardNav, teardownKeyboardNav]);

  const handleClear = React.useCallback(() => {
    onChange([]);
    handleInputValueChange("");
  }, [handleInputValueChange, onChange]);

  const handleValueChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const val = event.target.value;
    if (val === SELECT_ALL) {
      handleClear();
    } else {
      toggleOption(val);
    }
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    handleInputValueChange(event.target.value);
  };

  const selectedText = React.useMemo(() => {
    const valueLabels = value
      ?.map((val) => {
        if (renderOptionText) {
          return renderOptionText(val);
        }

        const result = options.find((option) => option.value === val);
        return result?.label || null;
      })
      .sort();
    if (valueLabels?.length > 1) {
      return (
        <>
          {valueLabels[0]} + {valueLabels.length - 1}
        </>
      );
    }
    return valueLabels ? valueLabels[0] : "";
  }, [options, renderOptionText, value]);

  React.useEffect(() => {
    if (!isMenuOpen) {
      handleInputValueChange("");
    }
  }, [handleInputValueChange, isMenuOpen]);

  return (
    <Wrapper ref={dropdown} className={className}>
      <label htmlFor={id}>{title}</label>
      <ToggleButton
        id={id}
        aria-label={title}
        aria-expanded={isMenuOpen}
        onClick={handleToggleButtonClick}
        ref={toggleButton}
        type="button"
      >
        {icon && <IconWrapper>{icon}</IconWrapper>}
        <Title>
          <SearchLabel htmlFor={name} srOnly>
            {title}
          </SearchLabel>
          <TitleText $empty={!selectedText}>
            {selectedText || t("common:select")}
          </TitleText>
        </Title>
        <ArrowWrapper>
          {isMenuOpen ? (
            <IconAngleUp aria-hidden />
          ) : (
            <IconAngleDown aria-hidden />
          )}
        </ArrowWrapper>
      </ToggleButton>
      <Dropdown isOpen={isMenuOpen} onClear={handleClear}>
        {showSearch && (
          <InputWrapper>
            <IconSearch size="s" aria-hidden />
            <SearchLabel htmlFor={name} srOnly>
              {inputPlaceholderText}
            </SearchLabel>

            <input
              ref={inputRef}
              id={`${id}-input`}
              name={name}
              placeholder={inputPlaceholderText}
              onChange={handleInputChange}
              value={input}
            />
          </InputWrapper>
        )}

        {filteredOptions.map((option, index) => {
          const isFocused = index === focusedIndex;
          const isChecked =
            option.value === SELECT_ALL
              ? !value.length
              : value?.includes(option.value as string);

          const setFocus = (ref: HTMLInputElement) => {
            if (isFocused) {
              ref?.focus();
            }
          };

          return (
            <ScrollIntoViewWithFocus
              className={classNames("dropdownItem", {
                "dropdownItem--first": index === 0,
                "dropdownItem--isFocused": isFocused,
              })}
              key={option.value}
              isFocused={isFocused}
            >
              <Checkbox
                ref={setFocus}
                checked={isChecked}
                id={`${checkboxName}_${option.value}`}
                label={option.label}
                name={checkboxName}
                onChange={handleValueChange}
                value={option.value as string}
              />
            </ScrollIntoViewWithFocus>
          );
        })}
      </Dropdown>
    </Wrapper>
  );
};

export default MultiSelectDropdown;
