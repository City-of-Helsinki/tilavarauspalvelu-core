import { TextArea, TextInput } from "hds-react";
import styled from "styled-components";
import type { AutoGridProps } from "../styled";
import { AutoGrid, fontMedium } from "../styled";

export const StyledCheckboxWrapper = styled.div<{
  $isWide?: boolean;
}>`
  ${({ $isWide }) => $isWide && "grid-column: 1 / -1"};
`;

type TextAreaProps = {
  $isWide?: boolean;
  $hidden?: boolean;
  $height?: string;
};

export const StyledTextInput = styled(TextInput)<{
  $isWide?: boolean;
}>`
  ${({ $isWide }) => $isWide && "grid-column: 1 / -1"};
`;

export const StyledAutoGrid = styled(AutoGrid)<AutoGridProps>`
  label {
    ${fontMedium};
  }
`;

export const StyledTextArea = styled(TextArea)<TextAreaProps>`
  ${({ $isWide }) => $isWide && "grid-column: 1 / -1"};
  ${({ $hidden }) => $hidden && "display: none"};

  && {
    ${({ $height }) => ($height != null ? `--textarea-height: ${$height}` : "")};
  }
`;
