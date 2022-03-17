import React from "react";
import { useTranslation } from "react-i18next";
import Link from "next/link";
import styled from "styled-components";
import { IconAngleRight } from "hds-react";
import { breakpoint } from "../../modules/style";

interface Props {
  root?: BreadcrumbType;
  current: BreadcrumbType;
}
interface BreadcrumbType {
  label: string;
  linkTo?: string;
}

const rootDefault = { label: "home" } as BreadcrumbType;

const Wrapper = styled.div`
  display: none;

  @media (min-width: ${breakpoint.m}) {
    display: block;
    background-color: var(--color-white);
  }
`;

const Container = styled.nav`
  background-color: var(--color-white);
  font-size: var(--fontsize-body-s);
  display: flex;
  align-items: center;
  max-width: var(--container-width-xl);
  margin: 0 auto;
  line-height: var(--spacing-3-xl);
  color: var(--color-black);
  padding: 0 var(--spacing-m);

  & > a {
    color: var(--color-black);
    text-decoration: none;
  }
`;

const Anchor = styled.a<{ $current: boolean }>`
  && {
    ${({ $current }) => {
      switch ($current) {
        case true:
          return `
            color: var(--color-black);
          `;
        case false:
        default:
          return `
            color: var(--color-bus);
            text-decoration: underline;
          `;
      }
    }}
  }
`;

const Breadcrumb = ({ root = rootDefault, current }: Props): JSX.Element => {
  const { t } = useTranslation();
  const breadcrumbs = [root, current];

  return (
    <Wrapper>
      <Container aria-label="breadcrumbs">
        {breadcrumbs.map((bc, i) => (
          <React.Fragment key={bc.label}>
            {i > 0 && <IconAngleRight size="xs" aria-hidden />}
            {bc.linkTo ? (
              <Link aria-current="location" href={bc.linkTo || ""} passHref>
                <Anchor $current={i === breadcrumbs.length - 1}>
                  {t(`breadcrumb:${bc.label}`)}
                </Anchor>
              </Link>
            ) : (
              <span>{t(`breadcrumb:${bc.label}`)}</span>
            )}
          </React.Fragment>
        ))}
      </Container>
    </Wrapper>
  );
};

export default Breadcrumb;
