import { Button } from "hds-react";
import styled, { css } from "styled-components";

export const truncatedText = css`
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

export const pixel =
  "data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=";

export const MediumButton = styled(Button)`
  font-family: var(--font-medium);
`;

export const NoWrap = styled.span`
  white-space: nowrap;
`;
