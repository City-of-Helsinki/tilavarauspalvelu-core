import styled from "styled-components";
import { breakpoints } from "common/src/common/style";

const SearchContainer = styled.div`
  display: grid;
  align-items: center;
  margin-bottom: var(--spacing-layout-xs);
  position: relative;
  width: 100%;

  &&& input {
    padding-right: var(--spacing-2-xl);
    padding-left: var(--spacing-xl);
  }

  .searchIcon {
    position: absolute;
    left: 0;
    z-index: 1;
  }

  @media (min-width: ${breakpoints.s}) {
    width: 20rem;
  }
`;

export default SearchContainer;
