import { useEffect, useState } from 'react';

export type ApiData<F, T> = {
  data?: F;
  transformed?: T;
  status: State;
};

// eslint-disable-next-line
const identity = (f: any) => f;

type State = 'init' | 'loading' | 'error' | 'done';

export function useApiData<F, T, P>(
  apiFunction: (params: P) => Promise<F>,
  apiParams?: P,
  transform: (from: F) => T = identity
): ApiData<F, T> {
  const [data, setData] = useState<ApiData<F, T>>({
    status: 'init',
  });
  useEffect(() => {
    async function fetchData() {
      if (!apiParams) {
        return;
      }
      try {
        const loadedData = await apiFunction(apiParams);
        setData({
          data: loadedData,
          transformed: transform(loadedData),
          status: 'done',
        });
      } catch (e) {
        setData({ data: undefined, status: 'error' });
      }
    }
    if (data.status === 'init' && apiParams) {
      setData({ data: undefined, status: 'loading' });
      fetchData();
    }
  }, [apiFunction, apiParams, data, transform]);

  return { ...data };
}

export function useApiDataNoParams<F, T>(
  apiFunction: () => Promise<F>,
  transform: (from: F) => T = identity
): ApiData<F, T> {
  const [data, setData] = useState<ApiData<F, T>>({
    status: 'init',
  });
  useEffect(() => {
    async function fetchData() {
      try {
        const loadedData = await apiFunction();

        setData({
          data: loadedData,
          transformed: transform(loadedData),
          status: 'done',
        });
      } catch (e) {
        setData({ data: undefined, status: 'error' });
      }
    }
    if (data.status === 'init') {
      setData({ data: undefined, status: 'loading' });
      fetchData();
    }
  }, [apiFunction, data, transform]);

  return { ...data };
}
