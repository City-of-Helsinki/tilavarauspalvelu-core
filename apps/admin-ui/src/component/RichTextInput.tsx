/// NOTE client only
/// Quill is not SSR compatible
import { IconAlertCircleFill, Tooltip } from "hds-react";
import React from "react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import styled from "styled-components";
import { Flex } from "common/styles/util";

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

const ErrorText = styled.span`
  color: var(--color-error);
`;

const StyledReactQuill = styled(ReactQuill)<{
  $error?: boolean;
}>`
  border: 2px solid
    ${({ $error }) => ($error ? "var(--color-error)" : "var(--color-black-50)")};
  > div {
    font-size: var(--fontsize-body-l);
    font-family: var(--font-regular);
    p {
      margin-bottom: var(--spacing-s);
    }
  }
`;

const modules = {
  toolbar: [["bold"], ["link"]],
};

type Props = {
  required?: boolean;
  disabled?: boolean;
  label?: string;
  value: string;
  id: string;
  onChange: (v: string) => void;
  errorText?: string;
  tooltipText?: string;
} & React.HTMLAttributes<HTMLDivElement>;

function RichTextInput({
  value,
  required = false,
  disabled = false,
  label = "",
  id,
  errorText,
  tooltipText,
  onChange,
  ...rest
}: Props): JSX.Element {
  return (
    <Container {...rest} $disabled={disabled} id={`${id}-container`}>
      <Flex $justifyContent="space-between" $direction="row">
        <Label htmlFor={id}>
          {label} {required ? <Asterix>*</Asterix> : null}
        </Label>
        {tooltipText && <Tooltip>{tooltipText}</Tooltip>}
      </Flex>
      <StyledReactQuill
        modules={modules}
        readOnly={disabled}
        id={id}
        value={value}
        onChange={onChange}
        $error={errorText !== undefined}
      />
      {errorText ? (
        <Flex $alignItems="center" $direction="row" $gap="xs">
          <IconAlertCircleFill color="var(--color-error)" />
          <ErrorText className="hds-text-input--invalid">{errorText}</ErrorText>
        </Flex>
      ) : (
        ""
      )}
    </Container>
  );
}

export default RichTextInput;
