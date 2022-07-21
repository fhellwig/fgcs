import 'dotenv/config';
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
  console.log(addressBooks);
  const vcards = await client.fetchVCards({
    addressBook: addressBooks[0]
  });
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

/**
 * Splits text into lines, each line separated by an optional carriage return
 * followed by a line feed. Blank lines are not included in the returned array.
 * Lines beginning with a space are unfolded and added to the previous line.
 * @param  text the text to split
 * @return an array of lines
 */
function splitTextIntoLines(text) {
  const sep = new RegExp('\r?\n');
  const split = text.split(sep);
  const lines = [];
  split.forEach((line) => {
    if (line.length > 0) {
      if (line.startsWith(' ') || line.startsWith('\t')) {
        lines[lines.length - 1] += line.substring(1);
      } else {
        lines.push(line);
      }
    }
  });
  return lines;
}

/**
 * Parses a line and returns an object having a name, optional type, and value.
 * @param line the line to parse
 * @return a {name, type, value} object
 */
function parseLine(line) {
  const parts = line.split(':', 2);
  const key = parts[0].split(';', 2);
  if (key[1] && key[1].startsWith('TYPE=')) {
    key[1] = key[1].substring(5);
  } else {
    key[1] = null;
  }
  return {
    name: key[0],
    type: key[1] || null,
    value: parts[1]
  };
}

/**
 * Parses a vCard into an object where the keys are the vCard properties and
 * the property is a {type, value} object. All returned object keys are lower
 * case. The X-ADDRESSBOOKSERVER-KIND property is converted to 'kind' and any
 * other names beginning with 'X-' are skipped.
 * @param text the vCard text
 * @return a parsed object
 */
function parseCard(text) {
  const lines = splitTextIntoLines(text);
  const vcard = {};
  lines.forEach((line) => {
    const obj = parseLine(line);
    if (obj.name === 'X-ADDRESSBOOKSERVER-KIND') {
      obj.name = 'KIND';
    }
    //if (!obj.name.startsWith('X-')) {
    vcard[obj.name.toLowerCase()] = { type: obj.type, value: obj.value };
    //}
  });
  return vcard;
}
