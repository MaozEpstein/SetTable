// Firestore security rules tests.
//
// Run with: npm run test:rules
// Requires the Firebase emulator (auto-installed via firebase-tools).
//
// These tests run against an in-memory emulator — they do NOT touch
// production data. Each test creates a clean state.

import {
  initializeTestEnvironment,
  type RulesTestEnvironment,
  assertFails,
  assertSucceeds,
} from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const PROJECT_ID = 'settable-rules-test';
let env: RulesTestEnvironment;

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: {
      rules: readFileSync(resolve(__dirname, 'firestore.rules'), 'utf8'),
      host: 'localhost',
      port: 8080,
    },
  });
});

afterAll(async () => {
  await env.cleanup();
});

beforeEach(async () => {
  await env.clearFirestore();
});

describe('groups', () => {
  test('member can read their own group', async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'groups', 'g1'), {
        memberUids: ['alice'],
        createdBy: 'alice',
      });
    });
    const aliceDb = env.authenticatedContext('alice').firestore();
    await assertSucceeds(getDoc(doc(aliceDb, 'groups', 'g1')));
  });

  test('non-member cannot read group', async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'groups', 'g1'), {
        memberUids: ['alice'],
        createdBy: 'alice',
      });
    });
    const eveDb = env.authenticatedContext('eve').firestore();
    await assertFails(getDoc(doc(eveDb, 'groups', 'g1')));
  });

  test('anonymous cannot read groups', async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'groups', 'g1'), {
        memberUids: ['alice'],
        createdBy: 'alice',
      });
    });
    const anon = env.unauthenticatedContext().firestore();
    await assertFails(getDoc(doc(anon, 'groups', 'g1')));
  });

  test('user can join group by adding self to memberUids', async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'groups', 'g1'), {
        memberUids: ['alice'],
        createdBy: 'alice',
        code: 'ABCD',
      });
    });
    const bobDb = env.authenticatedContext('bob').firestore();
    await assertSucceeds(
      updateDoc(doc(bobDb, 'groups', 'g1'), {
        memberUids: ['alice', 'bob'],
      }),
    );
  });
});

describe('group subcollections (foods, assignments)', () => {
  test('member can read foods', async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'groups', 'g1'), {
        memberUids: ['alice'],
        createdBy: 'alice',
      });
      await setDoc(doc(ctx.firestore(), 'groups/g1/foods/f1'), {
        name: 'חמין',
      });
    });
    const aliceDb = env.authenticatedContext('alice').firestore();
    await assertSucceeds(getDoc(doc(aliceDb, 'groups/g1/foods/f1')));
  });

  test('non-member cannot read foods', async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'groups', 'g1'), {
        memberUids: ['alice'],
        createdBy: 'alice',
      });
      await setDoc(doc(ctx.firestore(), 'groups/g1/foods/f1'), {
        name: 'חמין',
      });
    });
    const eveDb = env.authenticatedContext('eve').firestore();
    await assertFails(getDoc(doc(eveDb, 'groups/g1/foods/f1')));
  });
});

describe('usernames', () => {
  test('anyone can read username mappings (needed for sign-in lookup)', async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'usernames', 'maoz'), {
        uid: 'alice',
        email: 'alice@example.com',
      });
    });
    const anon = env.unauthenticatedContext().firestore();
    await assertSucceeds(getDoc(doc(anon, 'usernames', 'maoz')));
  });

  test('user cannot claim a username pointing to another uid', async () => {
    const aliceDb = env.authenticatedContext('alice').firestore();
    await assertFails(
      setDoc(doc(aliceDb, 'usernames', 'bobby'), {
        uid: 'bob',
        email: 'bob@example.com',
      }),
    );
  });
});

