import React from 'react';
import { useTranslation } from 'react-i18next';
import { NavLink } from 'react-router-dom';
import styled from 'styled-components';

interface Props {
  current: BreadcrumbType;
}

interface BreadcrumbType {
  label: string;
  linkTo?: string;
}

const root = { label: 'breadcrumb.home', linkTo: '/' } as BreadcrumbType;

const Container = styled.nav`
  margin-top: var(--spacing-s);
  font-size: var(--fontsize-body-s);

  & > a {
    color: var(--color-black);
    text-decoration: none;
  }
`;

const Breadcrumb = ({ current }: Props): JSX.Element => {
  const { t } = useTranslation();
  const breadcrumbs = [root, current];

  return (
    <Container aria-label="breadcrumbs">
      {breadcrumbs.map((bc, i) => (
        <React.Fragment key={bc.label}>
          {i > 0 && ' › '}
          <NavLink
            isActive={() => i === breadcrumbs.length - 1}
            aria-current="location"
            to={bc.linkTo || ''}>
            {t(bc.label)}
          </NavLink>
        </React.Fragment>
      ))}
    </Container>
  );
};

export default Breadcrumb;
