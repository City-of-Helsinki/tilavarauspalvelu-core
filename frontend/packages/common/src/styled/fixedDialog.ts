import { css } from "styled-components";

export interface FixedDialogProps {
  $maxWidth?: "m" | "l" | "xl";
  $fixedHeight?: boolean;
}

/// Export only the CSS because exporting styled(Dialog) from common breaks Dialog.Title (close btn / focus)
export const fixedDialogCss = css<FixedDialogProps>`
  /* Hack to deal with modal trying to fit content. So an error message -> layout shift */
  &&& {
    /* stylelint-disable custom-property-pattern */
    width: min(calc(100vw - 2rem), var(--container-width-${(props) => props.$maxWidth ?? "l"}));
    /* stylelint-enable custom-property-pattern */
  }
  & > div:nth-child(2) {
    /* don't layout shift when the modal content changes */
    height: ${(props) => (props.$fixedHeight ? "min(80vh, 1024px)" : "auto")};
  }
`;
