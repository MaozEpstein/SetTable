// Jest config dedicated to Firestore Security Rules tests.
// Kept separate from any future RN app tests so we can pick a node env
// without conflicting with React Native presets.

module.exports = {
  testEnvironment: 'node',
  preset: 'ts-jest',
  testMatch: ['**/firestore.rules.test.ts'],
  testTimeout: 30000,
};
