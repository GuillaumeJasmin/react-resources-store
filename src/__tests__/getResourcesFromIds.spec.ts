import { StoreState, Schema } from '../types';
import { getResourcesFromIds } from '../getResourcesFromIds';

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

describe('getResourcesFromIds', () => {
  it('should return correct resource length', () => {
    const ref = { current: null };
    const state = getState();
    const articles = getResourcesFromIds(ref, schema, state, 'articles', ['article_1', 'article_2']);
    expect(articles).toHaveLength(2);
  });

  it('should return correct resources order', () => {
    const ref = { current: null };
    const state = getState();
    const articles = getResourcesFromIds(ref, schema, state, 'articles', ['article_2', 'article_1']);
    expect(articles[0].id).toEqual('article_2');
    expect(articles[1].id).toEqual('article_1');
  });

  it('should be memoize when there is no changes', () => {
    const ref = { current: null };
    const state = getState();
    const articles1 = getResourcesFromIds(ref, schema, state, 'articles', ['article_1', 'article_2']);
    const newState = { ...state };
    const articles2 = getResourcesFromIds(ref, schema, newState, 'articles', ['article_1', 'article_2']);
    expect(articles1 === articles2).toBeTruthy();
  });

  it('should be memoize where items not present into request ids are added or updated', () => {
    const ref = { current: null };
    const state = getState();
    const articles1 = getResourcesFromIds(ref, schema, state, 'articles', ['article_1', 'article_2']);

    const newState = {
      ...state,
      articles: {
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
      },
    };

    const articles2 = getResourcesFromIds(ref, schema, newState, 'articles', ['article_1', 'article_2']);
    expect(articles1 === articles2).toBeTruthy();
  });

  it('should be unmemoize when item into list ids is updated', () => {
    const ref = { current: null };
    const state = getState();
    const articles1 = getResourcesFromIds(ref, schema, state, 'articles', ['article_1', 'article_2']);

    const newState = {
      ...state,
      articles: {
        ...state.articles,
        resources: {
          ...state.articles.resources,
          article_1: {
            ...state.articles.resources.article_1,
            name: 'toto',
          },
        },
      },
    };

    const articles2 = getResourcesFromIds(ref, schema, newState, 'articles', ['article_1', 'article_2']);
    expect(articles1 === articles2).toBeFalsy();
  });

  it('should be unmemoize when article is added into request list ids', () => {
    const ref = { current: null };
    const state = getState();
    const articles1 = getResourcesFromIds(ref, schema, { ...state }, 'articles', ['article_1', 'article_2']);
    const newState = { ...state };
    const articles2 = getResourcesFromIds(ref, schema, newState, 'articles', ['article_1', 'article_2', 'article_3']);
    expect(articles1 === articles2).toBeFalsy();
  });

  it('should works with one resource', () => {
    const ref = { current: null };
    const state = getState();
    const article1 = getResourcesFromIds(ref, schema, state, 'articles', 'article_1');

    expect(article1.name === 'article 1');
  });
});

