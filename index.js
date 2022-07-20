import 'dotenv/config';
import { convertToGoogleContacts } from './converter.js';
import { getFastmailContacts } from './fastmail.js';
import { createGoogleContacts, deleteAllGoogleContacts, getAuthenticatedClient } from './google.js';

try {
  main();
} catch (e) {
  console.error('Error:', e.message);
}

async function main() {
  const people = await getFastmailContacts();
  const client = await getAuthenticatedClient();
  await deleteAllGoogleContacts(client);
  const converted = convertToGoogleContacts(people);
  const chunks = chunkArray(converted, 200);
  for (const chunk of chunks) {
    await createGoogleContacts(client, chunk);
  }
}

function chunkArray(a, size) {
  var arrays = [];
  for (let i = 0; i < a.length; i += size) {
    arrays.push(a.slice(i, i + size));
  }
  return arrays;
}
