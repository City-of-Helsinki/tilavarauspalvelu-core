import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Checkbox, Select, Button, IconSearch, SearchInput } from 'hds-react';

import styles from './SearchForm.module.scss';

interface Props {
  // only text search is now implemented!
  onSearch: (text: string) => void;
}
interface OptionType {
  label: string;
}

const options = [] as OptionType[];

const SearchForm = ({ onSearch }: Props): JSX.Element => {
  const { t } = useTranslation();
  const [q, setQ] = useState<string>();
  return (
    <>
      <div className={styles.container}>
        <SearchInput
          label="&nbsp;"
          helperText={t('SearchForm.searchTermPlaceholder')}
          onSubmit={(e) => {
            setQ(e);
            onSearch(e);
          }}
        />
        <Select placeholder="Valitse" disabled options={options} label="Haku" />
        <div className={styles.showL} />
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
        <div className={styles.showM} />
        <Checkbox
          disabled
          id="checkbox1"
          label="Sopiva liikuntarajoitteisille"
        />
        <Checkbox disabled id="checkbox2" label="Lähimmät paikat ensin" />
      </div>
      <hr className={styles.hr} />
      <div className={styles.buttonContainer}>
        <Button
          onClick={() => {
            onSearch(q || '');
          }}
          iconLeft={<IconSearch />}>
          {t('SearchForm.searchButton')}
        </Button>
      </div>
    </>
  );
};

export default SearchForm;
