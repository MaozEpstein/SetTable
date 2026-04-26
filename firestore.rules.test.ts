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
});
