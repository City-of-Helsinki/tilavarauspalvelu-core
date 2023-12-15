import React, { Ref, forwardRef } from "react";
import styled from "styled-components";
import { IconAlertCircleFill } from "hds-react";
import { breakpoints } from "../../common/style";

const TimeInputContainer = styled.div`
  --border-width: 2px;
  --input-border-color-default: var(--color-black-50);
  --input-border-color-hover: var(--color-black-90);
  --input-border-color-focus: var(--color-black-90);
  --outline-width: 3px;

  display: flex;
  flex-direction: column;
  box-sizing: border-box;

  /* stylelint-disable-next-line property-no-vendor-prefix -- iOS problems */
  -webkit-appearance: none;
  border-radius: 0;

  & > label {
    color: var(--label-color-default, var(--color-black-90));
    display: block;
    font-size: var(--fontsize-body-m);
    font-weight: 500;
    margin-bottom: var(--spacing-3-xs);
  }
  & > input {
    padding: var(--spacing-s);
    border: var(--border-width) solid var(--input-border-color-default);
    font-size: 1.125rem;
    margin-right: auto;
    outline: none;

    /* mobile scale to full width inside a parent
     * desktop define a minimum size that shows HH:mm
     */
    max-width: none;
    width: 100%;
    box-sizing: border-box;

    &:focus-within {
      border-color: var(--input-border-color-focus);
      box-shadow: 0 0 0 var(--outline-width) var(--color-focus-outline);
      transform: translateZ(0);
      transition: 85ms ease-out;
      transition-property: box-shadow, transform;
    }
    &:hover {
      border-color: var(--input-border-color-hover);
    }
    &:disabled {
      background-color: var(--color-black-5);
    }
  }

  @media (min-width: ${breakpoints.m}) {
    & > input {
      min-width: 9ch;
      max-width: unset;
    }
  }
`;

// NOTE Extra div around the svg is required because of scaling issues with multi line text
const ErrorText = styled.div`
  display: flex;
  color: var(--color-error);
  & > div {
    margin-right: var(--spacing-3-xs);
  }
  margin-right: var(--spacing-3-xs);
`;

const isValid = (value: string): boolean => {
  return value === "" || /^[0-9]{1,2}(:[0-9]{0,2})?$/.test(value);
};

type TimeInputProps = {
  value: string;
  label: string;
  error?: string;
} & React.InputHTMLAttributes<HTMLInputElement>;

/// Custom component because
/// HDS TimeInput can not be changed programmatically
/// this breaks all react-hook-forms because they rely on resetting the value (both controlled / uncontrolled)
/// TODO if you use this on ui side check accessibility
export const TimeInput = forwardRef(function TimeInput(
  {
    error,
    label,
    className,
    style,
    onChange,
    onKeyDown,
    ...props
  }: TimeInputProps,
  ref: Ref<HTMLInputElement>
) {
  // block if the input is not a number or :
  // allow overwriting selection
  // automatic adding of : if the user types 3 numbers
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const isNumber = !Number.isNaN(Number(e.key));
    const { value, selectionStart, selectionEnd } = e.currentTarget;

    if (
      e.key === "ArrowRight" ||
      e.key === "ArrowLeft" ||
      e.key === "ArrowUp" ||
      e.key === "ArrowDown" ||
      e.key === "Tab" ||
      e.key === "Enter" ||
      e.key === "Escape" ||
      e.key === "Home" ||
      e.key === "End"
    ) {
      // noop
    } else if (e.key === "Backspace") {
      // automatically delete ':' - To simplify the logic we only care non selected variation here
      // there are issues when user selects ':' + other numbers around it (getting blocked by the validator)
      if (
        value.length === 3 &&
        (selectionStart === 2 || selectionStart === 3) &&
        selectionEnd === 3
      ) {
        e.currentTarget.value = value.slice(0, 2);
      }
    } else if (e.key === "Delete") {
      // TODO Same as backspace
    } else if (
      ((e.key === "v" ||
        e.key === "z" ||
        e.key === "x" ||
        e.key === "c" ||
        e.key === "a") &&
        e.ctrlKey) ||
      e.metaKey
    ) {
      // noop
    } else if (e.key !== ":" && !isNumber) {
      e.preventDefault();
    }
    onKeyDown?.(e);
  };

  // Separate onChange handler for validation and modification of the value
  // NOTE without calling onChange (e.g. preventDefault) the value in react-hook-form is not updated
  // Known issues:
  // user can select and delete the ':' character but it's recreated instantly (ex. 11:1 -> 11 -> 11:)
  // user can try to delete ':' in the middle (ex. 11:11) but it's blocked
  // deleting first two numbers while leaving the ':' doesn't work (proper solution is to automatically delete ':')
  const handleOnChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.currentTarget;
    // automatically add ':' after the user types 2 numbers
    if (value.length === 2 && !value.includes(":")) {
      e.currentTarget.value = `${value}:`;
    }
    // add the : automatically if it's missing and more than 2 numbers are added (primarily paste 0000 => 00:00)
    else if (!value.includes(":") && value.length > 2) {
      const modVal = `${value.slice(0, 2)}:${value.slice(2)}`;
      if (isValid(modVal)) {
        e.currentTarget.value = modVal;
      } else {
        e.preventDefault();
        return;
      }
    } else if (!isValid(value)) {
      e.preventDefault();
      return;
    }
    onChange?.(e);
  };

  return (
    <TimeInputContainer className={className} style={style}>
      <label htmlFor={props.name}>{label}</label>
      <input
        {...props}
        // use numeric keyboard on mobile
        inputMode="numeric"
        pattern="[0-9]:*"
        placeholder="tt:mm"
        ref={ref}
        // setting size={X} breaks css styling... because of course it does
        onKeyDown={handleKeyDown}
        onChange={handleOnChange}
      />
      {error && (
        <ErrorText>
          <div>
            <IconAlertCircleFill />
          </div>
          <span>{error}</span>
        </ErrorText>
      )}
    </TimeInputContainer>
  );
});
