import 'dotenv/config';
import { getAuthenticatedClient } from './google.js';

try {
  main();
} catch (e) {
  console.error('Error:', e.message);
}

/**
 * Start by acquiring a pre-authenticated oAuth2 client.
 */
async function main() {
  const client = await getAuthenticatedClient();
  const count = await deleteAll(client);
  if (count > 0) {
    console.log(`Deleted ${count} contact${count > 1 ? 's' : ''}`);
  } else {
    console.log('No contacts to delete');
  }
}

async function deleteAll(client, total = 0) {
  const resourceNames = await getResourceNames(client);
  const count = resourceNames.length;
  if (count > 0) {
    const options = {
      method: 'POST',
      url: `https://people.googleapis.com/v1/people:batchDeleteContacts`,
      data: { resourceNames }
    };
    await client.request(options);
    await wait(1);
    total = await deleteAll(client, total + count);
  }
  return total;
}

async function getResourceNames(client) {
  const url = 'https://people.googleapis.com/v1/people/me/connections?personFields=names';
  const res = await client.request({ url });
  if (Array.isArray(res.data.connections)) {
    return res.data.connections.map((person) => person.resourceName);
  } else {
    return [];
  }
}

async function createContact(client) {
  const options = {
    method: 'POST',
    url: 'https://people.googleapis.com/v1/people:createContact',
    params: { personFields: ['names', 'phoneNumbers'] },
    data: {
      names: [
        {
          familyName: 'Summerfield',
          givenName: 'Adam'
        }
      ],
      phoneNumbers: [
        {
          value: '(303) 499-2357',
          type: 'home'
        }
      ]
    }
  };
  return await client.request(options);
}

async function wait(seconds) {
  return new Promise((resolve) => {
    setTimeout(() => resolve(), seconds * 1000);
  });
}
