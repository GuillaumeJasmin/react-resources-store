# Axios Redux

## Configure Redux store and Axios instance

`config.js`

```js
import axios from 'axios'
import { createStore, combineReducers } from 'redux'
import { createReducers, AxiosReduxProvider, useRequest, useLazyRequest } from 'axios-redux-hook'

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

export const api = axios.create({
  baseURL: 'http://website.com/api/',
  timeout: 20000,
})

export const axiosReduxContext = {
  store,
  api,
  config
}
```

`App.jsx`

```js
import { axiosReduxContext } from './config'

const App = (
  <AxiosReduxProvider value={axiosReduxContext}>
    {...}
  </AxiosReduxProvider>
)

```

## Usage 
```js
function Demo() {
  const api = useAPI()

  const [articles, pending, error] = useRequest({
    url: 'articles',
    method: 'GET',
    params: {
      filter: {
        where: {
          bookId: '...',
        },
        include: [
          { relation: 'posts' }
        ]
      }
    }
  })

  // axios
  const [createArticle, pending, error] = useLazyRequest((data) => ({
    url: 'articles',
    method: 'GET',
    data
  }))

  // fetch
  const [createArticle, pending, error] = useLazyRequest(
    ({ id }) => `articles/${id}`,
    (data) => ({
      method: 'GET',
      data
    })
  )
  
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


# Create your own api provider

# Axios

```js
import axios from 'axios'

const api = axios.create({
  baseURL: 'http://website.com/api/',
  timeout: 20000,
})

const axiosRequest = axiosConfig => {
  // example with axiosConfig = /articles/1
  // regex will extract 'articles' in order to use it as resourceType
  const regexURL = /(\/)?([-a-zA-Z0-9()@:%_\+.~#?&=]*)(\/)?([-a-zA-Z0-9()@:%_\+.~#?&=]*)([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/
  const match = axiosConfig.url.match(regexURL)

  if (!match) {
    throw new Error('axios URL doesn\'t match REST endpoint format')
  }

  const resourceType = axiosConfig.match(regexURL)[2]

  if (!resourceType) {
    throw new Error('axios URL doesn\'t match REST endpoint format. it must contain a resource type')
  }
  
  const resourceId = fetchURL.match(regexURL)[4] || null

  return {
    method: axiosConfig.method,
    resourceType,
    params: axiosConfig.params,
    request: (succeeded, failed) => {
      axios.request(axiosConfig)
        .then(response => {
          succeeded({
            raw: response
            data: response.data,
          })
        })
        .catch(response => {
          failed({
            raw: response
          })
          
          // Here, you can trigger a notification error
        })
    }
  }
}
```

# Fetch

```js
const fetchRequest = (fetchURL, fetchConfig) => {
  // example with fetchURL = https://website/articles/1
  // regex will extract 'articles' in order to use it as resourceType
  const regexURL = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b\/([-a-zA-Z0-9()@:%_\+.~#?&=]*)(\/)?([-a-zA-Z0-9()@:%_\+.~#?&=]*)([-a-zA-Z0-9()@:%_\+.~#?&//=]*)?/
  const match = fetchURL.match(regexURL)

  if (!match) {
    throw new Error('fetch URL doesn\'t match REST endpoint format')
  }

  const resourceType = fetchURL.match(regexURL)[2]

  if (!resourceType) {
    throw new Error('fetch URL doesn\'t match REST endpoint format. it must contain a resource type')
  }

  const resourceId = fetchURL.match(regexURL)[4] || null

  const queryString = fetchURL.split('?')[1]
  const queryParams = !queryString
    ? {}
    : queryString
        .split('&')
        .map(chunk => chunk.split('='))
        .reduce((a, b) => ({ ...a, [b[0]]: b[1] }), { })

  return {
    method: fetchConfig.method,
    resourceType,
    resourceId,
    params: queryParams,
    request: (succeeded, failed) => {
      fetch(fetchURL, fetchConfig)
        .then(response => {
          succeeded({
            raw: response
            data: res.json(),
          })
        })
        .catch(response => {
          failed({
            raw: response
          })
          
          // Here, you can trigger a notification error
        })
    }
  }
}
```
