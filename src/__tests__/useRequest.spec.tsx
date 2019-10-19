import React from 'react';
import { createStore, combineReducers } from 'redux';
import { cleanup } from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import { renderHook } from '@testing-library/react-hooks';
import { Provider } from '../context';
import { getRequestHash } from '../getRequestHash';
import { createFetchMockResolver } from '../resolvers/mockResolver';
import { createReducers } from '../createReducers';
import { useRequest } from '../useRequest';

async function waitNextUpdateShouldNotAppear(testWaitForNextUpdate: any, timeout = 3000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      resolve();
    }, timeout);
    testWaitForNextUpdate().then(() => {
      clearTimeout(timer);
      console.error('Update appear but it shouln\'t');
      reject();
    });
  });
}

function getDefaultRequestArgs() {
  const url = 'http://website.com/articles?pageSize=10';
  const method = 'GET';
  const params = {
    pageSize: '10',
  };

  return {
    url,
    method,
    params,
  };
}

function getFakeState() {
  const { url, method, params } = getDefaultRequestArgs();

  const requestKey = getRequestHash(url, method, params);

  return {
    articles: {
      resources: {
        article_1: {
          id: 'article_1',
          name: 'Artice 1',
        },
      },
      requests: {
        [requestKey]: {
          requestKey,
          ids: ['article_1'],
          includedResources: {},
          isList: true,
          status: 'SUCCEEDED',
        },
      },
    },
  };
}

function getFakeFetch() {
  return jest.fn(() => {
    const stream = {
      json: () => {},
    };

    return Promise.resolve(stream);
  });
}

function getFakeStore() {
  const resourcesConfig = {
    articles: {},
  };

  const reducers = createReducers(resourcesConfig);

  // @ts-ignore
  const store = createStore(combineReducers(reducers), getFakeState());

  return store;
}

function getWrapper(options = {}) {
  const {
    store,
    fakeFetch,
  } = {
    store: getFakeStore(),
    fakeFetch: getFakeFetch(),
    ...options,
  };

  const wrapper = ({ children }: any) => {
    const config = {
      articles: {},
    };

    const providerValue: any = {
      config,
      resolver: createFetchMockResolver(fakeFetch),
      store,
    };

    return (
      <Provider value={providerValue}>
        {children}
      </Provider>
    );
  };

  return {
    store,
    fakeFetch,
    wrapper,
  };
}

afterEach(cleanup);

