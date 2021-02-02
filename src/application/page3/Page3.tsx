import { Button, IconArrowLeft, IconArrowRight, TextInput } from 'hds-react';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import styled from 'styled-components';
import { Action, Application as ApplicationType } from '../../common/types';
import { breakpoint } from '../../common/style';

type Props = {
  application: ApplicationType;
  dispatch: React.Dispatch<Action>;
  onNext: () => void;
};

const SubHeadline = styled.div`
  font-family: HelsinkiGrotesk-Bold, var(--font-default);
  margin-top: var(--spacing-layout-m);
  font-weight: 700;
  font-size: var(--fontsize-heading-m);
`;
const ButtonContainer = styled.div`
  display: flex;
  flex-direction: row;
  margin-top: var(--spacing-layout-l);
  justify-content: flex-end;

  button {
    margin-left: var(--spacing-layout-xs);
  }
`;
const TwoColumnContainer = styled.div`
  @media (max-width: ${breakpoint.m}) {
    grid-template-columns: 1fr;

    .fullWidth {
      grid-column-start: 1;
      grid-column-end: 3;
    }
  }

  margin-top: var(--spacing-m);
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-m);

  .fullWidth {
    grid-column-start: 1;
    grid-column-end: 3;
  }
`;

const Page3 = ({
  dispatch,
  onNext,
  application,
}: Props): JSX.Element | null => {
  if (application.contactPerson == null) {
    dispatch({ type: 'ensureContactPersonExists' });
  }
  const { t } = useTranslation();

  const { register, handleSubmit } = useForm({
    defaultValues: {
      ...application.contactPerson,
    },
  });

  const onSubmit = (data: ApplicationType) => {
    Object.assign(application.contactPerson, data);
    onNext();
  };

  return application.contactPerson != null ? (
    <form onSubmit={handleSubmit(onSubmit)}>
      <SubHeadline>
        {t('Application.Page3.asPrivatePersonSubHeading')}
      </SubHeadline>
      <TwoColumnContainer>
        <TextInput
          ref={register({ required: true })}
          label={t('Application.Page3.firstName')}
          id="firstName"
          name="firstName"
          required
        />
        <TextInput
          ref={register({ required: true, min: 0 })}
          label={t('Application.Page3.lastName')}
          id="lastName"
          name="lastName"
          required
        />
        <TextInput
          className="fullWidth"
          ref={register({ required: true, min: 0 })}
          label={t('Application.Page3.email')}
          id="email"
          name="email"
          type="email"
        />
      </TwoColumnContainer>
      <ButtonContainer>
        <Button variant="secondary" iconLeft={<IconArrowLeft />} disabled>
          {t('common.prev')}
        </Button>
        <Button
          iconRight={<IconArrowRight />}
          onClick={() => handleSubmit(onSubmit)()}>
          {t('common.next')}
        </Button>
      </ButtonContainer>
    </form>
  ) : null;
};

export default Page3;
