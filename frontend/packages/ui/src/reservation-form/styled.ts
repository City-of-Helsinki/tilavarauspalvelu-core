import { TextArea, TextInput } from "hds-react";
import styled from "styled-components";
import { fontMedium } from "../styled";

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

  label {
    ${fontMedium};
  }
`;
