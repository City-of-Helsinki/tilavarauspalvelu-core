import styled from "styled-components";

// Tab causes horizontal overflow without this
// we use grids primarily and components inside grid without max-width overflow.
export const TabWrapper = styled.div`
  max-width: 95vw;
`;

export const Label = styled.p<{ $bold?: boolean }>`
  font-family: var(--fontsize-body-m);
  font-weight: ${({ $bold }) => ($bold ? "700" : "500")};
`;
