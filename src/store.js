import { createStore, combineReducers, applyMiddleware } from "redux";
import thunkMiddleware from "redux-thunk";

//actionType
const FILE_LIST = "fileServer/fileList";
const TEXT = "fileServer/text";

// initialSate
const initialState = () => ({
  fileList: [],
  text: "123"
});

//reducer
const dataReducer = function (state = initialState(), action = {}) {
  switch (action.type) {
    case FILE_LIST:
      return Object.assign({}, state, { fileList: action.data });
    case TEXT:
      return Object.assign({}, state, { text: action.data });
    default:
      return state;
  }
}

//action
export const updateFileList = data => ({
  type: FILE_LIST,
  data
});

export const updateText = data => ({
  type: TEXT,
  data
});

// combineReducers
let reducersMap = {
    fileServer: {
          dataReducer
      }
    };

const reducer = combineReducers({
    ...Object.keys(reducersMap).reduce(
      (item, total) =>
        Object.assign({}, item, {
          [total]: (state, action) => {
            if (!state) {
              return Object.keys(reducersMap[total])
                .map(i => reducersMap[total][i](state, action))
                .reduce((prev, next) => Object.assign({}, prev, next), {});
            } else {
              Object.keys(reducersMap[total]).map(i => {
                return state = Object.assign({}, state, reducersMap[total][i](state, action));
              });
              return state;
            }
          }
        }),
      {}
    )
  });

export const createDuxStore = ( initialState ) => createStore( reducer, initialState, applyMiddleware( thunkMiddleware ) );
