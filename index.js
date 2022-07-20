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
  const deleted = await deleteAllGoogleContacts(client);
  // NEED TO CHUNK INTO GROUPS OF 100
  const created = await createGoogleContacts(client, convertToGoogleContacts(people));
  console.log(`Created ${created.length} contacts in Google`);
}
