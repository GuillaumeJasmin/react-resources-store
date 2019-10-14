import { StoreState } from '../types';
import { getRequest } from '../getRequest';

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
          isList: true,
        },
        request_2: {
          requestKey: 'request_2',
          status: 'SUCCEEDED',
          ids: ['article_1'],
          includedResources: {},
          isList: false,
        },
      },
    },
  };
}

describe('getRequest', () => {
  it('should return request', () => {
    const state = getState();
    const request = getRequest(state, 'articles', 'request_1');
    expect(request && request.requestKey).toEqual('request_1');
  });

  it('should return null if request doesn\t exist', () => {
    const state = getState();
    const request = getRequest(state, 'articles', 'request_3');
    expect(request).toBeNull();
  });

  it('should throw an error if resourceType doesn\'t exist', () => {
    const state = getState();
    expect(() => getRequest(state, 'articlessss', 'request_1')).toThrowError();
  });
});
