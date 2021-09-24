import React from "react";
import { useTranslation } from "react-i18next";
import Link from "next/link";
import styled from "styled-components";

interface Props {
  root?: BreadcrumbType;
  current: BreadcrumbType;
}
interface BreadcrumbType {
  label: string;
  linkTo?: string;
}

const rootDefault = { label: "home" } as BreadcrumbType;

const Container = styled.nav`
  font-size: var(--fontsize-body-s);

  & > a {
    color: var(--color-black);
    text-decoration: none;
  }
`;

const Breadcrumb = ({ root = rootDefault, current }: Props): JSX.Element => {
  const { t } = useTranslation();
  const breadcrumbs = [root, current];

  return (
    <Container aria-label="breadcrumbs">
      {breadcrumbs.map((bc, i) => (
        <React.Fragment key={bc.label}>
          {i > 0 && " › "}
          {bc.linkTo ? (
            <Link
              /* TODO: isActive={() => i === breadcrumbs.length - 1} */
              aria-current="location"
              href={bc.linkTo || ""}
            >
              <a>{t(`breadcrumb:${bc.label}`)}</a>
            </Link>
          ) : (
            <span>{t(`breadcrumb:${bc.label}`)}</span>
          )}
        </React.Fragment>
      ))}
    </Container>
  );
};

export default Breadcrumb;
