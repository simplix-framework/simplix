#!/usr/bin/env node
import { main } from '../src/cli.js';
import { tolerateClosedReader } from '../src/lib/console.js';

tolerateClosedReader(process.stdout);
process.exitCode = main(process.argv.slice(2));
