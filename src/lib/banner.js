/* eslint-disable no-console */
const { colours } = require('leeks.js');
const figlet = require('figlet');
const link = require('terminal-link');

module.exports = version => {
	figlet
		.textSync('Galitube', { font: 'Banner3' })
		.split('\n')
		.forEach(line => console.log(colours.cyan(line)));
	console.log('');
	figlet
		.textSync('Tickets', { font: 'Banner3' })
		.split('\n')
		.forEach(line => console.log(colours.cyan(line)));
	console.log('');
	console.log(colours.cyanBright(`${link('Galitube Tickets', 'https://github.com/Galitube-Developement/GalitubeTickets#readme')} bot v${version} by Galitube Hosting`));
	console.log(colours.cyanBright('Galitube Hosting: https://github.com/Galitube-Developement/GalitubeTickets#readme'));
	console.log('\n');
};
