import 'dotenv/config';
import { OAuth2Client } from 'google-auth-library';
import { createServer } from 'http';
import open from 'open';
import destroyer from 'server-destroy';

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI;
const SUCCESS_MSG = 'Authentication successful! You can now close this tab or window.';

export function getAuthenticatedClient() {
  return new Promise((resolve, reject) => {
    const oAuth2Client = new OAuth2Client(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
    const port = new URL(REDIRECT_URI).port;
    const authorizeUrl = oAuth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: ['https://www.googleapis.com/auth/userinfo.profile', 'https://www.googleapis.com/auth/contacts'],
      xxxscope: 'https://www.googleapis.com/auth/userinfo.profile',
      yyyscope: 'https://www.googleapis.com/auth/contacts'
    });
    const server = createServer(async (req, res) => {
      try {
        const qs = new URL(req.url, REDIRECT_URI).searchParams;
        const code = qs.get('code');
        res.end(SUCCESS_MSG);
        server.destroy();
        const r = await oAuth2Client.getToken(code);
        oAuth2Client.setCredentials(r.tokens);
        resolve(oAuth2Client);
      } catch (e) {
        reject(e);
      }
    }).listen(port, () => {
      open(authorizeUrl, { wait: false }).then((cp) => cp.unref());
    });
    destroyer(server);
  });
}

export async function deleteAllGoogleContacts(client, total = 0) {
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
    total = await deleteAllGoogleContacts(client, total + count);
  }
  return total;
}

export async function createGoogleContacts(client, people) {
  const contacts = people.map((p) => ({ contactPerson: p }));
  const options = {
    method: 'POST',
    url: 'https://people.googleapis.com/v1/people:batchCreateContacts',
    data: { contacts },
    readMask: 'names'
  };
  return await client.request(options);
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

async function wait(seconds) {
  return new Promise((resolve) => {
    setTimeout(() => resolve(), seconds * 1000);
  });
}
