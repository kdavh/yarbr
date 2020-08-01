import {ActionCreator, AnyAction} from 'redux';
import {merge} from 'lodash';

export interface RexAction {
	type: string;
	payload: any;
}

export type ReduxState = Exclude<any, undefined>;

type ThunkAction = (dispatch: (action: any) => any, getState: () => any) => any;

type SingleReducer = (state: any, action?: RexAction, globalState?: any) => Exclude<any, undefined>;
type ThunkCreator = (...args: Array<any>) => ThunkAction;

export class RexModule {
	public initialState: ReduxState;

	private _actionCreators: {[key: string]: ThunkCreator | ActionCreator<RexAction | AnyAction>};
	private _types: {[key: string]: string};
	private _reducerMap: {[key: string]: SingleReducer};

	public constructor(initialState) {
		this.initialState = initialState;
	}

	public get namespace(): string {
		// webpack has issues during minification
		// instead of requiring any users of this library to have the `keep_classnames` webpack option set,
		// require them to define their own namespace for their module
		throw new Error('Must define namespace getter in subclasses');
	}

	public reducer = (state: any, action: RexAction, globalState: any = undefined): any => {
		if (state === undefined) {
			state = this.initialState;
		}

		return this.reducerMap[action.type] ? this.reducerMap[action.type](state, action, globalState) : state;
	}

	public get actionCreators() {
		this._actionCreators = this._actionCreators || {};
		return this._actionCreators;
	}

	public get types() {
		this._types = this._types || {};
		return this._types;
	}

	// accessible in case someone wants to add to the reducer, for example to handle an action from a different module.
	public get reducerMap() {
		this._reducerMap = this._reducerMap || {};
		return this._reducerMap;
	}
}

// decorator functions for use inside a class extending RexModule

// usage:
// ```
// class MyModule extends RexModule {
//   @actionReducer
//   myActionCreator(state, action) {...}
// }
// ```
// creates an action creator function on the module object: `myModule.actionCreators.myActionCreator`
// and adds to the reducer function `myModule.reducer` to handle that action
export function actionReducer(targetClass, actionCreatorName) {
	const reducer = targetClass[actionCreatorName];
	const actionType = `${targetClass.namespace}//${actionCreatorName}`;

	targetClass.actionCreators[actionCreatorName] = (payload) => ({
		type: actionType,
		payload,
	});
	delete targetClass[actionCreatorName];

	targetClass.reducerMap[actionType] = reducer;
	targetClass.types[actionCreatorName] = actionType;
}

// usage:
// ```
// class MyModule extends RexModule {
//   @thunkCreator
//   myThunkCreator(value) { return (dispatch) => {...}}
// }
// ```
// takes the thunk action creator function exactly as defined,
// but puts it with the rest of the action creators: `myModule.actionCreators.myThunkCreator`
export function thunkCreator(targetClass, thunkCreatorName) {
	targetClass.actionCreators[thunkCreatorName] = targetClass[thunkCreatorName].bind(targetClass);
	delete targetClass[thunkCreatorName];
}

// usage:
// ```
// class MyModule extends RexModule {
//   @asyncRequest
//   myData(value) {/* return a promise */}
// }
// ```
// a convenience decorator, equivalent to creating some functions like this
// that handle the lifecycle of an http request or any promise-based request:
// ```
// class MyModule extends RexModule {
//   @thunkCreator
//   myDataRequest(..) {...}
//
//   @actionReducer
//   myDataLoading(..) {...}
//
//   @actionReducer
//   myDataError(..) {...}
//
//   @actionReducer
//   myDataSuccess(..) {...}
// }
// ```
// the reducer created will update the namespace `myData` with this information:
// `{isLoading: boolean, hasFailed: boolean, isLoaded: boolean, data: any, error: string?}`
// for example:
// `dispatch(myModule.actionCreators.myDataLoading)` (which is done inside `myModule.actionCreators.myDataRequest`)
// will update the `state.myData.isLoading` to be `true`
//
// NOTE: requests are deduped: later requests are not started if there is currently a request loading
export function asyncRequest(targetClass, dataNamespace) {
	const requestActionCreatorName = `${dataNamespace}Request`;
	const loadingActionCreatorName = `_${dataNamespace}Loading`;
	const errorActionCreatorName = `_${dataNamespace}Error`;
	const successActionCreatorName = `_${dataNamespace}Success`;

	const promiseCreator = targetClass[dataNamespace];
	delete targetClass[dataNamespace];

	targetClass[requestActionCreatorName] = (...promiseCreatorArgs: Array<any>) => (dispatch, getState) => {
		const dataState = getState()[dataNamespace];
		// dedup multiple requests
		if (dataState && dataState.isLoading) {
			return Promise.resolve();
		}

		dispatch(targetClass.actionCreators[loadingActionCreatorName]());
		return promiseCreator(...promiseCreatorArgs).then((resp) => {
			dispatch(targetClass.actionCreators[successActionCreatorName](resp.data));
			return resp;
		}).catch((error) => {
			dispatch(targetClass.actionCreators[errorActionCreatorName](error));
			return Promise.reject(error);
		});
	};
	thunkCreator(targetClass, requestActionCreatorName);

	targetClass[loadingActionCreatorName] = (state) =>
		merge({}, state, {[dataNamespace]: {
				isLoading: true,
				isLoaded: false,
				hasFailed: false,
				data: undefined,
				error: undefined,
			}});
	actionReducer(targetClass, loadingActionCreatorName);

	targetClass[successActionCreatorName] = (state, action) =>
		merge({}, state, {[dataNamespace]: {
			isLoading: false,
			isLoaded: true,
			hasFailed: false,
			data: action.payload,
		}});
	actionReducer(targetClass, successActionCreatorName);

	targetClass[errorActionCreatorName] = (state, action) =>
		merge({}, state, {[dataNamespace]: {
			isLoading: false,
			isLoaded: true,
			hasFailed: true,
			error: action.payload.message,
		}});
	actionReducer(targetClass, errorActionCreatorName);
}
