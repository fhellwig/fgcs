import 'dotenv/config';
import { OAuth2Client } from 'google-auth-library';
import { createServer } from 'http';
import open from 'open';
import destroyer from 'server-destroy';

const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI;
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
