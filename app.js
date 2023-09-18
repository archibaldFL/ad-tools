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
    .version('1.0.4');


program.command('server')
    .description('start http server')
    .argument('<port>', 'server port')
    .action(startServer);

program.command('scheduler')
    .description('get net scheduler')
    .argument('<config>', 'config')
    .option('-p, --project <string>', 'project name','zk')
    .action(getScheduler);


 program.parse();
