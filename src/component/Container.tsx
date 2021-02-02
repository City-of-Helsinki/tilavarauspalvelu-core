import React from 'react';
import styled from 'styled-components';

interface Props {
  children: React.ReactNode;
  // eslint-disable-next-line react/require-default-props
  main?: boolean;
  // eslint-disable-next-line react/require-default-props
  style?: React.CSSProperties;
}

const styles = `
  max-width: 75rem;
  margin: 0 auto;
  padding: 0 var(--spacing-m) var(--spacing-m) var(--spacing-m);
`;
const Wrapper = styled.div`
  ${styles}
`;

const WrapperMain = styled.div`
  ${styles}
`;

const Container = ({ main = false, ...rest }: Props): JSX.Element => {
  return main ? <WrapperMain {...rest} /> : <Wrapper {...rest} />;
};

export default Container;
