#!/usr/bin/env node
'use strict';

// Explicit normal EdgeOne static output. No runtime bundle is rebuilt.
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const output = path.join(root, '.edgeone');
const assets = path.join(output, 'assets');
const config = JSON.parse(fs.readFileSync(path.join(root, 'edgeone.json'), 'utf8'));
const excluded = new Set([
  'node_modules', 'cloud-functions', 'node-functions', 'edge-functions',
  'agents', 'functions', 'go.mod', 'go.sum',
]);

fs.rmSync(assets, { recursive: true, force: true });
fs.mkdirSync(assets, { recursive: true });
for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
  if (excluded.has(entry.name) || (entry.name.startsWith('.') && entry.name !== '.well-known')) continue;
  const source = path.join(root, entry.name);
  const destination = path.join(assets, entry.name);
  if (entry.isDirectory()) fs.cpSync(source, destination, { recursive: true, force: true });
  else if (entry.isFile()) fs.copyFileSync(source, destination);
  else throw new Error('Static publisher contains an unsupported entry: ' + entry.name);
}

const routes = {
  version: 3,
  routes: [
    { handle: 'filesystem' },
    {
      src: '/.*',
      dest: '/404.html',
      'server-name': 'file',
      status: 404,
    },
  ],
  conf: config,
};
fs.writeFileSync(path.join(output, 'routes.json'), JSON.stringify(routes, null, 2) + '\n');
console.log('Prepared unchanged static assets and filesystem-first 404 routes.');
