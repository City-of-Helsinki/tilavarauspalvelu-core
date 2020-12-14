import React, { useState } from 'react';
import { Koros } from 'hds-react';
import { useTranslation } from 'react-i18next';
import Container from '../component/Container';
import Breadcrumb from '../component/Breadcrumb';
import SearchForm from './SearchForm';
import SearchResultList from './SearchResultList';
import { PageTitle } from '../component/PageTitle';
import StartApplicationBar from './StartApplicationBar';

const Search = (): JSX.Element => {
  const { t } = useTranslation();

  const [search, setSearch] = useState<string>('');
  return (
    <>
      <Container>
        <Breadcrumb
          current={{ label: 'breadcrumb.search', linkTo: '/search' }}
        />
        <PageTitle>{t('search.heading')}</PageTitle>
        <span className="text-lg">{t('search.text')}</span>
        <SearchForm onSearch={setSearch} />
      </Container>
      <Koros
        type="wave"
        className="koros"
        style={{ fill: 'var(--tilavaraus-gray)' }}
      />
      <div style={{ backgroundColor: 'var(--tilavaraus-gray)' }}>
        <Container main>
          <SearchResultList search={search} />
        </Container>
      </div>
      <StartApplicationBar />
    </>
  );
};

export default Search;
