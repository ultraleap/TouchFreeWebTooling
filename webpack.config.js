import path from 'path';
import { fileURLToPath } from 'url';

// eslint-disable-next-line @typescript-eslint/naming-convention
const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default {
    entry: {
        TouchFree_Tooling: {
            import: './src/bundle.ts',
            library: {
                name: 'touchfree',
                type: 'umd',
            },
            filename: 'dist/TouchFree_Tooling.js',
        },
        Snapping_Plugin: {
            import: './Plugins/SnappingPlugin/src/SnappingPlugin.ts',
            dependOn: 'TouchFree_Tooling',
            library: {
                name: 'SnappingPlugin',
                type: 'umd',
            },
            filename: 'dist/Plugins/Snapping_Plugin.js',
        },
    },
    mode: 'production',
    module: {
        rules: [
            {
                use: 'ts-loader',
                exclude: /node_modules/,
            },
        ],
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.js'],
    },
    optimization: {
        minimize: false,
    },
    output: {
        path: __dirname,
    },
};
