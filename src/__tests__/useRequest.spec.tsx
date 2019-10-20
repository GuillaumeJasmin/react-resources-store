import React from 'react';
import { createStore, combineReducers } from 'redux';
import { cleanup } from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import { renderHook } from '@testing-library/react-hooks';
import { Provider } from '../context';
import { getRequestHash } from '../getRequestHash';
import { createFetchMockResolver } from './mockResolver';
import { createReducers } from '../createReducers';
import { useRequest } from '../useRequest';

function timeout(delay = 1000) {
  return new Promise((resolve: any) => setTimeout(resolve, delay));
}

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

function getRequestArgsCached() {
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

function getRequestArgsNotCached() {
  const url = 'http://website.com/articles?pageSize=20';
  const method = 'GET';
  const params = {
    pageSize: '20',
  };

  return {
    url,
    method,
    params,
  };
}

function getFakeState() {
  const { url, method, params } = getRequestArgsCached();

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

function getFakeFetch(output: any = undefined) {
  return jest.fn(async () => {
    await timeout(500);

    return {
      json: () => output,
    };
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

    const { result } = renderHook(() => useRequest({ ...getRequestArgsCached() }), { wrapper });

    expect(result.current).toBeInstanceOf(Array);
  });

  it('fetchPolicy: cache-first - with cache', async () => {
    const { wrapper, fakeFetch } = getWrapper();

    const useRequestFn = jest.fn(useRequest);

    const { result, waitForNextUpdate } = renderHook(() => {
      return useRequestFn({ ...getRequestArgsCached() }, { fetchPolicy: 'cache-first' });
    }, { wrapper });

    expect(result.current[0]).toEqual([{
      id: 'article_1',
      name: 'Artice 1',
    }]);
    expect(result.current[1].loading).toBe(false);
    expect(result.current[1].requestPending).toBe(false);

    await act(async () => {
      await waitNextUpdateShouldNotAppear(waitForNextUpdate, 500);
    });

    expect(fakeFetch).toBeCalledTimes(0);
    expect(useRequestFn).toBeCalledTimes(1);
  });

  it('fetchPolicy: cache-first - with cache - refetch', async () => {
    const { wrapper, fakeFetch } = getWrapper();

    const useRequestFn = jest.fn(useRequest);

    const { result, waitForNextUpdate } = renderHook(() => {
      return useRequestFn({ ...getRequestArgsCached() }, { fetchPolicy: 'cache-first' });
    }, { wrapper });

    expect(result.current[0]).toEqual([{
      id: 'article_1',
      name: 'Artice 1',
    }]);
    expect(result.current[1].loading).toBe(false);
    expect(result.current[1].requestPending).toBe(false);

    await act(async () => {
      result.current[1].refetch();
      expect(result.current[1].loading).toBe(false);
      expect(result.current[1].requestPending).toBe(true);
      await waitForNextUpdate();
      expect(result.current[1].loading).toBe(false);
      expect(result.current[1].requestPending).toBe(false);
      await waitNextUpdateShouldNotAppear(waitForNextUpdate, 500);
    });

    expect(fakeFetch).toBeCalledTimes(1);
    expect(useRequestFn).toBeCalledTimes(3);
  });

  it('fetchPolicy: cache-first - without cache', async () => {
    const store = getFakeStore();
    const fakeFetch = getFakeFetch([
      {
        id: 'article_1',
        name: 'Artice 1',
      },
    ]);

    const { wrapper } = getWrapper({ fakeFetch, store });

    const useRequestFn = jest.fn(useRequest);

    const { result, waitForNextUpdate } = renderHook(() => {
      return useRequestFn({ ...getRequestArgsNotCached() }, { fetchPolicy: 'cache-first' });
    }, { wrapper });

    expect(result.current[0]).toEqual(null);
    expect(result.current[1].loading).toBe(true);
    expect(result.current[1].requestPending).toBe(true);

    await act(async () => {
      await waitForNextUpdate();
      expect(result.current[0]).toEqual([{
        id: 'article_1',
        name: 'Artice 1',
      }]);
      expect(result.current[1].loading).toBe(false);
      expect(result.current[1].requestPending).toBe(false);
      await waitNextUpdateShouldNotAppear(waitForNextUpdate, 500);
    });

    expect(fakeFetch).toBeCalledTimes(1);
    expect(useRequestFn).toBeCalledTimes(2);
  });

  it('fetchPolicy: cache-and-network - with cache', async () => {
    const fakeFetch = getFakeFetch([
      {
        id: 'article_1',
        name: 'Artice 1',
      },
    ]);

    const { wrapper } = getWrapper({ fakeFetch });

    const useRequestFn = jest.fn(useRequest);

    const { result, waitForNextUpdate } = renderHook(() => {
      return useRequestFn({ ...getRequestArgsCached() }, { fetchPolicy: 'cache-and-network' });
    }, { wrapper });

    expect(result.current[0]).toEqual([{
      id: 'article_1',
      name: 'Artice 1',
    }]);
    expect(result.current[1].loading).toBe(false);
    expect(result.current[1].requestPending).toBe(true);

    await act(async () => {
      await waitForNextUpdate();
      expect(result.current[0]).toEqual([
        {
          id: 'article_1',
          name: 'Artice 1',
        },
      ]);
      expect(result.current[1].loading).toBe(false);
      expect(result.current[1].requestPending).toBe(false);
      await waitNextUpdateShouldNotAppear(waitForNextUpdate, 500);
    });

    expect(fakeFetch).toBeCalledTimes(1);

    // currently call 2 times, but we should improve it and make a deep compare before dispatch server response
    expect(useRequestFn).toBeCalledTimes(2);
  });

  it('fetchPolicy: cache-and-network - without cache', async () => {
    const fakeFetch = getFakeFetch([
      {
        id: 'article_1',
        name: 'Artice 1',
      },
    ]);

    const { wrapper } = getWrapper({ fakeFetch });

    const useRequestFn = jest.fn(useRequest);

    const { result, waitForNextUpdate } = renderHook(() => {
      return useRequestFn({ ...getRequestArgsNotCached() }, { fetchPolicy: 'cache-and-network' });
    }, { wrapper });

    expect(result.current[0]).toEqual(null);
    expect(result.current[1].loading).toBe(true);
    expect(result.current[1].requestPending).toBe(true);

    await act(async () => {
      await waitForNextUpdate();
      expect(result.current[0]).toEqual([
        {
          id: 'article_1',
          name: 'Artice 1',
        },
      ]);
      expect(result.current[1].loading).toBe(false);
      expect(result.current[1].requestPending).toBe(false);
      result.current[1].refetch();
      expect(result.current[1].loading).toBe(false);
      expect(result.current[1].requestPending).toBe(true);
      await waitForNextUpdate();
      expect(result.current[1].loading).toBe(false);
      expect(result.current[1].requestPending).toBe(false);
      await waitNextUpdateShouldNotAppear(waitForNextUpdate, 500);
    });

    expect(fakeFetch).toBeCalledTimes(2);

    // currently call 2 times, but we should improve it and make a deep compare before dispatch server response
    expect(useRequestFn).toBeCalledTimes(4);
  });

  it('fetchPolicy: network-only', async () => {
    const fakeFetch = getFakeFetch([
      {
        id: 'article_1',
        name: 'Artice 1',
      },
    ]);

    const { wrapper } = getWrapper({ fakeFetch });

    const useRequestFn = jest.fn(useRequest);

    const { result, waitForNextUpdate } = renderHook(() => {
      return useRequestFn({ ...getRequestArgsCached() }, { fetchPolicy: 'network-only' });
    }, { wrapper });

    expect(result.current[0]).toEqual(null);
    expect(result.current[1].loading).toBe(true);
    expect(result.current[1].requestPending).toBe(true);

    // leave rthis console.log to debug when test failed (bug hard to reproduce)
    // eslint-disable-next-line
    console.log('firstReturnExpected', result.current);

    await act(async () => {
      await waitForNextUpdate();
      expect(result.current[0]).toEqual([
        {
          id: 'article_1',
          name: 'Artice 1',
        },
      ]);
      expect(result.current[1].loading).toBe(false);
      expect(result.current[1].requestPending).toBe(false);
      await waitNextUpdateShouldNotAppear(waitForNextUpdate, 500);
    });

    expect(useRequestFn).toHaveBeenCalledTimes(2);
  });

  it('fetchPolicy: cache-only - with cache', async () => {
    const { wrapper, fakeFetch } = getWrapper();

    const useRequestFn = jest.fn(useRequest);

    const { result, waitForNextUpdate } = renderHook(() => {
      return useRequestFn({ ...getRequestArgsCached() }, { fetchPolicy: 'cache-only' });
    }, { wrapper });

    expect(result.current[0]).toEqual([
      {
        id: 'article_1',
        name: 'Artice 1',
      },
    ]);
    expect(result.current[1].loading).toBe(false);
    expect(result.current[1].requestPending).toBe(false);

    await act(async () => {
      await waitNextUpdateShouldNotAppear(waitForNextUpdate, 500);
    });

    expect(fakeFetch).toBeCalledTimes(0);
    expect(useRequestFn).toBeCalledTimes(1);
  });

  it('fetchPolicy: cache-only - without cache', async () => {
    const { wrapper, fakeFetch } = getWrapper();

    const useRequestFn = jest.fn(useRequest);

    const { result, waitForNextUpdate } = renderHook(() => {
      return useRequestFn({ ...getRequestArgsNotCached() }, { fetchPolicy: 'cache-only' });
    }, { wrapper });

    expect(result.current[0]).toEqual(null);
    expect(result.current[1].loading).toBe(false);
    expect(result.current[1].requestPending).toBe(false);

    await act(async () => {
      await waitNextUpdateShouldNotAppear(waitForNextUpdate, 500);
    });

    expect(fakeFetch).toBeCalledTimes(0);
    expect(useRequestFn).toBeCalledTimes(1);
  });
});
