<div align="center">
  <h1>
    <br/>
    React Resources Store
    <br/>
    <br/>
    <br/>
  </h1>
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
    <div>✓ agonistic HTTP client</div>
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
* [Fetch Policy](#fetch-policy)
* [Resolvers](#resolvers)
  * [Axios](#axios)
  * [fetch](#fetch)
  * [Custom resolver](#build-your-resolver)
* [Advanced usage](#advanced-usage)
  * [Custom store](#custom-store)

# Installation

```
npm i react-resources-store
```

# Quick start

Quick start with default HTTP client `window.fetch`

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
    return <Loader />
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


useRequest is use to get data and keep your component up to date with data from store.

`useLazyRequest(requestParams, options)`

* `requestParams` - object related to your resolver

* `options`
  * `fetchPolicy` - see [Fetch Policy](#fetch-policy)
  * `includedResources`

## `useLazyRequest()`

useLazyRequest is use to make delayed requests, like a POST request trigger by a callback. 

`useLazyRequest(requestParams, options)`

* `requestParams` - object related to your resolver

* `options`
  * `requestKey`

## Usage examples 
```js
function Demo() {
  const [articles, { loading }] = useRequest({
    url: 'articles',
    method: 'GET',
    params: {
      pageSize: 10,
    }
  })

  // axios
  const [createArticle, { requestIsPending }] = useLazyRequest((data) => ({
    url: 'articles',
    method: 'GET',
    data
  }))
  
  const onClick = useCallbask(() => {
    createArticle({
      title: '...',
      content: '...'
    })
  }, [])

  return (
    <div>
      ...
      {articles.map(article => (
        <div>{article.title}</div>
      ))}
    </div>
  )
}
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

# Resolvers
## Axios

[Axios resolver](https://github.com/GuillaumeJasmin/react-resources-store/blob/master/src/resolvers/axios.ts)

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

[Fetch resolver](https://github.com/GuillaumeJasmin/react-resources-store/blob/master/src/resolvers/fetch.ts)

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

# Advanced usage

## Relationship

```js
const schema = {
  articles: {
    comments: {
      resourceType: 'comments',
      relationType: 'hasMany',
      foreignKey: 'articleId'
    },
  },
  comments: {
    article: {
      resourceType: 'articles',
      relationType: 'hasOne',
      foreignKey: 'articleId'
    }
  }
}
```

## Custom store

`store-config.js`

```js
import axios from 'axios'
import { createStore, combineReducers } from 'redux'
import { Provider, createReducers, createAxiosResolver, useRequest, useLazyRequest } from 'react-resources-store'

const schema = {
  articles: {
    comments: {
      resourceType: 'comments',
      relationType: 'hasMany',
      foreignKey: 'articleId'
    },
  },
  comments: {
    article: {
      resourceType: 'articles',
      relationType: 'hasOne',
      foreignKey: 'articleId'
    }
  }
}

const reducers = createReducers(schema)

const store = createStore(combineReducers(reducers))

const axiosInstance = axios.create({
  baseURL: 'http://website.com/api/',
})

const resolver = createAxiosResolver(axiosInstance)

export const contextValue = {
  schema,
  resolver,
  store,
}
```

`App.jsx`

```js
import { contextValue } from './store-config'

const App = (
  <Provider value={contextValue}>
    {...}
  </Provider>
)
```
