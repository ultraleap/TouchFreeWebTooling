module.exports = {
    preset: 'ts-jest',
    testPathIgnorePatterns: ['/node_modules/', 'build/'],
    testEnvironment: 'jsdom',
    collectCoverageFrom: ['./src/**/*.ts'],
    setupFilesAfterEnv: ['jest-extended-snapshot'],
    coverageReporters: ['cobertura', 'text', 'text-summary', 'html'],
    coveragePathIgnorePatterns: ['node_modules'],
};
