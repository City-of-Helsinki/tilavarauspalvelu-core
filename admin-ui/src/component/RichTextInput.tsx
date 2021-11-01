import React from "react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import styled from "styled-components";

type Props = {
  required?: boolean;
  disabled?: boolean;
  label?: string;
  value: string;
  id: string;
  onChange: (v: string) => void;
};

const Container = styled.div<{ $disabled: boolean }>`
  .ql-toolbar {
    border: none !important;
    ${({ $disabled }) =>
      $disabled ? "background-color: var(--color-black-10);" : ""}
  }
  .ql-container {
    border: none !important;
    border-top: 1px solid var(--color-black-50) !important;
    ${({ $disabled }) =>
      $disabled ? "background-color: var(--color-black-10);" : ""}
  }
  padding-bottom: var(--spacing-m);
`;

const Label = styled.label`
  display: block;
  font-size: var(--fontsize-body-m);
  font-weight: 500;
  margin-bottom: var(--spacing-3-xs);
`;

const Asterix = styled.span`
  color: var(--color-black-90);
  display: inline-block;
  font-size: var(--fontsize-body-xl);
  line-height: 1;
  margin-left: var(--spacing-2-xs);
  transform: translateY(var(--spacing-3-xs));
`;

const StyledReactQuill = styled(ReactQuill)`
  border: 2px solid var(--color-black-50);

  > div {
    font-size: var(--fontsize-body-l);
    font-family: var(--tilavaraus-admin-font);
  }
`;

const RichTextInput = ({
  value,
  required = false,
  disabled = false,
  label = "",
  id,
  onChange,
}: Props): JSX.Element => {
  return (
    <Container $disabled={disabled} id={`${id}-container`}>
      <Label htmlFor={id}>
        {label} {required ? <Asterix>*</Asterix> : null}
      </Label>
      <StyledReactQuill
        readOnly={disabled}
        id={id}
        value={value}
        onChange={onChange}
      />
    </Container>
  );
};

export default RichTextInput;
