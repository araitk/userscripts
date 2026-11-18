import { join } from 'node:path';
import { build, type Rolldown } from 'vite';
import monkey from 'vite-plugin-monkey';
import { site } from '../site.config.ts';
import { distDir, listEntries, loadScriptMeta, root, scriptFile } from './lib.ts';

type Watcher = { close(): Promise<void> | void };

/** Builds scripts/<name>/ with vite into dist/scripts/<name>.user.js. */
export async function buildScript(
  name: string,
  { watch = false } = {},
): Promise<Watcher | undefined> {
  const meta = await loadScriptMeta(name);
  const url = `${site.baseUrl}/${scriptFile(name)}`;
  const result = await build({
    configFile: false,
    root,
    logLevel: 'warn',
    build: {
      outDir: join(distDir, 'scripts'),
      emptyOutDir: false,
      minify: false,
      watch: watch ? {} : null,
    },
    plugins: [
      monkey({
        entry: `scripts/${name}/index.ts`,
        userscript: {
          namespace: site.repoUrl,
          author: site.author,
          homepageURL: `${site.repoUrl}/tree/main/scripts/${name}`,
          ...meta,
          updateURL: url,
          downloadURL: url,
        },
        build: { fileName: `${name}.user.js`, metaFileName: false },
      }),
    ],
  });
  console.log(`  script  ${name}.user.js  v${meta.version}${watch ? '  (watching)' : ''}`);
  return watch ? (result as Rolldown.RolldownWatcher) : undefined;
}

export async function buildScripts() {
  const names = listEntries('scripts');
  for (const name of names) await buildScript(name);
  return names;
}
