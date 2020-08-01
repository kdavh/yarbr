import {EventEmitter} from 'events';
import {merge} from 'lodash';

import {createStore, applyMiddleware, compose} from 'redux';
import thunkMiddleware from 'redux-thunk';

import {RexModule, actionReducer, asyncRequest, thunkCreator, RexAction} from '../src/ts/RexModule';

const BRONTO_NAMESPACE = 'brontosaurus';
const EVENT_RESOLVE = 'resolve';
const EVENT_REJECT = 'reject';

const composeEnhancers = (window as any).__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;
const storeEnhancers = composeEnhancers(applyMiddleware(thunkMiddleware));

describe('RexModule', () => {
	let promiseSettler: EventEmitter;
	let dataResolvePromise: Promise<void>;
	let dataRejectPromise: Promise<void>;
	let dataRequestValue1: Number;
	let dataRequestValue2: Number;
	let appStore: any;

	class BrontosaurusModule extends RexModule {
		public get namespace() {
			return BRONTO_NAMESPACE;
		}
		@actionReducer
		public incrementNeck(state, action) {
			return merge({}, state, {
				neckLength: state.neckLength + action.payload,
			});
		}

		@thunkCreator
		public delayedIncrementNeck(value) {
			return (dispatch) => dispatch(this.actionCreators.incrementNeck(value));
		}

		@asyncRequest
		public destinyData(requestValue1, requestValue2) {
			return dataResolvePromise.then(() => {
				return requestValue1 * requestValue2;
			})
		}
	}

	const brontosaurusInitialState = {
		neckLength: 30,
	};
	let brontosaurusModule;

	beforeEach(() => {
		brontosaurusModule = new BrontosaurusModule(brontosaurusInitialState);
		appStore = createStore(brontosaurusModule.reducer, undefined, storeEnhancers);
		promiseSettler = new EventEmitter();
		dataResolvePromise = new Promise(
			(resolve, _) => {
				promiseSettler.on(EVENT_RESOLVE, () => resolve());
			}
		);
		dataRejectPromise = new Promise(
			(_, reject) => {
				promiseSettler.on('reject', () => reject());
			}
		);
	});

	it('has basic default namespace', () => {
		expect(brontosaurusModule.namespace).toEqual(BRONTO_NAMESPACE);
	});

	it('has basic action types', () => {
		expect(brontosaurusModule.types.incrementNeck).toEqual(BRONTO_NAMESPACE + '//incrementNeck');
	});

	it('has basic action creator', () => {
		const action = {type: brontosaurusModule.types.incrementNeck, payload: 1};
		expect(brontosaurusModule.actionCreators.incrementNeck(1)).toEqual(action);
	});

	it('has a reducer', () => {
		expect(typeof brontosaurusModule.reducer).toEqual('function');
	});

	it('reduces basic action', () => {
		expect(brontosaurusModule.reducer(undefined, brontosaurusModule.actionCreators.incrementNeck(1))).toEqual({
			...brontosaurusInitialState,
			neckLength: 31,
		});
	});

	it('stores thunk action creators as-is', () => {
		expect(typeof brontosaurusModule.actionCreators.delayedIncrementNeck).toEqual('function');
	});

	it('allows access to other action creators', () => {
		const dispatchMock: jest.Mock = jest.fn();
		brontosaurusModule.actionCreators.delayedIncrementNeck(1)(dispatchMock);

		expect(dispatchMock).toBeCalledWith(brontosaurusModule.actionCreators.incrementNeck(1));
	});

	it('handles async requests', () => {
		const dispatchMock: jest.Mock = jest.fn();
		const getStateMock: jest.Mock = jest.fn().mockImplementation(() => ({}));
		const testPromise = brontosaurusModule.actionCreators.destinyDataRequest(2, 3)(dispatchMock, getStateMock)
			.then((result) => {
				expect(result).toEqual(6);
			});


		promiseSettler.emit(EVENT_RESOLVE);
		return testPromise;
	});
});
