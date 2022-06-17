import { IconAlertCircleFill } from "hds-react";
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
  errorText?: string;
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

const ErrorText = styled.div`
  color: var(--color-error);
  display: block;
  font-size: var(--fontsize-body-m);
  line-height: var(--lineheight-l);
  margin-top: var(--spacing-3-xs);
  padding-left: var(--spacing-2-xs);
  white-space: pre-line;
`;

const AlignVertically = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
`;

const StyledReactQuill = styled(ReactQuill)<{
  $error?: boolean;
}>`
  border: 2px solid
    ${({ $error }) => ($error ? "var(--color-error)" : "var(--color-black-50)")};
  > div {
    font-size: var(--fontsize-body-l);
    font-family: var(--tilavaraus-admin-font);
  }
`;

const modules = {
  toolbar: [["bold"], ["link"]],
};

const RichTextInput = ({
  value,
  required = false,
  disabled = false,
  label = "",
  id,
  errorText,
  onChange,
}: Props): JSX.Element => {
  return (
    <Container $disabled={disabled} id={`${id}-container`}>
      <Label htmlFor={id}>
        {label} {required ? <Asterix>*</Asterix> : null}
      </Label>
      <StyledReactQuill
        modules={modules}
        readOnly={disabled}
        id={id}
        value={value}
        onChange={onChange}
        $error={errorText !== undefined}
      />
      {errorText ? (
        <AlignVertically>
          <IconAlertCircleFill color="var(--color-error)" />
          <ErrorText className="hds-text-input--invalid">{errorText}</ErrorText>
        </AlignVertically>
      ) : (
        ""
      )}
    </Container>
  );
};

export default RichTextInput;
