import { createStore, combineReducers, applyMiddleware } from "redux";
import thunkMiddleware from "redux-thunk";

// initialSate
const initialState = () => ({
    initialSession: false,
    textWord: "123"
});

//reducer
const sessionReducer = ( state = initialState(), action ) => {
    switch ( action.type ) {
        case "INITIALIZE_SESSION":
            return Object.assign({}, state, { initialSession: action.data });
        default: 
            return state;
    }
};
const dataReducer = ( state = initialState(), action ) => {
    switch ( action.type ) {
        case "STORE_DATA":
            return Object.assign({}, state, { textWord: action.data });
        default: 
            return state;
    }
};

//action
export const initializeSession = ( data ) => ( {
    type: "INITIALIZE_SESSION",
    data
} );
export const storeData = ( data ) => ( {
    type: "STORE_DATA",
    data,
});


// combineReducers
let reducersMap = {
    session: {
        sessionReducer
    },
    data: {
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

export default ( initialState ) => createStore( reducer, initialState, applyMiddleware( thunkMiddleware ) );
