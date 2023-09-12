// import {startServer} from './server/index.js';
// import {getScheduler} from './scheduler/index.js';
//
// import { Command } from 'commander';

const {startServer} = require('./server');
const {getScheduler} = require('./scheduler');
const {Command} = require('commander');

const program = new Command();


program
    .name('ad-tool')
    .description('tools for ad')
    .version('1.0.3');


program.command('server')
    .description('start http server')
    .argument('<port>', 'server port')
    .action(startServer);

program.command('scheduler')
    .description('get net scheduler')
    .argument('<config>', 'config')
    .action(getScheduler);


 program.parse();
