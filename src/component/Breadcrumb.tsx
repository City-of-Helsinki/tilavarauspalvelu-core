import React from 'react';
import { useTranslation } from 'react-i18next';
import { NavLink } from 'react-router-dom';
import styles from './Breadcrumb.module.scss';

interface Props {
  current: BreadcrumbType;
}

interface BreadcrumbType {
  label: string;
  linkTo?: string;
}

const root = { label: 'breadcrumb.home', linkTo: '/' } as BreadcrumbType;

const Breadcrumb = ({ current }: Props): JSX.Element => {
  const { t } = useTranslation();
  const breadcrumbs = [root, current];

  return (
    <nav aria-label="breadcrumbs" className={styles.container}>
      {breadcrumbs.map((bc, i) => (
        <span key={bc.label}>
          {i > 0 && ' › '}
          <NavLink
            isActive={() => i === breadcrumbs.length - 1}
            aria-current="location"
            to={bc.linkTo || ''}>
            {t(bc.label)}
          </NavLink>
        </span>
      ))}
    </nav>
  );
};

export default Breadcrumb;
