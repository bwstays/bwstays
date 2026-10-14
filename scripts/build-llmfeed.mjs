#!/usr/bin/env node
/**
 * Builds .well-known/mcp.llmfeed.json (LLMFeed format, https://llmfeed.json.org) from mcp.json.
 * The LLMFeed health monitor (issue #95) looks for this file and a populated `capabilities` list.
 * Everything is derived from the Static MCP manifest, so nothing is typed by hand and the two
 * files cannot disagree.
 *
 *   node scripts/build-llmfeed.mjs           # write the file
 *   node scripts/build-llmfeed.mjs --check   # exit 1 if it is stale
 *
 * Run it after node scripts/generate-mcp.mjs.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CHECK = process.argv.includes('--check');
const ORIGIN = 'https://www.bwstays.com';
const OUT = path.join(ROOT, '.well-known/mcp.llmfeed.json');

const mcp = JSON.parse(fs.readFileSync(path.join(ROOT, 'mcp.json'), 'utf8'));
const abs = (p) => `${ORIGIN}${p}`;

const feed = {
  feed_type: 'mcp',
  metadata: {
    title: 'Black and White Stays - Kalpetta, Wayanad',
    origin: ORIGIN,
    description: mcp.description,
    lang: 'en',
    generated_at: mcp.metadata.generated,
    generator: 'scripts/build-llmfeed.mjs (from mcp.json)',
    contact: mcp.metadata.contact,
  },
  trust: {
    scope: 'public',
    signed: false,
    note: 'Static snapshot generated from the published website. Availability is a snapshot, not live.',
  },
  prompts: [
    { intent: 'find a place to stay in Kalpetta Wayanad', keywords: ['villa', 'homestay', 'Kalpetta', 'Wayanad', 'stay'], description: 'Villas, rates and capacity published by the site.' },
    { intent: 'plan sightseeing near Kalpetta', keywords: ['places to visit', 'waterfall', 'trek', 'museum', 'Wayanad'], description: 'Attractions with distances from the stay and nearby places.' },
    { intent: 'find food near the stay', keywords: ['restaurant', 'cafe', 'food', 'Kalpetta'], description: 'Places to eat from OpenStreetMap with driving distances.' },
    { intent: 'check availability and how to book', keywords: ['availability', 'booking', 'price'], description: 'Booked and closed dates, nightly rates and how to contact.' },
  ],
  capabilities: [
    ...mcp.tools.map((t) => ({
      name: t.name,
      type: 'tool',
      method: 'GET',
      path: abs(t.path),
      description: t.description,
    })),
    ...mcp.resources.map((r) => ({
      name: r.name,
      type: 'resource',
      method: 'GET',
      path: abs(r.path),
      description: r.description,
    })),
  ],
  related: [
    { rel: 'static-mcp-manifest', href: abs('/mcp.json') },
    { rel: 'llms-full', href: abs('/llms-full.txt') },
  ],
};

const text = JSON.stringify(feed, null, 2) + '\n';
if (CHECK) {
  const cur = fs.existsSync(OUT) ? fs.readFileSync(OUT, 'utf8').replace(/\r\n/g, '\n') : '';
  if (cur !== text) {
    console.error('.well-known/mcp.llmfeed.json is stale: run node scripts/build-llmfeed.mjs');
    process.exit(1);
  }
  console.log('mcp.llmfeed.json is current');
} else {
  fs.writeFileSync(OUT, text);
  console.log(`wrote .well-known/mcp.llmfeed.json: ${feed.capabilities.length} capabilities`);
}
