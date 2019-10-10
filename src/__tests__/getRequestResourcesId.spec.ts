import { StoreState } from '../types';
import { getRequestResourcesId } from '../getRequestResourcesId';

function getState(): StoreState<any> {
  return {
    articles: {
      resources: {
        article_1: {
          id: 'article_1',
          name: 'article 1',
        },
        article_2: {
          id: 'article_2',
          name: 'article 2',
        },
        article_3: {
          id: 'article_3',
          name: 'article 3',
        },
      },
      requests: {
        request_1: {
          requestKey: 'request_1',
          status: 'SUCCEEDED',
          ids: ['article_2', 'article_1'],
          includedResources: {},
        },
      },
    },
  };
}

describe('getRequestResourcesId', () => {
  it('should return correct resource length', () => {
    const state = getState();
    const articlesIds = getRequestResourcesId(state, 'articles', 'request_1');
    expect(articlesIds).toHaveLength(2);
    expect(articlesIds[0]).toEqual('article_2');
    expect(articlesIds[1]).toEqual('article_1');
  });

  it('should be memoize', () => {
    const state = getState();
    const articlesIds1 = getRequestResourcesId(state, 'articles', 'request_1');
    const articlesIds2 = getRequestResourcesId(state, 'articles', 'request_1');
    expect(articlesIds1 === articlesIds2).toBeTruthy();
  });

  it('should be unmemoize', () => {
    const state = getState();
    const articlesIds1 = getRequestResourcesId(state, 'articles', 'request_1');

    state.articles.requests.request_1.ids = [
      ...state.articles.requests.request_1.ids,
      'article_3',
    ];

    const articlesIds2 = getRequestResourcesId(state, 'articles', 'request_1');
    expect(articlesIds1 === articlesIds2).toBeFalsy();
  });
});
