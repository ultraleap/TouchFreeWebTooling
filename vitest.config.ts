import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        include: ['src/**/*.{test,spec}.?(c|m)[jt]s?(x)'],
        globals: true,
        environment: 'jsdom',
        reporters: ['default', 'junit'],
        outputFile: {
            junit: 'junit.xml',
        },
        coverage: {
            include: ['src/**'],
            reporter: ['cobertura', 'text', 'text-summary', 'html'],
            reportOnFailure: true,
        },
    },
});
