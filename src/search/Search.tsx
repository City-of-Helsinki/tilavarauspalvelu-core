import React from 'react';
// import { useTranslation } from 'react-i18next';
import MainContainer from '../component/MainContainer';
import Breadcrumb from '../component/Breadcrumb';
import SearchForm from './SearchForm';
import { PageTitle } from '../component/PageTitle';

const Search = (): JSX.Element => {
  // const { t } = useTranslation();
  return (
    <>
      <MainContainer>
        <Breadcrumb
          current={{ label: 'breadcrumb.search', linkTo: '/search' }}
        />
        <PageTitle>Vakiovuorojen tilat</PageTitle>
        <span className="text-lg">
          Valitse tilat joihin haluat hakea vakiovuoroja.
        </span>
        <SearchForm />
      </MainContainer>
    </>
  );
};

export default Search;
