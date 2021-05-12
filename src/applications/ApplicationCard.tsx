import React, { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { TFunction } from 'i18next';
import styled from 'styled-components';
import { useHistory } from 'react-router-dom';
import {
  Button,
  Card as HdsCard,
  Notification,
  Tag as HdsTag,
} from 'hds-react';
import { parseISO } from 'date-fns';
import { Application, ApplicationRound } from '../common/types';
import {
  isActive,
  applicationUrl,
  resolutionUrl,
  getReducedApplicationStatus,
} from '../common/util';
import { breakpoint } from '../common/style';
import ConfirmationModal, { ModalRef } from '../component/ConfirmationModal';
import { CenterSpinner } from '../component/common';
import { cancelApplication } from '../common/api';

const Card = styled(HdsCard)`
  margin-bottom: var(--spacing-m);
  @media (max-width: ${breakpoint.l}) {
    grid-template-columns: 1fr;
  }
  width: auto;
`;

const Tag = styled(HdsTag)`
  && {
    margin-top: var(--spacing-xs);
    color: var(--color-white);
    background-color: var(--tilavaraus-blue);
    font-family: var(--font-regular);
  }
`;

const GreenTag = styled(Tag)`
  && {
    background-color: var(--tilavaraus-green);
  }
`;

const YellowTag = styled(Tag)`
  && {
    background-color: var(--tilavaraus-yellow);
    color: var(--color-black);
  }
`;

const Buttons = styled.div`
  font-family: var(--font-medium);
  font-size: var(--fontsize-body-s);
  margin-top: var(--spacing-m);
`;

const Applicant = styled.div`
  font-family: var(--font-regular);
  font-size: var(--fontsize-body-m);
  margin-top: var(--spacing-xs);
  margin-bottom: var(--spacing-s);
`;

const RoundName = styled.div`
  margin-top: var(--spacing-xs);
  font-size: var(--fontsize-heading-m);
  font-family: var(--font-bold);
  margin-bottom: 0;
  @media (max-width: ${breakpoint.s}) {
    font-size: var(--fontsize-heading-m);
  }
`;

const Modified = styled.div`
  font-size: var(--fontsize-body-m);
  font-family: var(--font-regular);
`;

const StyledButton = styled(Button)`
  margin-right: var(--spacing-xs);
  font-size: var(--fontsize-body-m);
  @media (max-width: ${breakpoint.s}) {
    margin-top: var(--spacing-xs);
    margin-right: 0;
    width: 100%;
  }
`;
type Props = {
  application: Application;
  applicationRound: ApplicationRound;
};

const getApplicant = (application: Application, t: TFunction): string => {
  if (application.organisation) {
    return t('ApplicationCard.organisation', {
      type: t(`ApplicationCard.applicantType.${application.applicantType}`),
      name: application.organisation?.name || t('ApplicationCard.noName'),
    });
  }
  if (application.contactPerson) {
    return t('ApplicationCard.person');
  }

  return '';
};

const ApplicationCard = ({
  application,
  applicationRound,
}: Props): JSX.Element | null => {
  const [state, setState] = useState<'ok' | 'cancelling' | 'error'>('ok');
  const { t } = useTranslation();
  const history = useHistory();
  const editable = isActive(
    applicationRound.applicationPeriodBegin,
    applicationRound.applicationPeriodEnd
  );

  const reducedApplicationStatus = getReducedApplicationStatus(
    application.status
  );

  let C = Tag;
  if (reducedApplicationStatus === 'draft') {
    C = YellowTag;
  }
  if (reducedApplicationStatus === 'handled') {
    C = GreenTag;
  }

  const cancel = async () => {
    setState('cancelling');
    try {
      await cancelApplication(application.id as number);
      history.go(0);
    } catch (e) {
      setState('error');
    }
  };

  const modal = useRef<ModalRef>();
  return (
    <Card border key={application.id}>
      <div>
        <C>{t(`ApplicationCard.status.${reducedApplicationStatus}`)}</C>
        <RoundName>{applicationRound.name}</RoundName>
        <Applicant>
          {application.applicantType !== null
            ? getApplicant(application, t)
            : ''}
        </Applicant>
        <Modified>
          {application.lastModifiedDate
            ? t('ApplicationCard.saved', {
                date: parseISO(application.lastModifiedDate),
              })
            : ''}
        </Modified>
        {state === 'error' ? (
          <Notification size="small">
            {t('ApplicationCard.cancelFailed')}
          </Notification>
        ) : null}
      </div>
      <Buttons>
        <StyledButton
          disabled={!editable}
          onClick={() => {
            history.push(`${applicationUrl(application.id as number)}/page1`);
          }}>
          {t('ApplicationCard.edit')}
        </StyledButton>
        {state === 'cancelling' ? (
          <CenterSpinner />
        ) : (
          <StyledButton
            disabled={!editable}
            onClick={() => {
              modal?.current?.open();
            }}
            variant="danger">
            {t('ApplicationCard.cancel')}
          </StyledButton>
        )}
        <StyledButton
          disabled={!(reducedApplicationStatus === 'handled')}
          onClick={() => {
            history.push(`${resolutionUrl(application.id as number)}`);
          }}>
          {t('ApplicationCard.reservations')}
        </StyledButton>
      </Buttons>
      <ConfirmationModal
        id="application-card-modal"
        heading={t('ApplicationCard.cancelHeading')}
        content={t('ApplicationCard.cancelContent')}
        ref={modal}
        onOk={cancel}
        cancelLabel={t('common.close')}
      />
    </Card>
  );
};

export default ApplicationCard;
