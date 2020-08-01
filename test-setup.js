const React = require('react');
const {mount, render, shallow} = require('enzyme');
const Enzyme  = require('enzyme');
const Adapter = require('enzyme-adapter-react-16');
// require('@babel/polyfill');

Enzyme.configure({adapter: new Adapter()});

window.React = React;
window.mount = mount;
window.render = render;
window.shallow = shallow;

process.on('unhandledRejection', (reason, p) => {
	throw new Error(reason.stack);
});
