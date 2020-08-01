const Enzyme = require('enzyme');
const Adapter = require('enzyme-adapter-react-16');

Enzyme.configure({adapter: new Adapter()});

process.on('unhandledRejection', (reason, p) => {
	throw new Error(reason.stack);
});
