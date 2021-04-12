import { Button, Select } from 'hds-react';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useHistory } from 'react-router-dom';
import styled from 'styled-components';
import { getApplicationRounds, saveApplication } from '../../common/api';
import { breakpoint } from '../../common/style';
import { OptionType, Application } from '../../common/types';
import { applicationRoundState, deepCopy } from '../../common/util';
import { AccordionWithState as Accordion } from '../../component/Accordion';
import { CenterSpinner } from '../../component/common';
import { minimalApplicationForInitialSave } from '../applicationInitializer';
import ApplicationPage from '../ApplicationPage';

const Container = styled.div`
  margin-top: var(--spacing-layout-m);
  font-size: var(--fontsize-body-m);
  gap: var(--spacing-l);
  display: grid;
  grid-template-columns: 1fr 382px;

  @media (max-width: ${breakpoint.l}) {
    grid-template-columns: 1fr;
  }
`;

const Intro = (): JSX.Element => {
  const [applicationRoundOptions, setApplicationRoundOptions] = useState(
    [] as OptionType[]
  );
  const [loading, setLoading] = useState(true);
  const [applicationRound, setApplicationRound] = useState(0);

  const history = useHistory();
  const { t } = useTranslation();

  useEffect(() => {
    const load = async () => {
      const applicationRounds = await getApplicationRounds();
      setApplicationRoundOptions(
        applicationRounds
          .filter(
            (ar) =>
              applicationRoundState(
                ar.applicationPeriodBegin,
                ar.applicationPeriodEnd
              ) === 'active'
          )
          .map((ar) => ({ value: ar.id, label: ar.name }))
      );
      setLoading(false);
    };
    load();
  }, []);

  const createNewApplication = async (applicationRoundId: number) => {
    setLoading(true);

    const templateApplication = {
      ...deepCopy(minimalApplicationForInitialSave(applicationRoundId)),
    } as Application;

    const savedApplication = await saveApplication(templateApplication);
    if (savedApplication.id) {
      history.replace(`/application/${savedApplication.id}/page1`);
    } else {
      setLoading(false);
    }
  };

  return (
    <ApplicationPage
      translationKeyPrefix="Application.Intro"
      headContent={
        <Container>
          {loading ? (
            <CenterSpinner />
          ) : (
            <>
              <Select
                id="reservationUnitSearch.purpose"
                placeholder={t('common.select')}
                options={applicationRoundOptions}
                label=""
                onChange={(selection: OptionType): void => {
                  setApplicationRound(selection.value as number);
                }}
              />
              <Button
                disabled={!applicationRound}
                onClick={() => {
                  createNewApplication(applicationRound);
                }}>
                {t('Application.Intro.startNewApplication')}
              </Button>
            </>
          )}
        </Container>
      }>
      <Accordion heading={t('Application.Intro.faq1.question')}>
        {t('Application.Intro.faq1.answer')}
      </Accordion>
      <Accordion heading={t('Application.Intro.faq2.question')}>
        {t('Application.Intro.faq2.answer')}
      </Accordion>
      <Accordion heading={t('Application.Intro.faq3.question')}>
        {t('Application.Intro.faq3.answer')}
      </Accordion>
      <Container>
        <Button
          disabled={!applicationRound}
          onClick={() => {
            createNewApplication(applicationRound);
          }}>
          {t('Application.Intro.startNewApplication')}
        </Button>
      </Container>
    </ApplicationPage>
  );
};

export default Intro;