describe('getResourcesFromIds: included resources', () => {
  it('should works with one resource and included resources', () => {
    const ref = { current: null };
    const state = getState();
    const article1 = getResourcesFromIds(ref, schema, state, 'articles', 'article_1', {
      comments: true,
    });

    expect(article1.comments).toHaveLength(2);
  });

  it('should works with list and included resources', () => {
    const ref = { current: null };
    const state = getState();
    const articles1 = getResourcesFromIds(ref, schema, state, 'articles', ['article_1', 'article_2'], {
      comments: true,
    });

    expect(articles1[0].comments).toHaveLength(2);
  });

  it('should works with list and included resources added', () => {
    const ref = { current: null };
    const state = getState();
    const articles1 = getResourcesFromIds(ref, schema, { ...state }, 'articles', ['article_1', 'article_2'], {
      comments: true,
    });

    const newState = {
      ...state,
      comments: {
        ...state.comments,
        resources: {
          ...state.comments.resources,
          comment_3: {
            id: 'comment_3',
            name: 'comment 3',
            articleId: 'article_1',
          },
        },
      },
    };

    const articles2 = getResourcesFromIds(ref, schema, newState, 'articles', ['article_1', 'article_2'], {
      comments: true,
    });

    expect(articles1[0].comments).toHaveLength(2);
    expect(articles2[0].comments).toHaveLength(3);
  });

  it('should be unmemoize when comments is added into included resources', () => {
    const ref = { current: null };
    const state = getState();
    const articles1 = getResourcesFromIds(ref, schema, state, 'articles', ['article_1', 'article_2'], {
      comments: true,
    });

    const newState = {
      ...state,
      comments: {
        ...state.comments,
        resources: {
          ...state.comments.resources,
          comment_3: {
            id: 'comment_3',
            name: 'comment 3',
            articleId: 'article_1',
          },
        },
      },
    };

    const articles2 = getResourcesFromIds(ref, schema, newState, 'articles', ['article_1', 'article_2'], {
      comments: true,
    });

    expect(articles1 === articles2).toBeFalsy();
  });

  it('should be unmemoize when comments is updated into included resources', () => {
    const ref = { current: null };
    const state = getState();
    const articles1 = getResourcesFromIds(ref, schema, state, 'articles', ['article_1', 'article_2'], {
      comments: true,
    });

    const newState = {
      ...state,
      comments: {
        ...state.comments,
        resources: {
          ...state.comments.resources,
          comment_2: {
            ...state.comments.resources.comment_2,
            name: 'comment 2 updated',
          },
        },
      },
    };

    const articles2 = getResourcesFromIds(ref, schema, newState, 'articles', ['article_1', 'article_2'], {
      comments: true,
    });

    expect(articles1 === articles2).toBeFalsy();
  });

  it('should be memoize with included resource without changes', () => {
    const ref = { current: null };
    const state = getState();
    const articles1 = getResourcesFromIds(ref, schema, state, 'articles', ['article_1', 'article_2'], {
      comments: true,
    });

    const newState = {
      ...state,
    };

    const articles2 = getResourcesFromIds(ref, schema, newState, 'articles', ['article_1', 'article_2'], {
      comments: true,
    });

    expect(articles1 === articles2).toBeTruthy();
  });

  it('should be memoize with changes outside included resources', () => {
    const ref = { current: null };
    const state = getState();
    const articles1 = getResourcesFromIds(ref, schema, { ...state }, 'articles', ['article_1', 'article_2'], {
      comments: true,
    });

    const newState = {
      ...state,
      comments: {
        ...state.comments,
        resources: {
          ...state.comments.resources,
          comment_3: {
            id: 'comment_3',
            name: 'comment 3',
            articleId: 'article_3',
          },
        },
      },
    };

    const articles2 = getResourcesFromIds(ref, schema, newState, 'articles', ['article_1', 'article_2'], {
      comments: true,
    });

    expect(articles1 === articles2).toBeTruthy();
  });

  it('included resource belongsTo', () => {
    const ref = { current: null };
    const state = getState();
    const comments = getResourcesFromIds(ref, schema, state, 'comments', ['comment_1', 'comment_2'], {
      article: true,
    });

    expect(comments[0].article).toBeDefined();
  });

  it('should included resource with belongsTo relation be memoized', () => {
    const ref = { current: null };
    const state = getState();
    const comments1 = getResourcesFromIds(ref, schema, state, 'comments', ['comment_1', 'comment_2'], {
      article: true,
    });

    const newState = {
      ...state,
    };

    const comments2 = getResourcesFromIds(ref, schema, newState, 'comments', ['comment_1', 'comment_2'], {
      article: true,
    });

    expect(comments1 === comments2).toBeTruthy();
  });

  it('should included resource with belongsTo relation be unmemoized if there is changes', () => {
    const ref = { current: null };
    const state = getState();
    const comments1 = getResourcesFromIds(ref, schema, state, 'comments', ['comment_1', 'comment_2'], {
      article: true,
    });

    const newState = {
      ...state,
      articles: {
        ...state.articles,
        resources: {
          ...state.articles.resources,
          article_1: {
            ...state.articles.resources.article_1,
            name: 'article 1 bis',
          },
        },
      },
    };

    const comments2 = getResourcesFromIds(ref, schema, newState, 'comments', ['comment_1', 'comment_2'], {
      article: true,
    });

    expect(comments1 === comments2).toBeFalsy();
  });
});
