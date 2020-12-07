import React, { useState } from 'react';
import { Koros } from 'hds-react';
import Container from '../component/Container';
import Breadcrumb from '../component/Breadcrumb';
import SearchForm from './SearchForm';
import SearchResultList from './SearchResultList';
import { PageTitle } from '../component/PageTitle';

const Search = (): JSX.Element => {
  // const { t } = useTranslation();

  const [search, setSearch] = useState<string>('');
  return (
    <>
      <Container>
        <Breadcrumb
          current={{ label: 'breadcrumb.search', linkTo: '/search' }}
        />
        <PageTitle>Vakiovuorojen tilat</PageTitle>
        <span className="text-lg">
          Valitse tilat joihin haluat hakea vakiovuoroja.
        </span>
        <SearchForm onSearch={setSearch} />
      </Container>
      <Koros type="wave" className="koros" style={{ fill: '#f5f6f8' }} />
      <div style={{ backgroundColor: '#f5f6f8' }}>
        <Container main>
          <SearchResultList search={search} />
        </Container>
      </div>
    </>
  );
};

export default Search;
