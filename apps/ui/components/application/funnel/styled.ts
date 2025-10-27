import styled from "styled-components";
import { H5, FullRow } from "common/src/styled";

export const SpanFullRow = styled(FullRow).attrs({ as: "span" })``;

export const FormSubHeading = styled(H5).attrs({ as: "h2" })`
  margin: 0;
  grid-column: 1 / -1;
`;
