import styled from "styled-components";
import { breakpoints } from "../../../styles/util";

export const EditorColumns = styled.div`
  display: block;
  @media (min-width: ${breakpoints.l}) {
    grid-template-columns: 1fr 1fr;
    display: grid;
  }
  align-items: baseline;
  gap: 1em;
  margin-top: var(--spacing-s);
  padding-bottom: var(--spacing-m);
`;
