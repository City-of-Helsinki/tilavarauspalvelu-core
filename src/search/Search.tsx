import React, { useState, useEffect } from 'react';
import { Koros } from 'hds-react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';
import queryString from 'query-string';
import { useHistory } from 'react-router-dom';
import Container from '../component/Container';
import Breadcrumb from '../component/Breadcrumb';
import SearchForm from './SearchForm';
import SearchResultList from './SearchResultList';
import { getReservationUnits, ReservationUnitsParameters } from '../common/api';
import { ReservationUnit } from '../common/types';
import { searchUrl } from '../common/util';
import { searchPrefix } from '../common/const';
import { CenterSpinner } from '../component/common';

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

  const [values, setValues] = useState({} as Record<string, string>);
  const [state, setState] = useState<'loading' | 'done' | 'error'>('done');

  const [reservationUnits, setReservationUnits] = useState<
    ReservationUnit[] | null
  >(null);

  const searchParams = useHistory().location.search;

  useEffect(() => {
    if (searchParams) {
      const parsed = queryString.parse(searchParams);

      const newValues = Object.keys(parsed).reduce((p, key) => {
        if (parsed[key]) {
          return { ...p, [key]: parsed[key]?.toString() } as Record<
            string,
            string
          >;
        }
        return p;
      }, {} as Record<string, string>);

      setValues(newValues);
      setState('loading');
      getReservationUnits(newValues)
        .then((v) => {
          setReservationUnits(v);
          setState('done');
        })
        .catch(() => {
          setState('error');
          setReservationUnits(null);
        });
    }
  }, [searchParams, setReservationUnits]);

  const history = useHistory();

  const onSearch = async (criteria: ReservationUnitsParameters) => {
    history.replace(searchUrl(criteria));
  };

  return (
    <>
      <HeadContainer>
        <Container>
          <Breadcrumb
            current={{ label: 'breadcrumb.search', linkTo: searchPrefix }}
          />
          <h1 style={style}>{t('search.heading')}</h1>
          <span className="text-lg">{t('search.text')}</span>
          <SearchForm onSearch={onSearch} formValues={values} />
        </Container>
      </HeadContainer>
      <StyledKoros type="wave" className="koros" flipHorizontal />
      {state === 'loading' ? (
        <CenterSpinner />
      ) : (
        <SearchResultList
          error={state === 'error'}
          reservationUnits={reservationUnits}
        />
      )}
    </>
  );
};

export default Search;
