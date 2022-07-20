import { DAVClient } from 'tsdav';
import parser from 'vdata-parser';

const FASTMAIL_URI = 'https://carddav.fastmail.com/dav/addressbooks/user/frank@hellwig.org>/Default';
const USERNAME = 'frank+Default@hellwig.org';
const PASSWORD = '8y3hv5b9c6jfkt9m';

const client = new DAVClient({
  serverUrl: FASTMAIL_URI,
  credentials: {
    username: USERNAME,
    password: PASSWORD
  },
  authMethod: 'Basic',
  defaultAccountType: 'carddav'
});

(async () => {
  await client.login();

  const addressBooks = await client.fetchAddressBooks();
  const vcards = await client.fetchVCards({
    addressBook: addressBooks[0]
  });
  const people = vcards.map((vcard) => parseVCard(parser.fromString(vcard.data).VCARD));
  console.log(people);
  /*
  vcards.forEach((vcard) => {
    const obj = parser.fromString(vcard.data);
    console.log(parseName(obj.VCARD.N));
    console.log(parseOrg(obj.VCARD.ORG));
    console.log(parsePhoneNumbers(obj.VCARD.TEL));
    console.log('--------------------------');
  });
  */
})();

function parseVCard(vcard) {
  return {
    name: parseName(vcard.N),
    org: parseOrg(vcard.ORG),
    phoneNumbers: parsePhoneNumbers(vcard.TEL)
  };
}

function parseName(n) {
  if (typeof n !== 'string') {
    return null;
  }
  const parts = n.split(';');
  return {
    givenName: parts[1],
    familyName: parts[0]
  };
}

function parseOrg(org) {
  if (!org) {
    return '';
  }
  const parts = org.split(';');
  return parts[0] || '';
}

function parsePhoneNumbers(tel) {
  if (!tel) {
    return null;
  } else if (Array.isArray(tel)) {
    return tel.map((number) => parsePhoneNumber(number));
  } else if (tel.value) {
    return [parsePhoneNumber(tel)];
  } else {
    return null;
  }
}

function parsePhoneNumber(number) {
  return {
    value: number.value,
    type: parsePhoneNumberType(number.params)
  };
}

function parsePhoneNumberType(params) {
  if (Array.isArray(params) && params.length > 0) {
    return params[0].TYPE;
  } else {
    return 'unknown';
  }
}
