import { ReducersConfig } from '../types';
import { getIncludedResourcesSchema } from '../getIncludedResourcesSchema';

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
    author: {
      resourceType: 'users',
      relationType: 'hasOne',
      foreignKey: 'authorId',
    },
  },
  users: {},
};

const payload = [
  {
    id: 'article_1',
    title: 'article 1',
    comments: [
      {
        id: 'comment_1',
        content: 'comment 1',
        articleId: 'article_1',
        authorId: 'author_1',
        author: {
          id: 'author_1',
          name: 'author 1',
        },
      },
    ],
  },
  {
    id: 'article_2',
    title: 'article 2',
    comments: [],
  },
];

describe('getIncludedResourcesSchema', () => {
  it('should works', () => {
    const includedResources = getIncludedResourcesSchema(config, 'articles', payload);

    const expectedIncludedResources = {
      comments: {
        author: true,
      },
    };

    expect(includedResources).toEqual(expectedIncludedResources);
  });
});
