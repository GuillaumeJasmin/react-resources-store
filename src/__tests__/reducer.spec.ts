// import { createReducers } from '../createReducers'
// import { ResourceState, ReducersConfig } from '../types'
// import { KEY } from '../contants'

// const config: ReducersConfig = {
//   articles: {
//     comments: ['comments', 'articleId'],
//   },
//   comments: {
//     article: 'articles',
//   },
// }

// function getArticle() {
//   return {
//     id: 'article_1',
//     title: 'Title 1',
//     content: 'Content 1',
//   }
// }

// describe('createReducer', () => {
//   it('should return a function', () => {
//     const reducer = createReducers(config).articles
//     expect(typeof reducer).toBe('function')
//   })

//   it('should throw if there is no type', () => {
//     const reducer = createReducers(config).articles

//     const action = {
//       key: KEY,
//     }

//     expect(() => reducer(undefined, action)).toThrow('AxiosRedux - missing action properties: resourceType')
//   })

//   it('should reducer return default Resourcestate', () => {
//     const reducer = createReducers(config).articles

//     const action = {}

//     const expectedState = {
//       resources: {},
//       requests: {},
//       lists: {},
//     }

//     expect(reducer(undefined, action)).toEqual(expectedState)
//   })

//   it('should reducer handle READ_PENDING type', () => {
//     const reducer = createReducers(config).articles

//     const action = {
//       key: KEY,
//       type: 'READ_PENDING',
//       resourceType: 'articles',
//       requestKey: 'requestKey_1',
//     }

//     const expectedState = {
//       resources: {},
//       requests: {
//         requestKey_1: {
//           requestKey: 'requestKey_1',
//           status: 'PENDING',
//           ids: [],
//         },
//       },
//       lists: {},
//     }

//     expect(reducer(undefined, action)).toEqual(expectedState)
//   })

//   it('should reducer handle READ_SUCCEEDED type', () => {
//     const reducer = createReducers(config).articles

//     const initialState: ResourceState = {
//       resources: {},
//       requests: {
//         requestKey_1: {
//           requestKey: 'requestKey_1',
//           status: 'PENDING',
//           ids: [],
//         },
//       },
//       lists: {},
//     }

//     const article = getArticle()

//     const action = {
//       key: KEY,
//       type: 'READ_SUCCEEDED',
//       resourceType: 'articles',
//       requestKey: 'requestKey_1',
//       payload: [
//         article,
//       ],
//     }

//     const expectedState = {
//       resources: {
//         [article.id]: article,
//       },
//       requests: {
//         requestKey_1: {
//           requestKey: 'requestKey_1',
//           status: 'SUCCEEDED',
//           ids: [article.id],
//         },
//       },
//       lists: {},
//     }

//     expect(reducer(initialState, action)).toEqual(expectedState)
//   })

//   it('should reducer handle READ_FAILED', () => {
//     const reducer = createReducers(config).articles

//     const initialState: ResourceState = {
//       resources: {},
//       requests: {
//         requestKey_1: {
//           requestKey: 'requestKey_1',
//           status: 'PENDING',
//           ids: [],
//         },
//       },
//       lists: {},
//     }

//     const action = {
//       key: KEY,
//       type: 'READ_FAILED',
//       resourceType: 'articles',
//       requestKey: 'requestKey_1',
//     }

//     const expectedState = {
//       resources: {},
//       requests: {
//         requestKey_1: {
//           requestKey: 'requestKey_1',
//           status: 'FAILED',
//           ids: [],
//         },
//       },
//       lists: {},
//     }

//     expect(reducer(initialState, action)).toEqual(expectedState)
//   })

//   it('should reducer skip action if key doesn\'t match', () => {
//     const reducer = createReducers(config).articles

//     const initialState = {
//       resources: {},
//       requests: {},
//       lists: {},
//     }

//     const action = {
//       type: 'READ_PENDING',
//       resourceType: 'articles',
//       requestKey: 'requestKey_1',
//     }

//     expect(reducer(initialState, action)).toEqual(initialState)
//   })

//   // it('should reducer work with included resources', () => {
//   //   const reducerConfig = {
//   //     included: {
//   //       comments: {
//   //         resourceTypes: 'comments',
//   //         relation: [new schema.Entity('comments')],
//   //       },
//   //     },
//   //   }

//   //   const reducer = createReducer('articles', reducerConfig)

//   //   const initialState = {
//   //     resources: {},
//   //     requests: {},
//   //     lists: {},
//   //   }

//   //   const article = {
//   //     ...getArticle(),
//   //     comments: [
//   //       getComment(),
//   //     ],
//   //   }

//   //   const action = {
//   //     type: 'READ_SUCCEEDED',
//   //     resourceType: 'articles',
//   //     requestKey: 'requestKey_1',
//   //     payload: [
//   //       article,
//   //     ],
//   //   }

//   //   expect(reducer(initialState, action)).toEqual(initialState)
//   // })
// })
