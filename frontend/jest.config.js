module.exports = {
  transformIgnorePatterns: [
    'node_modules/(?!(axios|react-icons)/)'
  ],
  transform: {
    '^.+\\.(js|jsx)$': 'babel-jest'
  },
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy'
  },
  testEnvironment: 'jsdom'
};