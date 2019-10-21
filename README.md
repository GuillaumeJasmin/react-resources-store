<div align="center">
  <h1>
    React Resources Store
    <br/>
    <br/>
  </h1>
    <br/>
    :warning: alpha version, still under development
    <br/>
    <br/>
    Make HTTP requests and keep your UI up to date.
    <br/>
    <br/>
    It's inspired by <a href="https://www.apollographql.com">Apollo</a> and <a href="https://github.com/jamesplease/redux-resource">Redux Resources</a>
  <br/>
  <br/>
  <div style="width: 200px; text-align: left">
    <div>✓ normalized store</div>
    <div>✓ cached data</div>
    <div>✓ internal memoization</div>
    <div>✓ resources relationship</div>
    <div>✓ agnostic HTTP client</div>
    <div>✓ TypeScript support</div>
  </div>
  <br/>
  <br/>
  <br/>
  <pre>npm i <a href="https://www.npmjs.com/package/react-resources-store">react-resources-store</a></pre>
  <br/>
  <br/>
</div>

# Summary

* [Installation](#installation)
* [Quick start](#quick-start)
* [API](#api)
  * [useRequest()](#userequest)
  * [useLazyRequest()](#uselazyrequest)
* [Resolvers](#resolvers)
  * [Axios](#axios)
  * [fetch](#fetch)
  * [Custom resolver](#build-your-resolver)
* [Relationships](#relationships)
* [Fetch Policy](#fetch-policy)
* [Advanced usage](#advanced-usage)
  * [Custom store](#custom-store)

# Installation

```
npm i react-resources-store
```

# Quick start

Quick start with `window.fetch` as HTTP client resolver 

```js
import { Provider, useRequest, createFetchResolver } from 'react-resources-store'

function Articles() {
  const [articles, { loading }] = useRequest({
    url: 'http://website.com/articles',
    method: 'GET',
    params: {
      pageSize: 10,
    }
  })

  if (loading) {
    return <div>Loading...</div>
  }

  return (
    <div>
      {articles.map(article => (
        <div>{article.title}</div>
      ))}
    </div>
  ) 
}

const schema = {
  articles: {}
}

const App = (
  <Provider
    schema={schema}
    resolver={createFetchResolver()}
  >
    <Articles />
  </Provider>
)

```

# API

## `useRequest()`


useRequest is used to get data and keep your component up to date with data from store.

`useLazyRequest(requestParams, options)`

* `requestParams` - object related to your resolver

* `options`
  * `fetchPolicy` - see [Fetch Policy](#fetch-policy)
  * `includedResources`

## `useLazyRequest()`

useLazyRequest is used to make delayed requests, like a POST request trigger by a callback. 

`useLazyRequest(requestParams, options)`

* `requestParams` - object related to your resolver

* `options`
  * `requestKey`

## Usage examples 

The following example used axios resolver

```js
function Demo() {
  const [articles, { loading, requestKey }] = useRequest({
    url: 'articles',
    method: 'GET',
    params: {
      pageSize: 10,
    }
  })

  const [createArticle] = useLazyRequest((data) => ({
    url: 'articles',
    method: 'POST',
    data
  }), {
    requestKey
  })
  
  const onClickAddArticle = useCallbask(() => {
    createArticle({
      title: '...',
      content: '...'
    })
  }, [createArticle])

  if (loading) {
    return <div>Loading...</div>
  }

  return (
    <div>
      <div>
        {articles.map(article => (
          <div>{article.title}</div>
        ))}
      <div>
      <button onClick={onClickAddArticle}>Add article</button>
    </div>
  )
}
```

`requestKey` is used to update the list. It's only required when you want to add a new item into a specific list.
If you only update attributes of item, cache will be updated automatically and UI still up to date

# Resolvers
## Axios

[Axios resolver](src/resolvers/axios.ts)

```js
import axios from 'axios'
import { createAxiosResolvers } from 'react-resources-stores'

const axiosInstance = axios.create({
  baseURL: 'http://website.com/api/',
})

const App = (
  <Provider
    ...
    resolver={createAxiosResolvers(axiosInstance)}
  >
    {...}
  </Provider>
)
```

## Fetch

[Fetch resolver](src/resolvers/fetch.ts)

```js
import { createFetchResolver } from 'react-resources-stores'

const App = (
  <Provider value={contextValue}
    ...
    resolver={createFetchResolver()}
  >
    {...}
  </Provider>
)
```

## Build your resolver

You can build your own resolver. 

```js
export function createYourResolver(axiosInstance) {
  return function yourResolver(args) {

    const url = '...';
    const method = '...';
    const resourceType = '...';
    const resourceId = '...';
    const params = '...';

    const request = (succeeded, failed) => {
      // trigger request here
      yourResquest()
        .then((response) => {
          succeeded({
            raw: response,
            data: response.data,
          });
        })
        .catch((response) => {
          failed({
            raw: response,
          });
        })
    }

    return {
      url,
      method,
      resourceType,
      resourceId,
      params,
      request,
    };
  };
}
```

# Relationships

Assume you have the following payload

```js
[
  id: 'artcile_1',
  title: 'Article 1',
  authorId: 'user_1',
  author: {
    id: 'user_1',
    name: 'User 1',
  },
  comments: [
    {
      id: 'comment_1',
      content: 'Comment 1',
      articleId: 'artcile_1',
      commenterId: 'user_2',
      commenter: {
        id: 'user_2',
        name: 'User 2',
      },
    },
    {
      id: 'comment_2',
      content: 'Comment 2',
      articleId: 'artcile_2',
      commenterId: 'user_3',
      commenter: {
        id: 'user_3',
        name: 'User 3',
      },
    }
  ]
]
```

Your data must be normalized.  
Under the hood, `react-resource-store` use [normalizr](https://github.com/paularmstrong/normalizr) based on your schema:

```js
const schema = {
  articles: {
    comments: {
      resourceType: 'comments',
      relationType: 'hasMany',
      foreignKey: 'articleId'
    },
    author: {
      resourceType: 'users',
      relationType: 'hasOne',
      foreignKey: 'authorId',
    }
  },
  comments: {
    article: {
      resourceType: 'articles',
      relationType: 'hasOne',
      foreignKey: 'articleId',
    },
    commenter: {
      resourceType: 'users',
      relationType: 'hasOne',
      foreignKey: 'commenterId',
    },
  },
  users: {
    comments: {
      resourceType: 'comments',
      relationType: 'hasMany',
      foreignKey: 'commenterId'
    },
    articles: {
      resourceType: 'articles',
      relationType: 'hasMany',
      foreignKey: 'authorId'
    },
  }
}
```

You can now specified `options.includedResources` to retrieve author and comments data into each articles

```js
const [articles] = useRequest({
  url: 'articles',
  method: 'GET',
}, {
  includedResources: {
    author: true,
    comments: true
  }
})
```

If you want multiple levels of data, for example, you want include the commenter of each comment:

```js
const [articles] = useRequest({
  url: 'articles',
  method: 'GET',
}, {
  includedResources: {
    author: true,
    comments: {
      commenter: true
    }
  }
})
```

# Fetch Policy

Fetch policy are same than [Apollo fetch policy](https://www.apollographql.com/docs/react/api/react-apollo/#optionsfetchpolicy), expect that `no-cache` is not yet supported.

* `cache-first` (default)

* `cache-and-network`

* `network-only`

* `cache-only`

Examples

```js
useRequest(args, { fetchPolicy: 'network-only' })
```

# Advanced usage

## Custom store

`React Resources Store` use redux under the hood to store data, but it's transparent for you. You don't have to setup store, dispatch action, etc.  
Redux was choose for one primary reason: debug tools. So if you want to customize store and for example add redux dev tools, you can use this:

```js
import { createStore, combineReducers } from 'redux'
import { Provider, createReducers } from 'react-resources-store'

const schema = { ... }
const reducers = combineReducers(createReducers(schema))
const store = createStore(
  reducers,
  window.__REDUX_DEVTOOLS_EXTENSION__ && window.__REDUX_DEVTOOLS_EXTENSION__(),
)

const App = (
  <Provider
    ...
    store={store}
  >
    {...}
  </Provider>
)
```

[See default store](src/context.tsx#L10)
