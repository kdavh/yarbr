# Redux Rex

A mini dinosaur with tiny arms. Also a tiny library to reduce boilerplate when writing redux reducers, actions, action creators.


### Install in your project:
- `npm install redux-rex`


### Use in your app:
- [**See example app integration test**](./__tests__/rex-app-integration.tsx) and [**unit tests**](./__tests__/RexModule.ts) or see below for a brief overview.
- The library provides a base module class, and a set of [decorator functions](http://www.typescriptlang.org/docs/handbook/decorators.html). In a nutshell, decorator functions are applied to class members like this:
    ```typescript
    function myDecoratorFunction(..) {...}

    class MyClass {
        // `@myDecoratorFunction` mutates how `myFunction` works
        // or even where it lives on a `MyClass` object.
        @myDecoratorFunction
        myFunction() {...}
    }
    ```
- Our helper decorators are used like this:
    ```typescript
    import {ActionCreator} from 'redux';
    import {RexModule, actionReducer} from '@console/wtb-redux-rex';

    const initialState = {...};

    class MyModule extends RexModule {
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
