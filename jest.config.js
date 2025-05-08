// jest.config.js
module.exports = {
    // Покрытие кода
    collectCoverage: true,
    collectCoverageFrom: ['src/**/*.js'],
    coverageDirectory: 'coverage',
    coverageReporters: ['text-summary', 'html', 'lcov'],

};
