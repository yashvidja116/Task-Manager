module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.js'],
  collectCoverageFrom: ['controllers/**/*.js', 'middleware/**/*.js', 'models/**/*.js'],
  coverageDirectory: 'coverage',
  testTimeout: 30000,
};
