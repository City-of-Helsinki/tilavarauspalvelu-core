/// NOTE client only
/// Quill is not SSR compatible
import React, { forwardRef, useEffect, useLayoutEffect, useRef } from "react";
import { IconAlertCircleFill, Tooltip } from "hds-react";
import Quill from "quill";
import "quill/dist/quill.snow.css";
import styled from "styled-components";
import { Flex } from "ui/src/styled";

const Container = styled.div<{ $disabled: boolean }>`
  .ql-toolbar {
    border: none !important;
    ${({ $disabled }) => ($disabled ? "background-color: var(--color-black-10);" : "")}
  }
  .ql-container {
    border: none !important;
    border-top: 1px solid var(--color-black-50) !important;
    ${({ $disabled }) => ($disabled ? "background-color: var(--color-black-10);" : "")}
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

const HelperText = styled.div`
  color: var(--color-black-60);
  display: block;
  font-size: var(--fontsize-body-m);
  line-height: var(--lineheight-l);
  margin-top: var(--spacing-3-xs);
  white-space: pre-line;
`;

const ErrorText = styled.span`
  color: var(--color-error);
`;

const EditorContainer = styled.div<{
  $error?: boolean;
}>`
  background: var(--color-white);
  border: 2px solid ${({ $error }) => ($error ? "var(--color-error)" : "var(--color-black-50)")};
  > div {
    font-size: var(--fontsize-body-l);
    font-family: var(--font-regular);
    p {
      margin-bottom: var(--spacing-s);
    }
  }
`;

const TOOLBAR_OPTIONS = ["bold", "link"];

interface QuillEditorProps {
  onTextChange: (source: string) => void;
  id?: string;
  defaultValue?: string;
  value?: string;
}

const QuillEditor = forwardRef<Quill | null, QuillEditorProps>(({ id, value, defaultValue, onTextChange }, ref) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const defaultValueRef = useRef(defaultValue);
  const onTextChangeRef = useRef(onTextChange);
  const quillRef = useRef<Quill | null>(null);

  useLayoutEffect(() => {
    onTextChangeRef.current = onTextChange;
  });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const editorContainer = container.appendChild(container.ownerDocument.createElement("div"));
    const quill = new Quill(editorContainer, {
      theme: "snow",
      // formats has to be permissive to match Django editor / sanitize rules (otherwise quill will remove the elements)
      formats: null,
      modules: {
        toolbar: TOOLBAR_OPTIONS,
      },
    });

    quillRef.current = quill;

    if (typeof ref === "function") {
      ref(quill);
    } else if (ref) {
      ref.current = quill;
    }

    if (defaultValueRef.current) {
      quill.root.innerHTML = defaultValueRef.current;
    }

    quill.on(Quill.events.TEXT_CHANGE, () => {
      onTextChangeRef.current?.(quill.root.innerHTML);
    });

    return () => {
      if (typeof ref === "function") {
        ref(null);
      } else if (ref) {
        ref.current = null;
      }
      container.innerHTML = "";
    };
  }, [ref]);

  useEffect(() => {
    const quill = quillRef.current;
    if (!quill || value === undefined) return;

    // Only update if different to avoid cursor jumps
    if (quill.root.innerHTML !== value) {
      const selection = quill.getSelection(); // Preserve cursor position
      quill.root.innerHTML = value;
      if (selection) {
        quill.setSelection(selection);
      }
    }
  }, [value]);

  return <div id={id} ref={containerRef}></div>;
});

type RichTextProps = {
  required?: boolean;
  disabled?: boolean;
  label?: string;
  value: string;
  id: string;
  onChange: (v: string) => void;
  errorText?: string;
  tooltipText?: string;
  helperText?: string;
} & React.HTMLAttributes<HTMLDivElement>;

function RichTextInput({
  value,
  required = false,
  disabled = false,
  label = "",
  id,
  errorText,
  tooltipText,
  helperText,
  onChange,
  ...rest
}: RichTextProps): JSX.Element {
  return (
    <Container {...rest} $disabled={disabled} id={`${id}-container`}>
      <Flex $justifyContent="space-between" $direction="row">
        <Label htmlFor={id}>
          {label} {required ? <Asterix>*</Asterix> : null}
        </Label>
        {tooltipText && <Tooltip>{tooltipText}</Tooltip>}
      </Flex>
      <EditorContainer $error={errorText !== undefined}>
        <QuillEditor value={removeLineFeeds(value)} defaultValue={removeLineFeeds(value)} onTextChange={onChange} />
      </EditorContainer>
      {errorText ? (
        <Flex $alignItems="center" $direction="row" $gap="xs">
          <IconAlertCircleFill color="var(--color-error)" />
          <ErrorText className="hds-text-input--invalid">{errorText}</ErrorText>
        </Flex>
      ) : (
        ""
      )}
      {helperText ? <HelperText>{helperText}</HelperText> : ""}
    </Container>
  );
}

function removeLineFeeds(str: string): string {
  return str.replaceAll(/\n|\r/g, "");
}

export default RichTextInput;
