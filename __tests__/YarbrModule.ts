import {EventEmitter} from 'events';

import {createStore, applyMiddleware, compose, Store, Action} from 'redux';
import thunkMiddleware, { ThunkMiddleware } from 'redux-thunk';

import {YarbrModule, actionReducer, asyncRequest, thunkCreator, YarbrAction, YarbrThunkDispatch} from '../src/ts/YarbrModule';

const BRONTO_NAMESPACE = 'brontosaurus';
const EVENT_SUCCEED = 'SUCCEED';
const EVENT_FAIL = 'FAIL';

const composeEnhancers = (window as any).__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;
const storeEnhancers = composeEnhancers(applyMiddleware(thunkMiddleware as  ThunkMiddleware<any, Action>));

describe('YarbrModule', () => {
	let promiseSettler: EventEmitter;
	let dataSettlePromise: Promise<void>;
	let appStore: Store<any> & {dispatch: YarbrThunkDispatch};
	let dispatchedEvents: Array<YarbrAction>;

	class BrontosaurusModule extends YarbrModule {
		public get namespace() {
			return BRONTO_NAMESPACE;
		}
		@actionReducer
		public eatFood(state, action) {
			return {
				...state,
				stomachContents: [...state.stomachContents, action.payload],
			};
		}

		@thunkCreator
		public delayedFood(value) {
			return (dispatch) => dispatch(this.actionCreators.eatFood(value));
		}

		@asyncRequest
		public destinyData(arg1: number, arg2: number) {
			return dataSettlePromise.then(() => {
				appStore.dispatch(brontosaurusModule.actionCreators.eatFood('destiny dreams'));
				return `promise response data: ${arg1} * ${arg2} = ${arg1 * arg2}`;
			}).catch(() => {
				appStore.dispatch(brontosaurusModule.actionCreators.eatFood('unmet hopes'));
				throw new Error(String(arg1));
			})
		}
	}

	const brontosaurusInitialState = {
		stomachContents: [],
		destinyData: {
			isError: false,
			isLoaded: false,
			isLoading: false,
			data: undefined,
		},
	};
	let brontosaurusModule: YarbrModule;

	beforeEach(() => {
		dispatchedEvents = [];
		brontosaurusModule = new BrontosaurusModule(brontosaurusInitialState);
		appStore = createStore(brontosaurusModule.reducer, undefined, storeEnhancers);
		promiseSettler = new EventEmitter();
		dataSettlePromise = new Promise(
			(resolve, reject) => {
				promiseSettler.on(EVENT_SUCCEED, () => resolve());
				promiseSettler.on(EVENT_FAIL, () => reject());
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
		expect(typeof brontosaurusModule.thunkCreators.delayedFood).toEqual('function');
	});

	it('allows thunk to access to other action creators', () => {
		const dispatchMock: jest.Mock = jest.fn();
		brontosaurusModule.thunkCreators.delayedFood('palm tree')(dispatchMock, null, null);

		expect(dispatchMock).toBeCalledWith(brontosaurusModule.actionCreators.eatFood('palm tree'));
	});

	it('handles successful async requests', () => {
		const dispatchMock: jest.Mock = jest.fn();
		const getStateMock: jest.Mock = jest.fn().mockImplementation(() => ({}));
		const testPromise = brontosaurusModule.thunkCreators.destinyDataRequest(2, 3)(dispatchMock, getStateMock, null)
			.then((result) => {
				expect(result).toEqual("promise response data: 2 * 3 = 6");
			});


		promiseSettler.emit(EVENT_SUCCEED);
		return testPromise;
	});

	it('handles async requests', () => {
		appStore.subscribe(() => {
			dispatchedEvents = [...dispatchedEvents, appStore.getState()];
		})
		const testPromise = appStore.dispatch(brontosaurusModule.thunkCreators.destinyDataRequest(2, 3))
			.catch(() => expect("you should").toEqual("never get here"))
			.then((result: Number) => {
				expect(result).toEqual("promise response data: 2 * 3 = 6");
				expect(dispatchedEvents[0]['destinyData']).toEqual(
					{
						...brontosaurusInitialState.destinyData,
						isLoading: true,
					}
				);
				expect(dispatchedEvents[0]['stomachContents']).toEqual([]);
				expect(dispatchedEvents[1]['destinyData']).toEqual(
					{
						...brontosaurusInitialState.destinyData,
						isLoading: true,
					}
				);
				expect(dispatchedEvents[1]['stomachContents']).toEqual(['destiny dreams']);
				expect(dispatchedEvents[2]['destinyData']).toEqual(
					{
						...brontosaurusInitialState.destinyData,
						isLoaded: true,
						data: "promise response data: 2 * 3 = 6",
					}
				);
				expect(dispatchedEvents[2]['stomachContents']).toEqual(['destiny dreams']);
			});

		promiseSettler.emit(EVENT_SUCCEED);
		return testPromise;
	});

	it('handles failed async requests', () => {
		appStore.subscribe(() => {
			dispatchedEvents = [...dispatchedEvents, appStore.getState()];
		})
		const testPromise = appStore.dispatch(brontosaurusModule.thunkCreators.destinyDataRequest(2))
			.then(() => expect("you should").toEqual("never get here"))
			.catch((error: Error) => {
				expect(error.message).toEqual("2");
				expect(dispatchedEvents[0]['destinyData']).toEqual(
					{
						...brontosaurusInitialState.destinyData,
						isLoading: true,
					}
				);
				expect(dispatchedEvents[0]['stomachContents']).toEqual([]);
				expect(dispatchedEvents[1]['destinyData']).toEqual(
					{
						...brontosaurusInitialState.destinyData,
						isLoading: true,
					}
				);
				expect(dispatchedEvents[1]['stomachContents']).toEqual(['unmet hopes']);
				expect(dispatchedEvents[2]['destinyData']).toEqual(
					{
						...brontosaurusInitialState.destinyData,
						isLoaded: true,
						isError: true,
						data: new Error("2"),
					}
				);
				expect(dispatchedEvents[2]['stomachContents']).toEqual(['unmet hopes']);
				return Promise.resolve();
			});

		promiseSettler.emit(EVENT_FAIL);
		return testPromise;
	});
});
