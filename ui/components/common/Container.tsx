import React from "react";
import styled from "styled-components";
import { breakpoint } from "../../modules/style";

interface Props {
  children: React.ReactNode;
  main?: boolean;
  style?: React.CSSProperties;
  id?: string;
}

const styles = `
  max-width: 75rem;
  margin: 0 auto;
  padding: 0 var(--spacing-m) var(--spacing-m) var(--spacing-m);
  @media (max-width: ${breakpoint.s}) {
    padding: 0 var(--spacing-xs) var(--spacing-xs) var(--spacing-xs);
  }

`;

// TODO wtf?
const Wrapper = styled.div`
  ${styles}
`;

const WrapperMain = styled.div`
  ${styles}
`;

const Container = ({ main = false, ...rest }: Props): JSX.Element => {
  return main ? <WrapperMain {...rest} /> : <Wrapper {...rest} />;
};

export const CenteredContainer = styled(Container)`
  margin: 0 auto;

  @media (min-width: ${breakpoint.m}) {
    max-width: 590px;
  }
`;

export default Container;
