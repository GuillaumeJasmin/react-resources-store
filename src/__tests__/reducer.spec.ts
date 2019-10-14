import { createReducers } from '../createReducers';
import { ResourceState, ReducersConfig } from '../types';
import { KEY } from '../contants';
import { getIncludedResourcesSchema } from '../getIncludedResourcesSchema';

const config: ReducersConfig = {
  articles: {
    comments: {
      resourceType: 'comments',
      relationType: 'hasMany',
      foreignKey: 'articleId',
    },
    author: {
      resourceType: 'users',
      relationType: 'hasOne',
      foreignKey: 'authorId',
    },
  },
  comments: {
    article: {
      resourceType: 'articles',
      relationType: 'hasOne',
      foreignKey: 'articleId',
    },
    author: {
      resourceType: 'users',
      relationType: 'hasOne',
      foreignKey: 'authorId',
    },
  },
  users: {
    articles: {
      resourceType: 'articles',
      relationType: 'hasMany',
      foreignKey: 'authorId',
    },
    comments: {
      resourceType: 'comments',
      relationType: 'hasMany',
      foreignKey: 'authorId',
    },
  },
};

function getArticle(key = '1') {
  return {
    id: `article_${key}`,
    title: `Title ${key}`,
    content: `Content ${key}`,
  };
}

function getPlainData() {
  return [
    {
      id: 'article_1',
      title: 'Title 1',
      content: 'Content 1',
      comments: [
        {
          id: 'comment_1',
          content: 'comment 1',
          articleId: 'article_1',
          authorId: 'user_1',
          author: {
            id: 'user_1',
            name: 'user 1',
          },
        },
      ],
    },
    {
      id: 'article_2',
      title: 'Title 2',
      content: 'Content 2',
      comments: [],
    },
  ];
}

