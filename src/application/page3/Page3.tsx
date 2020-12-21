import { Button, IconArrowLeft, IconArrowRight, TextInput } from 'hds-react';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import styles from './Page3.module.scss';
import { Action, Application as ApplicationType } from '../../common/types';

type Props = {
  application: ApplicationType;
  dispatch: React.Dispatch<Action>;
  onNext: () => void;
};

const Page1 = ({
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

  const onSubmit = (data: any) => {
    Object.assign(application.contactPerson, data);
    onNext();
  };

  return application.contactPerson != null ? (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className={styles.subHeadLine}>
        {t('Application.Page3.asPrivatePersonSubHeading')}
      </div>
      <div className={styles.twoColumnContainer}>
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
          className={styles.fullWidth}
          ref={register({ required: true, min: 0 })}
          label={t('Application.Page3.email')}
          id="email"
          name="email"
          type="email"
        />
      </div>
      <div className={styles.buttonContainer}>
        <Button variant="secondary" iconLeft={<IconArrowLeft />} disabled>
          {t('common.prev')}
        </Button>
        <Button
          iconRight={<IconArrowRight />}
          onClick={() => handleSubmit(onSubmit)()}>
          {t('common.next')}
        </Button>
      </div>
    </form>
  ) : null;
};

export default Page1;
