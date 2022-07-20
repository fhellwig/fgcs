import { DAVClient } from 'tsdav';
import parser from 'vdata-parser';

const URI = process.env.FASTMAIL_URI;
const USERNAME = process.env.FASTMAIL_USERNAME;
const PASSWORD = process.env.FASTMAIL_PASSWORD;

const client = new DAVClient({
  serverUrl: URI,
  credentials: {
    username: USERNAME,
    password: PASSWORD
  },
  authMethod: 'Basic',
  defaultAccountType: 'carddav'
});

export async function getFastmailContacts() {
  await client.login();

  const addressBooks = await client.fetchAddressBooks();
  const vcards = await client.fetchVCards({
    addressBook: addressBooks[0]
  });
  console.log(vcards);
  return vcards.map((vcard) => parseVCard(parser.fromString(vcard.data).VCARD));
}

function parseVCard(vcard) {
  return {
    name: parseName(vcard.N),
    org: parseOrg(vcard.ORG),
    phoneNumbers: parsePhoneNumbers(vcard.TEL)
  };
}

function parseName(n) {
  if (typeof n === 'string') {
    const parts = n.split(';');
    if (parts[0] || parts[1]) {
      return {
        givenName: parts[1],
        familyName: parts[0]
      };
    }
  }
  return null;
}

function parseOrg(org) {
  if (org) {
    const parts = org.split(';');
    return parts[0] || null;
  }
  return null;
}

function parsePhoneNumbers(tel) {
  if (tel) {
    if (Array.isArray(tel)) {
      return tel.map((num) => ({
        value: num.value,
        type: parsePhoneNumberType(num.params)
      }));
    } else if (tel.value) {
      return {
        value: tel.value,
        type: parsePhoneNumberType(tel.params)
      };
    }
  }
  return null;
}

function parsePhoneNumberType(params) {
  if (Array.isArray(params) && params.length > 0) {
    return params[0].TYPE;
  } else {
    return 'unknown';
  }
}
