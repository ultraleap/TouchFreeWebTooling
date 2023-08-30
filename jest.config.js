module.exports = {
    preset: 'ts-jest',
    moduleDirectories: ['node_modules', 'src'],
    testPathIgnorePatterns: ['/node_modules/', 'build'],
    testEnvironment: 'jsdom',
    collectCoverageFrom: ['./src/**/*.ts'],
    setupFilesAfterEnv: ['jest-extended-snapshot'],
    coverageReporters: ['cobertura', 'text', 'text-summary', 'html'],
    coveragePathIgnorePatterns: ['node_modules'],
};
