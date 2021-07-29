#!/usr/bin/env node
'use strict';
const React = require('react');
const importJsx = require('import-jsx');
const {render} = require('ink');
const meow = require('meow');

const ui = importJsx('./ui');

const cli = meow(`
	Usage
	  $ sysrsrc

	
	If you see a specific drive being read, you may delete that drive's path letter in cache.json.
`);

render(React.createElement(ui, cli.flags));
