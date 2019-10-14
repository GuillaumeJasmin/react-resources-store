import { StoreState, ReducersConfig } from '../types';
import { getRequestResources } from '../getRequestResources';

const config: ReducersConfig = {
  articles: {
    comments: {
      resourceType: 'comments',
      relationType: 'hasMany',
      foreignKey: 'articleId',
    },
  },
  comments: {
    article: {
      resourceType: 'articles',
      relationType: 'hasOne',
      foreignKey: 'articleId',
    },
  },
};

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
          includedResources: {
            comments: true,
          },
          isList: true,
        },
      },
    },
    comments: {
      resources: {
        comment_1: {
          id: 'comment_1',
          name: 'comment 1',
          articleId: 'article_1',
        },
        comment_2: {
          id: 'comment_2',
          name: 'comment 2',
          articleId: 'article_1',
        },
      },
      requests: {},
    },
  };
}

describe('getRequestResources', () => {
  it('should return correct resource length', () => {
    const ref = { current: null };
    const state = getState();
    const articles = getRequestResources(ref, config, state, 'articles', 'request_1');
    expect(articles).toHaveLength(2);
  });

  it('should return correct resources order', () => {
    const ref = { current: null };
    const state = getState();
    const articles = getRequestResources(ref, config, state, 'articles', 'request_1');
    expect(articles[0].id).toEqual('article_2');
    expect(articles[1].id).toEqual('article_1');
  });

  it('should be memoize when there is no changes', () => {
    const ref = { current: null };
    const state = getState();
    const articles1 = getRequestResources(ref, config, { ...state }, 'articles', 'request_1');
    const articles2 = getRequestResources(ref, config, { ...state }, 'articles', 'request_1');
    expect(articles1 === articles2).toBeTruthy();
  });

  it('should be memoize where items not present into request ids are added or updated', () => {
    const ref = { current: null };
    const state = getState();
    const articles1 = getRequestResources(ref, config, { ...state }, 'articles', 'request_1');

    state.articles = {
      ...state.articles,
      resources: {
        ...state.articles.resources,
        article_3: {
          ...state.articles.resources.article_3,
          name: 'toto',
        },
        article_4: {
          id: 'article_4',
          name: 'toto',
        },
      },
    };

    const articles2 = getRequestResources(ref, config, { ...state }, 'articles', 'request_1');
    expect(articles1 === articles2).toBeTruthy();
  });

  it('should be unmemoize when item into list ids is updated', () => {
    const ref = { current: null };
    const state = getState();
    const articles1 = getRequestResources(ref, config, { ...state }, 'articles', 'request_1');

    state.articles = {
      ...state.articles,
      resources: {
        ...state.articles.resources,
        article_1: {
          ...state.articles.resources.article_1,
          name: 'toto',
        },
      },
    };

    const articles2 = getRequestResources(ref, config, { ...state }, 'articles', 'request_1');
    expect(articles1 === articles2).toBeFalsy();
  });

  it('should be unmemoize when article is added into request list ids', () => {
    const ref = { current: null };
    const state = getState();
    const articles1 = getRequestResources(ref, config, { ...state }, 'articles', 'request_1');

    state.articles = {
      ...state.articles,
      resources: {
        ...state.articles.resources,
        article_4: {
          id: 'article_4',
          name: 'toto',
        },
      },
      requests: {
        ...state.articles.requests,
        request_1: {
          ...state.articles.requests.request_1,
          ids: [
            ...state.articles.requests.request_1.ids,
            'article_4',
          ],
        },
      },
    };

    const articles2 = getRequestResources(ref, config, { ...state }, 'articles', 'request_1');
    expect(articles1 === articles2).toBeFalsy();
  });

  it('should include resource works', () => {
    const ref = { current: null };
    const state = getState();
    const articles1 = getRequestResources(ref, config, { ...state }, 'articles', 'request_1');

    expect(articles1[1].comments).toHaveLength(2);
  });
});
