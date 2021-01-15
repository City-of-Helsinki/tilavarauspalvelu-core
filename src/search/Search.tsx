import React, { useState } from 'react';
import { Koros } from 'hds-react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';
import Container from '../component/Container';
import Breadcrumb from '../component/Breadcrumb';
import SearchForm from './SearchForm';
import SearchResultList from './SearchResultList';

const style = {
  fontSize: 'var(--fontsize-heading-l)',
} as React.CSSProperties;

const HeadContainer = styled.div`
  background-color: white;
  padding-top: var(--spacing-layout-xs);
`;

const StyledKoros = styled(Koros)`
  fill: white;
`;

const Search = (): JSX.Element => {
  const { t } = useTranslation();

  const [search, setSearch] = useState<string>('');
  return (
    <>
      <HeadContainer>
        <Container>
          <Breadcrumb
            current={{ label: 'breadcrumb.search', linkTo: '/search' }}
          />
          <h1 style={style}>{t('search.heading')}</h1>
          <span className="text-lg">{t('search.text')}</span>
          <SearchForm onSearch={setSearch} />
        </Container>
      </HeadContainer>
      <StyledKoros type="wave" className="koros" flipHorizontal />
      <Container main>
        <SearchResultList search={search} />
      </Container>
    </>
  );
};

export default Search;
