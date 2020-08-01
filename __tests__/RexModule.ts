import {EventEmitter} from 'events';
import {merge} from 'lodash';

import {createStore, applyMiddleware, compose, Store} from 'redux';
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
	let appStore: Store;
	let dispatchedEvents: Array<RexAction>;

	class BrontosaurusModule extends RexModule {
		public get namespace() {
			return BRONTO_NAMESPACE;
		}
		@actionReducer
		public eatFood(state, action) {
			return merge({}, state, {
				stomachContents: [...state.stomachContents, action.payload],
			});
		}

		@thunkCreator
		public delayedFood(value) {
			return (dispatch) => dispatch(this.actionCreators.eatFood(value));
		}

		@asyncRequest
		public destinyData(requestValue1, requestValue2) {
			return dataResolvePromise.then(() => {
				appStore.dispatch(brontosaurusModule.actionCreators.eatFood('destiny dreams'));
				return requestValue1 * requestValue2;
			})
		}
	}

	const brontosaurusInitialState = {
		stomachContents: [],
	};
	let brontosaurusModule;

	beforeEach(() => {
		dispatchedEvents = [];
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
		expect(brontosaurusModule.types.eatFood).toEqual(BRONTO_NAMESPACE + '//eatFood');
	});

	it('has basic action creator', () => {
		const action = {type: brontosaurusModule.types.eatFood, payload: 'palm tree'};
		expect(brontosaurusModule.actionCreators.eatFood('palm tree')).toEqual(action);
	});

	it('has a reducer', () => {
		expect(typeof brontosaurusModule.reducer).toEqual('function');
	});

	it('reduces basic action', () => {
		expect(brontosaurusModule.reducer(undefined, brontosaurusModule.actionCreators.eatFood('palm tree'))).toEqual({
			...brontosaurusInitialState,
			stomachContents: ['palm tree'],
		});
	});

	it('stores thunk action creators as-is', () => {
		expect(typeof brontosaurusModule.actionCreators.delayedFood).toEqual('function');
	});

	it('allows thunk to access to other action creators', () => {
		const dispatchMock: jest.Mock = jest.fn();
		brontosaurusModule.actionCreators.delayedFood('palm tree')(dispatchMock);

		expect(dispatchMock).toBeCalledWith(brontosaurusModule.actionCreators.eatFood('palm tree'));
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

	it('handles async requests', () => {
		appStore.subscribe(() => {
			dispatchedEvents = [...dispatchedEvents, appStore.getState()];
		})
		const testPromise = appStore.dispatch(brontosaurusModule.actionCreators.destinyDataRequest(2, 3))
			.then((result) => {
				expect(result).toEqual(6);
				expect(dispatchedEvents[0]['destinyData']).toEqual(
					{
						hasFailed: false,
						isLoaded: false,
						isLoading: true,
						data: undefined,
						error: undefined,
					}
				);
				expect(dispatchedEvents[0]['stomachContents']).toEqual([]);
				expect(dispatchedEvents[1]['destinyData']).toEqual(
					{
						hasFailed: false,
						isLoaded: false,
						isLoading: true,
						data: undefined,
						error: undefined,
					}
				);
				expect(dispatchedEvents[1]['stomachContents']).toEqual(['destiny dreams']);
				expect(dispatchedEvents[2]['destinyData']).toEqual(
					{
						hasFailed: false,
						isLoaded: true,
						isLoading: false,
						data: undefined,
						error: undefined,
					}
				);
				expect(dispatchedEvents[2]['stomachContents']).toEqual(['destiny dreams']);
			});

		promiseSettler.emit(EVENT_RESOLVE);
		return testPromise;
	});
});
