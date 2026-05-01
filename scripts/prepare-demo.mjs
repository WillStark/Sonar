import fs from 'node:fs/promises';

const demoLeads = [
  { name: 'Sarah Chen', company: 'Upstart', title: 'VP Collections' },
  { name: 'David Kim', company: 'LendingClub', title: 'Head of Recovery' },
  { name: 'Maria Lopez', company: 'SoFi', title: 'Director of Collections' }
];

await fs.mkdir('data/demo', { recursive: true });
await fs.writeFile('data/demo/leads.json', JSON.stringify(demoLeads, null, 2));
console.log('Prepared demo leads:', demoLeads.map((l) => l.name).join(', '));
