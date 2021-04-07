import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Koros } from 'hds-react';
import styled from 'styled-components';
import { useParams } from 'react-router-dom';
import Container from '../component/Container';
import { getApplicationRound } from '../common/api';
import { CenterSpinner } from '../component/common';
import { ApplicationRound } from '../common/types';
import Sanitize from '../component/Sanitize';

const Head = styled.div`
  background-color: var(--color-white);
`;
const HeadContent = styled.div`
  padding: var(--spacing-l) var(--spacing-m) 0;
  max-width: var(--container-width-xl);
  margin: 0 auto var(--spacing-2-xl) auto;
  font-size: var(--fontsize-body-xl);
`;
const H1 = styled.h1`
  font-size: var(--fontsize-heading-l);
`;
const StyledKoros = styled(Koros)`
  fill: var(--tilavaraus-gray);
`;

const Content = styled.div`
  max-width: var(--container-width-l);
  font-family: var(--font-regular);
  font-size: var(--fontsize-body-l);
`;

type ParamType = {
  id: string;
};

const Criteria = (): JSX.Element => {
  const { t } = useTranslation();

  const { id } = useParams<ParamType>();
  const [applicationRound, setApplicationRound] = useState<ApplicationRound>();
  const [state, setState] = useState<'loading' | 'done' | 'error'>('loading');

  useEffect(() => {
    async function fetchData() {
      try {
        const round = await getApplicationRound({
          id: Number(id),
        });
        setApplicationRound(round);
        setState('done');
      } catch (e) {
        setState('error');
      }
    }
    fetchData();
  }, [id]);

  return state !== 'loading' ? (
    <>
      <Head>
        <HeadContent>
          <H1>
            {state === 'done'
              ? `${applicationRound?.name} ${t('Criteria.criteria')}`
              : t('common.error.dataError')}
          </H1>
        </HeadContent>
        <StyledKoros className="koros" type="wave" />
      </Head>
      <Container>
        <Content>
          <Sanitize html={applicationRound?.criteria || ''} />
        </Content>
      </Container>
    </>
  ) : (
    <CenterSpinner />
  );
};

export default Criteria;
