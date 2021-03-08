import React from 'react';
import { Koros, KorosType } from 'hds-react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';
import Breadcrumb from '../component/Breadcrumb';

type HeadProps = {
  heading: string;
  text?: string;
  breadCrumbText: string;
  korosType: KorosType;
};

const Heading = styled.h1`
  font-size: var(--fontsize-heading-l);
`;

const Container = styled.div`
  background-color: var(--tilavaraus-header-background-color);
`;

const Content = styled.div`
  padding: var(--spacing-l) var(--spacing-m) var(--spacing-m);
  max-width: var(--container-width-xl);
  margin: 0 auto;
  font-size: var(--fontsize-heading-m);
  font-weight: 500;
`;

const StyledKoros = styled(Koros)`
  background-color: var(--tilavaraus-gray);
  fill: var(--tilavaraus-header-background-color);
`;

const Head = ({
  text,
  heading,
  korosType,
  breadCrumbText,
}: HeadProps): JSX.Element => {
  const { t } = useTranslation();
  return (
    <Container>
      <Content>
        <Breadcrumb
          current={{
            label: `${t('breadcrumb.application')} - ${breadCrumbText}`,
            linkTo: '#',
          }}
        />
        <Heading>{heading}</Heading>
        {text ? <span>{text}</span> : null}
      </Content>
      <StyledKoros flipHorizontal className="koros" type={korosType} />
    </Container>
  );
};

export default Head;