describe('createReducer', () => {
  it('should return a function', () => {
    const reducer = createReducers(config).articles;
    expect(typeof reducer).toBe('function');
  });

  it('should throw if there is no type', () => {
    const reducer = createReducers(config).articles;

    const action = {
      key: KEY,
    };

    expect(() => reducer(undefined, action)).toThrow('AxiosRedux - missing action properties: resourceType');
  });

  it('should reducer return default Resourcestate', () => {
    const reducer = createReducers(config).articles;

    const action = {};

    const expectedState: ResourceState = {
      resources: {},
      requests: {},
    };

    expect(reducer(undefined, action)).toEqual(expectedState);
  });

  it('should reducer handle UPDATE_PENDING type', () => {
    const reducer = createReducers(config).articles;

    const action = {
      key: KEY,
      type: 'UPDATE_PENDING',
      resourceType: 'articles',
      requestKey: 'requestKey_1',
    };

    const expectedState: ResourceState = {
      resources: {},
      requests: {
        requestKey_1: {
          requestKey: 'requestKey_1',
          status: 'PENDING',
          ids: [],
          includedResources: {},
          isList: false,
        },
      },
    };

    expect(reducer(undefined, action)).toEqual(expectedState);
  });

  it('should reducer handle UPDATE_SUCCEEDED type with new resources', () => {
    const reducer = createReducers(config).articles;

    const initialState: ResourceState = {
      resources: {
        article_1: getArticle('1'),
      },
      requests: {
        requestKey_1: {
          requestKey: 'requestKey_1',
          status: 'PENDING',
          ids: [],
          includedResources: {},
          isList: false,
        },
      },
    };

    const action = {
      key: KEY,
      type: 'UPDATE_SUCCEEDED',
      resourceType: 'articles',
      requestKey: 'requestKey_1',
      payload: [
        getArticle('2'),
      ],
    };

    const expectedState: ResourceState = {
      resources: {
        article_1: getArticle('1'),
        article_2: getArticle('2'),
      },
      requests: {
        requestKey_1: {
          requestKey: 'requestKey_1',
          status: 'SUCCEEDED',
          ids: ['article_2'],
          includedResources: getIncludedResourcesSchema(config, 'articles', action.payload),
          isList: true,
        },
      },
    };

    expect(reducer(initialState, action)).toEqual(expectedState);
  });

  it('should reducer handle UPDATE_SUCCEEDED type with existed resources', () => {
    const reducer = createReducers(config).articles;

    const initialState: ResourceState = {
      resources: {
        article_1: getArticle('1'),
        article_2: getArticle('2'),
      },
      requests: {
        requestKey_1: {
          requestKey: 'requestKey_1',
          status: 'PENDING',
          ids: [],
          includedResources: {},
          isList: false,
        },
      },
    };

    const action = {
      key: KEY,
      type: 'UPDATE_SUCCEEDED',
      resourceType: 'articles',
      requestKey: 'requestKey_1',
      payload: [
        {
          id: 'article_2',
          title: 'new title 2',
        },
      ],
    };

    const expectedState: ResourceState = {
      resources: {
        article_1: getArticle('1'),
        article_2: {
          ...getArticle('2'),
          title: 'new title 2',
        },
      },
      requests: {
        requestKey_1: {
          requestKey: 'requestKey_1',
          status: 'SUCCEEDED',
          ids: ['article_2'],
          includedResources: getIncludedResourcesSchema(config, 'articles', action.payload),
          isList: true,
        },
      },
    };

    expect(reducer(initialState, action)).toEqual(expectedState);
  });

  it('should request.isList be false', () => {
    const reducer = createReducers(config).articles;

    const initialState: ResourceState = {
      resources: {},
      requests: {},
    };

    const action = {
      key: KEY,
      type: 'UPDATE_SUCCEEDED',
      resourceType: 'articles',
      requestKey: 'requestKey_1',
      payload: getArticle(),
    };

    const expectedState: ResourceState = {
      resources: {
        article_1: getArticle(),
      },
      requests: {
        requestKey_1: {
          requestKey: 'requestKey_1',
          status: 'SUCCEEDED',
          ids: ['article_1'],
          includedResources: {},
          isList: false,
        },
      },
    };

    expect(reducer(initialState, action)).toEqual(expectedState);
  });

  it('should reducer handle UPDATE_SUCCEEDED type with nested resources', () => {
    const reducers = createReducers(config);
    const reducerArticles = reducers.articles;
    const reducerComments = reducers.comments;
    const reducerUsers = reducers.users;

    const initialState: ResourceState = {
      resources: {},
      requests: {},
    };

    const action = {
      key: KEY,
      type: 'UPDATE_SUCCEEDED',
      resourceType: 'articles',
      requestKey: 'requestKey_1',
      payload: getPlainData(),
    };

    const expectedArticlesState: ResourceState = {
      resources: {
        article_1: {
          id: 'article_1',
          title: 'Title 1',
          content: 'Content 1',
          comments: [
            'comment_1',
          ],
        },
        article_2: {
          id: 'article_2',
          title: 'Title 2',
          content: 'Content 2',
          comments: [],
        },
      },
      requests: {
        requestKey_1: {
          requestKey: 'requestKey_1',
          status: 'SUCCEEDED',
          ids: ['article_1', 'article_2'],
          includedResources: getIncludedResourcesSchema(config, 'articles', action.payload),
          isList: true,
        },
      },
    };

    const expectedCommentsState: ResourceState = {
      resources: {
        comment_1: {
          id: 'comment_1',
          content: 'comment 1',
          articleId: 'article_1',
          authorId: 'user_1',
          author: 'user_1',
        },
      },
      requests: {},
    };

    const expectedUsersState: ResourceState = {
      resources: {
        user_1: {
          id: 'user_1',
          name: 'user 1',
        },
      },
      requests: {},
    };

    expect(reducerArticles(initialState, action)).toEqual(expectedArticlesState);
    expect(reducerComments(initialState, action)).toEqual(expectedCommentsState);
    expect(reducerUsers(initialState, action)).toEqual(expectedUsersState);
  });

  it('should reducer handle UPDATE_FAILED', () => {
    const reducer = createReducers(config).articles;

    const initialState: ResourceState = {
      resources: {
        article_1: getArticle(),
      },
      requests: {
        requestKey_1: {
          requestKey: 'requestKey_1',
          status: 'PENDING',
          ids: [],
          includedResources: {},
          isList: false,
        },
      },
    };

    const action = {
      key: KEY,
      type: 'UPDATE_FAILED',
      resourceType: 'articles',
      requestKey: 'requestKey_1',
      playload: ['article_1'],
    };

    const expectedState: ResourceState = {
      resources: {
        article_1: getArticle(),
      },
      requests: {
        requestKey_1: {
          requestKey: 'requestKey_1',
          status: 'FAILED',
          ids: [],
          includedResources: {},
          isList: false,
        },
      },
    };

    expect(reducer(initialState, action)).toEqual(expectedState);
  });

  it('should reducer handle DELETE_PENDING type', () => {
    const reducer = createReducers(config).articles;

    const initialState: ResourceState = {
      resources: {
        article_1: getArticle(),
      },
      requests: {},
    };

    const action = {
      key: KEY,
      type: 'DELETE_PENDING',
      requestKey: 'requestKey_1',
      resourceType: 'articles',
      payload: ['article_1'],
    };

    const expectedState: ResourceState = {
      resources: {
        article_1: getArticle(),
      },
      requests: {
        requestKey_1: {
          requestKey: 'requestKey_1',
          status: 'PENDING',
          ids: ['article_1'],
          includedResources: {},
          isList: false,
        },
      },
    };

    expect(reducer(initialState, action)).toEqual(expectedState);
  });

  it('should reducer handle DELETE_SUCCEEDED type', () => {
    const reducer = createReducers(config).articles;

    const initialState: ResourceState = {
      resources: {
        article_1: getArticle('1'),
        article_2: getArticle('2'),
      },
      requests: {},
    };

    const action = {
      key: KEY,
      type: 'DELETE_SUCCEEDED',
      requestKey: 'requestKey_1',
      resourceType: 'articles',
      payload: ['article_1'],
    };

    const expectedState: ResourceState = {
      resources: {
        article_2: getArticle('2'),
      },
      requests: {
        requestKey_1: {
          requestKey: 'requestKey_1',
          status: 'SUCCEEDED',
          ids: ['article_1'],
          includedResources: {},
          isList: false,
        },
      },
    };

    expect(reducer(initialState, action)).toEqual(expectedState);
  });

  it('should reducer handle DELETE_FAILED type', () => {
    const reducer = createReducers(config).articles;

    const initialState: ResourceState = {
      resources: {
        article_1: getArticle('1'),
        article_2: getArticle('2'),
      },
      requests: {},
    };

    const action = {
      key: KEY,
      type: 'DELETE_FAILED',
      requestKey: 'requestKey_1',
      resourceType: 'articles',
      payload: ['article_1'],
    };

    const expectedState: ResourceState = {
      resources: {
        article_1: getArticle('1'),
        article_2: getArticle('2'),
      },
      requests: {
        requestKey_1: {
          requestKey: 'requestKey_1',
          status: 'FAILED',
          ids: ['article_1'],
          includedResources: {},
          isList: false,
        },
      },
    };

    expect(reducer(initialState, action)).toEqual(expectedState);
  });

  it('should reducer skip action if key doesn\'t match', () => {
    const reducer = createReducers(config).articles;

    const initialState: ResourceState = {
      resources: {},
      requests: {},
    };

    const action = {
      type: 'UPDATE_PENDING',
      resourceType: 'articles',
      requestKey: 'requestKey_1',
    };

    expect(reducer(initialState, action)).toEqual(initialState);
  });
});
