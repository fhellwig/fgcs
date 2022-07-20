export function convertToGoogleContacts(people) {
  return people.filter((person) => isValid(person)).map((person) => createGooglePerson(person));
}

function isValid(person) {
  return (person.name || person.org) && person.phoneNumbers;
}

function createGooglePerson(person) {
  return {
    names: person.name ? [person.name] : [],
    organizations: person.org ? [{ name: person.org }] : [],
    phoneNumbers: person.phoneNumbers || []
  };
}