describe('useRequest', () => {
  it('should return an array', () => {
    const { wrapper } = getWrapper();

    const { result } = renderHook(() => useRequest({ ...getDefaultRequestArgs() }), { wrapper });

    expect(result.current).toBeInstanceOf(Array);
  });

  it('fetchPolicy: cache-first - with cache', async () => {
    const { wrapper, fakeFetch } = getWrapper();

    const useRequestFn = jest.fn(useRequest);

    const { result, waitForNextUpdate } = renderHook(() => {
      return useRequestFn({ ...getDefaultRequestArgs() }, { fetchPolicy: 'cache-first' });
    }, { wrapper });

    const returnExpected = [
      [{
        id: 'article_1',
        name: 'Artice 1',
      }],
      {
        pending: false,
      },
    ];
    expect(result.current).toEqual(returnExpected);

    await act(async () => {
      await waitNextUpdateShouldNotAppear(waitForNextUpdate, 500);
    });

    expect(fakeFetch).toBeCalledTimes(0);
    expect(useRequestFn).toBeCalledTimes(1);
  });

  it('fetchPolicy: cache-first - without cache', async () => {
    const requestArgs = {
      url: 'http://website.com/articles?pageSize=20',
      method: 'GET',
    };

    const store = getFakeStore();

    const fakeFetch = jest.fn(() => {
      return Promise.resolve({
        json: () => [
          {
            id: 'article_1',
            name: 'Artice 1',
          },
        ],
      });
    });

    const { wrapper } = getWrapper({ fakeFetch, store });

    const useRequestFn = jest.fn(useRequest);

    const { result, waitForNextUpdate } = renderHook(() => {
      return useRequestFn({ ...requestArgs }, { fetchPolicy: 'cache-first' });
    }, { wrapper });

    const firstReturnExpected = [null, { pending: true }];
    const secondReturnExpected = [
      [{
        id: 'article_1',
        name: 'Artice 1',
      }],
      {
        pending: false,
      },
    ];

    expect(result.current).toEqual(firstReturnExpected);

    await act(async () => {
      await waitForNextUpdate();
      expect(result.current).toEqual(secondReturnExpected);
      await waitNextUpdateShouldNotAppear(waitForNextUpdate, 500);
    });

    expect(fakeFetch).toBeCalledTimes(1);
    expect(useRequestFn).toBeCalledTimes(2);
  });

  it('fetchPolicy: cache-and-network - with cache', async () => {
    const fakeFetch = jest.fn(() => {
      return Promise.resolve({
        json: () => [
          {
            id: 'article_1',
            name: 'Artice 1',
          },
        ],
      });
    });

    const { wrapper } = getWrapper({ fakeFetch });

    const useRequestFn = jest.fn(useRequest);

    const { result, waitForNextUpdate } = renderHook(() => {
      return useRequestFn({ ...getDefaultRequestArgs() }, { fetchPolicy: 'cache-and-network' });
    }, { wrapper });

    const returnExpected = [
      [{
        id: 'article_1',
        name: 'Artice 1',
      }],
      {
        pending: false,
      },
    ];

    expect(result.current).toEqual(returnExpected);

    await act(async () => {
      await waitForNextUpdate();
      expect(result.current).toEqual(returnExpected);
      await waitNextUpdateShouldNotAppear(waitForNextUpdate, 500);
    });

    expect(fakeFetch).toBeCalledTimes(1);

    // currently call 2 times, but we should improve it and make a deep compare before dispatch server response
    expect(useRequestFn).toBeCalledTimes(2);
  });

  it('fetchPolicy: network-only', async () => {
    const fakeFetch = jest.fn(() => {
      return Promise.resolve({
        json: () => [
          {
            id: 'article_1',
            name: 'Artice 1',
          },
        ],
      });
    });

    const { wrapper } = getWrapper({ fakeFetch });

    const useRequestFn = jest.fn(useRequest);

    const { result, waitForNextUpdate } = renderHook(() => {
      return useRequestFn({ ...getDefaultRequestArgs() }, { fetchPolicy: 'network-only' });
    }, { wrapper });

    const firstReturnExpected = [null, { pending: true }];
    const secondReturnExpected = [
      [{
        id: 'article_1',
        name: 'Artice 1',
      }],
      {
        pending: false,
      },
    ];

    expect(result.current).toEqual(firstReturnExpected);

    await act(async () => {
      await waitForNextUpdate();
      expect(result.current).toEqual(secondReturnExpected);
      await waitNextUpdateShouldNotAppear(waitForNextUpdate, 500);
    });

    expect(useRequestFn).toHaveBeenCalledTimes(2);
  });

  it('fetchPolicy: cache-only', async () => {
    const { wrapper, fakeFetch } = getWrapper();

    const useRequestFn = jest.fn(useRequest);

    const { result, waitForNextUpdate } = renderHook(() => {
      return useRequestFn({ ...getDefaultRequestArgs() }, { fetchPolicy: 'cache-only' });
    }, { wrapper });

    const returnExpected = [
      [{
        id: 'article_1',
        name: 'Artice 1',
      }],
      {
        pending: false,
      },
    ];

    expect(result.current).toEqual(returnExpected);

    await act(async () => {
      await waitNextUpdateShouldNotAppear(waitForNextUpdate, 500);
    });

    expect(fakeFetch).toBeCalledTimes(0);
    expect(useRequestFn).toBeCalledTimes(1);
  });
});
