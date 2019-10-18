# React Resources Hook

## Configure Redux store and Axios instance

`config.js`

```js
import axios from 'axios'
import { createStore, combineReducers } from 'redux'
import { createReducers, Provider, createAxiosResolver, useRequest, useLazyRequest } from 'react-resources-hook'

const resourcesConfig = {
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

const reducers = createReducers(resourcesConfig)

export const store = createStore(combineReducers(reducers))

export const axiosInstance = axios.create({
  baseURL: 'http://website.com/api/',
})

export const contextValue = {
  config,
  resolver: createAxiosResolver(axiosInstance)
  store,
}
```

`App.jsx`

```js
import { contextValue } from './config'

const App = (
  <Provider value={contextValue}>
    {...}
  </Provider>
)
```

## Usage 
```js
function Demo() {
  const [articles, pending] = useRequest({
    url: 'articles',
    method: 'GET',
    params: {
      pageSize: 10,
    }
  })

  // axios
  const [createArticle, pending] = useLazyRequest((data) => ({
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

# Resolver
## Axios

```js
import axios from 'axios'
import { createAxiosResolvers } from 'react-resources-hooks'

const axiosInstance = axios.create({
  baseURL: 'http://website.com/api/',
})

export const contextValue = {
  config,
  resolver: createAxiosResolvers(axiosInstance),
  store,
}

const App = (
  <Provider value={contextValue}>
    {...}
  </Provider>
)
```

## Fetch

```js
import axios from 'axios'
import { fetchResolver } from 'react-resources-hooks'

export const contextValue = {
  config,
  resolver: fetchResolver,
  store,
}

const App = (
  <Provider value={contextValue}>
    {...}
  </Provider>
)
```

## Build your resolver
