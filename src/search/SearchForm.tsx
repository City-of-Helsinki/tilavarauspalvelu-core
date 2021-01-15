import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Checkbox, Select, TextInput, Button, IconSearch } from 'hds-react';
import styled from 'styled-components';

interface Props {
  // only text search is now implemented!
  onSearch: (text: string) => void;
}
interface OptionType {
  label: string;
}

const options = [] as OptionType[];

const Container = styled.div`
  @media (max-width: var(--breakpoint-m)) {
    grid-template-columns: 1fr 1fr;
  }
  @media (max-width: var(--breakpoint-s)) {
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
  @media (max-width: var(--breakpoint-m)) {
    display: none;
  }
  display: block;
`;

const ShowM = styled.div`
  @media (max-width: var(--breakpoint-m)) {
    display: block;
  }
  @media (max-width: var(--breakpoint-s)) {
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

const SearchForm = ({ onSearch }: Props): JSX.Element => {
  const { t } = useTranslation();
  const [q, setQ] = useState<string>();

  const search = () => {
    onSearch(q || '');
  };

  return (
    <>
      <Container>
        <TextInput
          id="search"
          label="&nbsp;"
          helperText={t('SearchForm.searchTermPlaceholder')}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              search();
            }
          }}
        />
        <Select placeholder="Valitse" disabled options={options} label="Haku" />
        <ShowL />
        <Select
          placeholder="Valitse"
          disabled
          options={options}
          label="Käyttötarkoitus"
        />
        <Select
          placeholder="Valitse"
          disabled
          options={options}
          label="Kaupunginosa"
        />
        <Select
          placeholder="Valitse"
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
        <Button onClick={search} iconLeft={<IconSearch />}>
          {t('SearchForm.searchButton')}
        </Button>
      </ButtonContainer>
    </>
  );
};

export default SearchForm;
