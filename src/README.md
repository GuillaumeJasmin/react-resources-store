# Axios Redux

## Configure Redux store and Axios instance

`store.js`

```js
import axios from 'axios'
import { createStore, combineReducers } from 'redux'
import { createReducers, AxiosReduxProvider, useRequest, useLazyRequest } from 'axios-redux'

const reducers = createReducers({
  articles: {
    comments: ['comments', 'articleId']
  },
  comments: {
    article: 'article'
  }
})


const rootReducer = combineReducers({
  articles: createReducer('articles'),
  comments: createReducer('comments')
})

export const store = createStore(rootReducer)

export const api = axios.create({
  baseURL: 'http://website.com/api/',
  timeout: 20000,
})

const axiosReduxContext = {
  store,
  api
}

const App = (
  <AxiosReduxProvider value={axiosReduxContext}>
    {...}
  </AxiosReduxProvider>
)

function Demo() {
  const api = useAPI()

  const [articles, loading] = useRequest({
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

  const [createArticle] = useLazyRequest((data) => ({
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

## Fetch your data

```js

import { api, store } from './store'

...

store.subscribe(() => {
  const state = store.getState()
  console.log(state.articles.resources)
})

api.get('articles', {
  redux: {
    type: 'READ',
    resourceType: 'articles',
  }
})
```

### Shorter syntaxe
you could omit `redux.type`:
```js
api.get('articles', { resourceType: 'articles' })
```

* `redux.type` - If it's not set, type will be infer from method

|    method   |    type    | 
| ----------  |  --------- | 
| GET         |    READ    | 
| POST        |   CREATE   | 
| PATCH / PUT |   UPDATE   | 
| DELETE      |   DELETE   | 
