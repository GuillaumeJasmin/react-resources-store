import { StoreState, Schema } from '../types';
import { getRequestResources } from '../getRequestResources';

const schema: Schema = {
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

describe('getRequestResources', () => {
  it('should return list', () => {
    const state = getState();
    const ref = { current: null };
    const articles = getRequestResources(ref, schema, state, 'articles', 'request_1');
    expect(Array.isArray(articles)).toBeTruthy();
  });

  it('should return item', () => {
    const state = getState();
    const ref = { current: null };
    const article = getRequestResources(ref, schema, state, 'articles', 'request_2');
    expect(Array.isArray(article)).toBeFalsy();
  });
});
