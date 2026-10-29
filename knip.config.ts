import type { KnipConfig } from 'knip'

const config: KnipConfig = {
  ignore: ['**/scripts/**'],
  // Loaded through tsconfig "types", which knip does not follow.
  ignoreDependencies: ['@types/chrome'],
  entry: [
    'src/content/index.ts',
    'src/settings/settings.ts',
  ],
}

export default config
