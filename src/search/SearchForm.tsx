import React from 'react';
// import { useTranslation } from 'react-i18next';
import { Checkbox, Select, TextInput, Button, IconSearch } from 'hds-react';

import styles from './SearchForm.module.scss';

interface OptionType {
  label: string;
}

const options = [] as OptionType[];

const Home = (): JSX.Element => {
  // const { t } = useTranslation();
  return (
    <>
      <div className={styles.container}>
        <TextInput label="&nbsp;" placeholder="Hae sanalla" id="search" />
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
        <Checkbox id="checkbox" label="Sopiva liikuntarajoitteisille" />
        <Checkbox id="checkbox" label="Lähimmät paikat ensin" />
      </div>
      <hr className={styles.hr} />
      <div className={styles.buttonContainer}>
        <Button iconLeft={<IconSearch />}>Hae tilaa</Button>
      </div>
    </>
  );
};

export default Home;
