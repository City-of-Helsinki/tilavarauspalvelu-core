import React, { Ref, forwardRef } from "react";
import styled from "styled-components";

const TimeInputContainer = styled.div`
  --border-width: 2px;
  --input-border-color-default: var(--color-black-50);
  --input-border-color-hover: var(--color-black-90);
  --input-border-color-focus: var(--color-black-90);
  --outline-width: 3px;

  display: flex;
  flex-direction: column;

  /* iOS problems */
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
`;

type TimeInputProps = {
  value: string;
  label: string;
} & React.InputHTMLAttributes<HTMLInputElement>;

/// Custom component because
/// HDS TimeInput can not be changed programmatically
/// this breaks all react-hook-forms because they rely on resetting the value (both controlled / uncontrolled)
/// TODO if you use this on ui side check accessibility
export const TimeInput = forwardRef(function TimeInput(
  props: TimeInputProps,
  ref: Ref<HTMLInputElement>
) {
  const { label } = props;

  const isValid = (value: string): boolean => {
    return /^[0-9]{1,2}(:[0-9]{0,2})?$/.test(value);
  };

  // block if the input is not a number or :
  // allow overwriting selection
  // automatic adding of : if the user types 3 numbers
  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
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
      // TODO use selection, and check if the last char is : or not
      if (value.length === 3) {
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
    } else {
      const newValue =
        value.slice(0, selectionStart ?? value.length) +
        e.key +
        value.slice(selectionEnd ?? value.length);
      // automatically add ':' after the user types 2 numbers
      if (newValue.length === 2 && newValue.indexOf(":") === -1) {
        e.currentTarget.value = `${value}${e.key}:`;
        e.preventDefault();
      }
      if (!isValid(newValue)) {
        e.preventDefault();
      }
    }
  };

  const onPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const value = e.clipboardData.getData("text");
    const {
      value: currentValue,
      selectionStart,
      selectionEnd,
    } = e.currentTarget;
    const val =
      currentValue.slice(0, selectionStart ?? currentValue.length) +
      value +
      currentValue.slice(selectionEnd ?? currentValue.length);
    if (isValid(val)) {
      return;
    }
    // add the : automatically if it's missing and more than 2 numbers are added (primarily paste 0000 => 00:00)
    if (val.indexOf(":") === -1) {
      const modVal = `${val.slice(0, 2)}:${val.slice(2)}`;
      if (isValid(modVal)) {
        e.currentTarget.value = modVal;
      }
    }
    e.preventDefault();
  };

  return (
    <TimeInputContainer>
      <label htmlFor={props.name}>{label}</label>
      <input
        {...props}
        // use numeric keyboard on mobile
        inputMode="numeric"
        pattern="[0-9]:*"
        placeholder="hh:mm"
        ref={ref}
        size={6}
        onPaste={onPaste}
        onKeyDown={onKeyDown}
      />
    </TimeInputContainer>
  );
});
