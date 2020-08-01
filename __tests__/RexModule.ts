import {Promise} from 'es6-promise';
import {merge} from 'lodash';
import {RexModule, actionReducer, asyncRequest, thunkCreator} from '../src/ts/RexModule';

const brontoNamespace = 'brontosaurus';

describe('RexModule', () => {
	class BrontosaurusModule extends RexModule {
		public get namespace() {
			return brontoNamespace;
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
			return Promise.resolve(requestValue1 * requestValue2);
		}
	}

	const brontosaurusInitialState = {
		neckLength: 30,
	};
	let brontosaurusModule;

	beforeEach(() => {
		brontosaurusModule = new BrontosaurusModule(brontosaurusInitialState);
	});

	it('has basic default namespace', () => {
		expect(brontosaurusModule.namespace).toEqual(brontoNamespace);
	});

	it('has basic action types', () => {
		expect(brontosaurusModule.types.incrementNeck).toEqual(brontoNamespace + '//incrementNeck');
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
		return brontosaurusModule.actionCreators.destinyDataRequest(2, 3)(dispatchMock, getStateMock)
			.then((result) => {
				expect(result).toEqual(6);
			});
	});
});
