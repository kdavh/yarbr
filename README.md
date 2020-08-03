# Yarbr

Yet another Redux boilerplate reducer.

A tiny library to reduce boilerplate when writing redux reducers, actions, action creators.


### Install in your project:
- `npm install yarbr`


### Use in your app:

- [**See example app integration test**](./__tests__/integrationReactRedux.tsx) and [**unit tests**](./__tests__/YarbrModule.ts) or see below for a brief overview.
- The library provides a base module class, and a set of [decorator functions](http://www.typescriptlang.org/docs/handbook/decorators.html).
- Example, [see how class and helpers are used](./__tests__/YarbrModule.ts)
- Example, [see how it's used with react](./__tests__/integrationReactRedux.ts)

    ```typescript
    import {ActionCreator} from 'redux';
    import {YarbrModule, actionReducer} from 'yarbr';

    const initialState = {};

    class MyModule extends YarbrModule {
        public get namespace(): {
          return 'myReduxStateNamespace';
        }

        @actionReducer
        public myCustomFunction(state, action) {...}
    }

    type MyModuleType = {
        actionCreators: {
            myCustomFunction: ActionCreator;
        };
        reducer(state, action): Exclude<any, undefined>;
        namespace: string;
        types: {
            myCustomFunction: string;
        };
    }
    const myModule: MyModuleType = new MyModule(initialState);
    ```
    - The `myModule` class instance has this interface:
        - `myModule.actionCreators.myCustomFunction` - an action creator function that creates a [FSA (Flus Standard Action)](https://github.com/redux-utilities/flux-standard-action)
        - `myModule.reducer` - a reducer function that integrates the original function defined by `myCustomFunction`
        - `myModule.namespace` - a namespace to use when using redux's `combineReducers`
        - `myModule.types.myCustomFunction` - a type string used by the corresponding action creator, useful for tests or advanced usage.
        - (advanced usage) `myModule.reducerMap` - add your own reducer to this object to allow the module's reducer to handle a one-off action from somewhere else.

### Develop this project

- install npm https://nodejs.org/en/
- install npx `npm install -g npx`

#### Run tests

`npm test`

#### Build

`npm run build`
