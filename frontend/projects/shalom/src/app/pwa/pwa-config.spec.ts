import { existsSync, readFileSync } from 'node:fs';
import * as path from 'node:path';

/**
 * Shape assertions for the PWA configuration (M7): the web app manifest
 * and the Angular service-worker config are plain JSON the TypeScript
 * compiler never checks — a stray comma or a renamed icon silently breaks
 * installability, so the suite pins the contract here.
 */

function workspaceRoot(): string {
  let dir = process.cwd();
  for (let i = 0; i < 6; i++) {
    if (existsSync(path.join(dir, 'angular.json'))) return dir;
    dir = path.dirname(dir);
  }
  throw new Error(`angular.json not found walking up from ${process.cwd()}`);
}

const root = workspaceRoot();
const publicDir = path.join(root, 'projects', 'shalom', 'public');

function readJson<T>(file: string): T {
  return JSON.parse(readFileSync(file, 'utf8')) as T;
}

interface ManifestIcon {
  src: string;
  sizes: string;
  type: string;
  purpose: string;
}

interface Manifest {
  name: string;
  short_name: string;
  description: string;
  display: string;
  orientation: string;
  scope: string;
  start_url: string;
  theme_color: string;
  background_color: string;
  icons: ManifestIcon[];
}

interface NgswConfig {
  index: string;
  assetGroups: { name: string; resources: { files?: string[] } }[];
  dataGroups: {
    name: string;
    urls: string[];
    cacheConfig: { strategy: string; timeout: string; maxAge: string; maxSize: number };
  }[];
}

describe('manifest.webmanifest', () => {
  const manifest = readJson<Manifest>(path.join(publicDir, 'manifest.webmanifest'));

  it('carries the Shalom identity', () => {
    expect(manifest.name).toBe('Shalom');
    expect(manifest.short_name).toBe('Shalom');
    expect(manifest.description).toBe('Wholeness, one morning at a time.');
    expect(manifest.display).toBe('standalone');
    expect(manifest.orientation).toBe('portrait');
    expect(manifest.scope).toBe('/');
    expect(manifest.start_url).toBe('/today');
    expect(manifest.theme_color).toBe('#2D5F5D');
    expect(manifest.background_color).toBe('#FAF7F1');
  });

  it('ships 192/512 "any" icons plus the 512 maskable variant', () => {
    const byPurpose = (purpose: string) =>
      manifest.icons.filter((i) => i.purpose === purpose).map((i) => i.sizes);
    expect(byPurpose('any').sort()).toEqual(['192x192', '512x512']);
    expect(byPurpose('maskable')).toEqual(['512x512']);
    expect(manifest.icons.every((i) => i.type === 'image/png')).toBe(true);
  });

  it('every referenced icon file exists (plus the apple-touch icon and favicon)', () => {
    for (const icon of manifest.icons) {
      expect(existsSync(path.join(publicDir, icon.src)), icon.src).toBe(true);
    }
    expect(existsSync(path.join(publicDir, 'apple-touch-icon.png'))).toBe(true);
    expect(existsSync(path.join(publicDir, 'favicon.png'))).toBe(true);
  });
});

describe('ngsw-config.json', () => {
  const ngsw = readJson<NgswConfig>(path.join(root, 'projects', 'shalom', 'ngsw-config.json'));

  it('keeps the default app-shell asset groups', () => {
    expect(ngsw.index).toBe('/index.html');
    expect(ngsw.assetGroups.map((g) => g.name)).toEqual(['app', 'assets']);
    expect(ngsw.assetGroups[0].resources.files).toContain('/index.html');
    expect(ngsw.assetGroups[0].resources.files).toContain('/manifest.webmanifest');
  });

  it('caches the Today aggregate with a 3s-freshness / 12h fallback', () => {
    const today = ngsw.dataGroups.find((g) => g.name === 'today')!;
    expect(today).toBeDefined();
    expect(today.cacheConfig).toEqual({
      strategy: 'freshness',
      timeout: '3s',
      maxAge: '12h',
      maxSize: 10,
    });
    // The API is cross-origin in production (SWA → azurewebsites.net):
    // ngsw only matches patterns it is given, so the absolute production
    // URL must be listed alongside the same-origin path.
    expect(today.urls).toContain('/api/today');
    expect(today.urls).toContain('https://shalom-api-aouvy.azurewebsites.net/api/today');
    expect(today.urls).toContain('http://localhost:5100/api/today');
  });

  it('caches /api/auth/me so an offline relaunch can rehydrate the session', () => {
    const auth = ngsw.dataGroups.find((g) => g.name === 'auth')!;
    expect(auth).toBeDefined();
    expect(auth.cacheConfig.strategy).toBe('freshness');
    expect(auth.urls).toContain('https://shalom-api-aouvy.azurewebsites.net/api/auth/me');
  });
});
