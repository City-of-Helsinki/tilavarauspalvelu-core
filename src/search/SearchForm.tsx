import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Checkbox, Select, TextInput, Button, IconSearch } from 'hds-react';
import { useForm } from 'react-hook-form';
import styled from 'styled-components';
import { breakpoint } from '../common/style';
import { getParameters } from '../common/api';
import { mapOptions, OptionType } from '../common/util';

export type Criteria = {
  text: string;
  purpose: number;
};

type Props = {
  onSearch: (search: Criteria) => void;
};

const options = [] as OptionType[];

const Container = styled.div`
  @media (max-width: ${breakpoint.m}) {
    grid-template-columns: 1fr 1fr;
  }

  @media (max-width: ${breakpoint.s}) {
    grid-template-columns: 1fr;
  }

  margin-top: var(--spacing-s);
  max-width: 100%;
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  grid-gap: var(--spacing-m);
  font-size: var(--fontsize-body-m);
`;

const ShowL = styled.div`
  @media (max-width: ${breakpoint.m}) {
    display: none;
  }

  display: block;
`;

const ShowM = styled.div`
  @media (max-width: ${breakpoint.m}) {
    display: block;
  }

  @media (max-width: ${breakpoint.s}) {
    display: none;
  }

  display: none;
`;

const Hr = styled.hr`
  margin-top: var(--spacing-l);
`;

const ButtonContainer = styled.div`
  margin-top: var(--spacing-l);
  display: flex;
  justify-content: flex-end;
`;

const SearchForm = ({ onSearch }: Props): JSX.Element | null => {
  const { t } = useTranslation();
  const [ready, setReady] = useState<boolean>(false);

  const [purposeOptions, setPurposeOptions] = useState<OptionType[]>([]);

  const { register, handleSubmit, setValue } = useForm();

  useEffect(() => {
    register({ name: 'purpose' });
  }, [register]);

  useEffect(() => {
    async function fetchData() {
      const fetchedPurposeOptions = await getParameters('purpose');
      setPurposeOptions(mapOptions(fetchedPurposeOptions, t('common.select')));
      setReady(true);
    }
    fetchData();
  }, [t]);
  const search = (criteria: Criteria) => {
    onSearch(criteria);
  };

  if (!ready) {
    return null;
  }

  return (
    <>
      <Container>
        <TextInput
          id="search"
          name="search"
          ref={register}
          label="&nbsp;"
          placeholder={t('SearchForm.searchTermPlaceholder')}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleSubmit(search)();
            }
          }}
        />
        <Select
          placeholder={t('common.select')}
          disabled
          options={options}
          label="Haku"
        />
        <ShowL />
        <Select
          id="purpose"
          placeholder={t('common.select')}
          options={purposeOptions}
          onChange={(selection: OptionType): void => {
            setValue('purpose', selection.value);
          }}
          defaultValue={purposeOptions[0]}
          label="Käyttötarkoitus"
        />
        <Select
          placeholder={t('common.select')}
          disabled
          options={options}
          label="Kaupunginosa"
        />
        <Select
          placeholder={t('common.select')}
          disabled
          options={options}
          label="Hinta"
        />
        <ShowM />
        <Checkbox
          disabled
          id="checkbox1"
          label="Sopiva liikuntarajoitteisille"
        />
        <Checkbox disabled id="checkbox2" label="Lähimmät paikat ensin" />
      </Container>
      <Hr />
      <ButtonContainer>
        <Button onClick={handleSubmit(search)} iconLeft={<IconSearch />}>
          {t('SearchForm.searchButton')}
        </Button>
      </ButtonContainer>
    </>
  );
};

export default SearchForm;
