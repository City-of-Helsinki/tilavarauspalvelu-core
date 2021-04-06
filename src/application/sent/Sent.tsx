import React from 'react';
import { useTranslation } from 'react-i18next';
import { AccordionWithState as Accordion } from '../../component/Accordion';
import Container from '../../component/Container';
import Head from '../Head';

type Props = {
  breadCrumbText: string;
};
const Sent = ({ breadCrumbText }: Props): JSX.Element => {
  const { t } = useTranslation();

  return (
    <>
      <Head
        heading={t('Application.sent.heading')}
        breadCrumbText={breadCrumbText}
      />
      <Container main>
        <Accordion heading={t('Application.sent.faq1Question')}>
          {t('Application.sent.faq1Answer')}
        </Accordion>
        <Accordion heading={t('Application.sent.faq2Question')}>
          {t('Application.sent.faq2Answer')}
        </Accordion>
        <Accordion heading={t('Application.sent.faq3Question')}>
          {t('Application.sent.faq3Answer')}
        </Accordion>
      </Container>
    </>
  );
};

export default Sent;
