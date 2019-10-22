<div align="center">
  <h1>
    React Resources Store
    <br/>
    <br/>
    <br/>
  </h1>
    <br/>
    <a href="https://www.npmjs.com/package/react-resources-store">
      <img src="https://img.shields.io/npm/v/react-resources-store.svg" alt="npm package" />
    </a>
    <br/>
    <br/>
    <br/>
    :warning: alpha version, still under development
    <br/>
    <br/>
    Make HTTP requests and keep your UI up to date.
    <br/>
    <br/>
    Inspired by <a href="https://www.apollographql.com">Apollo</a> and <a href="https://github.com/jamesplease/redux-resource">Redux Resources</a>
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
* [Resolver](#resolver)
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

`useLazyRequest(resolverParams, options)`

* `resolverParams` - object - resolver params. See [Resolver](#resolver)

* `options`
  * `fetchPolicy` - see [Fetch Policy](#fetch-policy)
  * `includedResources` see [Relationships](#relationships)

## `useLazyRequest()`

useLazyRequest is used to make delayed requests, like a POST or PATCH request. 

`useLazyRequest(resolverParams, options)`

* `resolverParams` - function - return resolver params

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

  const [createArticle] = useLazyRequest((article) => ({
    url: 'articles',
    method: 'POST',
    data: article
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

# Resolver

The resolver is an important part of react-resources-store, because it's your HTTP Client. Is responsible to make request and return data, then `react-resources-store` made the rest of job for you.

You can use a predefined resolver or build yours. There is 2 provided resolvers: `axios` and `window.fetch`.

## Axios

[Axios resolver source](src/resolvers/axios.ts)

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

[Fetch resolver source](src/resolvers/fetch.ts)

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

A resolver is a function that take arguments, and return specific data:
- `url` - relative of absolute URL. Only use for cache
- `method` - HTTP method (`GET`, `POST`, `PATCH`, ...). Use for cache and also check if request is a read or write action
- `params` Query params - Only use for cache
- `resourceType` - Name of your resource, like `articles`, `comments`, etc... 
- `resourceId`
- `request`

Theses properties are essential to internal use of `react-resources-store`.  

`url`, `method` and `params` are used to track requests and cached them. `resourceType` and `resourceId` are used to store data into the right place and update / delete the correct item.


```js
export function createYourResolver(resolverParams) {
  
  return function yourResolver(args) {

    const url = '...';
    const method = '...';
    const params = '...';
    const resourceType = '...';
    const resourceId = '...';

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

Under the hood, your data will be normalized by [normalizr](https://github.com/paularmstrong/normalizr) based on your schema:

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