describe('userProfiles', () => {
  test('user can write own profile', async () => {
    const aliceDb = env.authenticatedContext('alice').firestore();
    await assertSucceeds(
      setDoc(doc(aliceDb, 'userProfiles', 'alice'), { displayName: 'Alice' }),
    );
  });

  test('user cannot write another user profile', async () => {
    const aliceDb = env.authenticatedContext('alice').firestore();
    await assertFails(
      setDoc(doc(aliceDb, 'userProfiles', 'bob'), { displayName: 'Hacked' }),
    );
  });

  test('cannot set displayName longer than 30 chars', async () => {
    const aliceDb = env.authenticatedContext('alice').firestore();
    await assertFails(
      setDoc(doc(aliceDb, 'userProfiles', 'alice'), {
        displayName: 'A'.repeat(31),
      }),
    );
  });
});

describe('foods validation', () => {
  beforeEach(async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'groups', 'g1'), {
        memberUids: ['alice'],
        createdBy: 'alice',
      });
    });
  });

  test('member can create well-formed food', async () => {
    const aliceDb = env.authenticatedContext('alice').firestore();
    await assertSucceeds(
      setDoc(doc(aliceDb, 'groups/g1/foods/f1'), {
        name: 'חמין',
        categories: ['meat'],
        createdBy: 'alice',
        createdAt: Date.now(),
      }),
    );
  });

  test('cannot create food with name longer than 100 chars', async () => {
    const aliceDb = env.authenticatedContext('alice').firestore();
    await assertFails(
      setDoc(doc(aliceDb, 'groups/g1/foods/f1'), {
        name: 'X'.repeat(101),
        categories: ['meat'],
        createdBy: 'alice',
        createdAt: Date.now(),
      }),
    );
  });

  test('cannot create food spoofing another user as createdBy', async () => {
    const aliceDb = env.authenticatedContext('alice').firestore();
    await assertFails(
      setDoc(doc(aliceDb, 'groups/g1/foods/f1'), {
        name: 'חמין',
        categories: ['meat'],
        createdBy: 'eve', // ← not alice
        createdAt: Date.now(),
      }),
    );
  });

  test('cannot create food with future timestamp far ahead', async () => {
    const aliceDb = env.authenticatedContext('alice').firestore();
    const yearFromNow = Date.now() + 365 * 86400 * 1000;
    await assertFails(
      setDoc(doc(aliceDb, 'groups/g1/foods/f1'), {
        name: 'חמין',
        categories: ['meat'],
        createdBy: 'alice',
        createdAt: yearFromNow,
      }),
    );
  });

  test('cannot create food with recipe larger than 5000 chars', async () => {
    const aliceDb = env.authenticatedContext('alice').firestore();
    await assertFails(
      setDoc(doc(aliceDb, 'groups/g1/foods/f1'), {
        name: 'חמין',
        categories: ['meat'],
        createdBy: 'alice',
        createdAt: Date.now(),
        recipe: 'X'.repeat(5001),
      }),
    );
  });

  test('cannot create food with too many categories', async () => {
    const aliceDb = env.authenticatedContext('alice').firestore();
    await assertFails(
      setDoc(doc(aliceDb, 'groups/g1/foods/f1'), {
        name: 'חמין',
        categories: Array.from({ length: 11 }, (_, i) => `cat${i}`),
        createdBy: 'alice',
        createdAt: Date.now(),
      }),
    );
  });
});

describe('username validation', () => {
  test('username with invalid characters is rejected', async () => {
    const aliceDb = env.authenticatedContext('alice').firestore();
    await assertFails(
      setDoc(doc(aliceDb, 'usernames', 'has spaces'), {
        uid: 'alice',
      }),
    );
  });

  test('username too short is rejected', async () => {
    const aliceDb = env.authenticatedContext('alice').firestore();
    await assertFails(
      setDoc(doc(aliceDb, 'usernames', 'ab'), {
        uid: 'alice',
      }),
    );
  });

  test('username too long is rejected', async () => {
    const aliceDb = env.authenticatedContext('alice').firestore();
    await assertFails(
      setDoc(doc(aliceDb, 'usernames', 'a'.repeat(21)), {
        uid: 'alice',
      }),
    );
  });

  test('valid username is accepted', async () => {
    const aliceDb = env.authenticatedContext('alice').firestore();
    await assertSucceeds(
      setDoc(doc(aliceDb, 'usernames', 'alice_99'), {
        uid: 'alice',
      }),
    );
  });
});
