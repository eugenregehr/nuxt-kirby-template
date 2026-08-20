<?php

/**
 * Locates the directory holding the `_blocks/` and `_pages/` packages and
 * returns its absolute path.
 *
 * Local checkout:  <repo>    — the packages sit next to `kirby/` and `nuxt/`
 * Server:          <kirby>   — `scripts/deploy-site.sh` rsyncs them into the
 *                              Kirby root
 *
 * Required by both `site/plugins/baukasten/index.php` and
 * `site/config/blocks-resolver.php`.
 */

$candidates = [
    dirname(__DIR__, 4), // repo root, next to kirby/
    dirname(__DIR__, 3), // kirby root, deployed
];

foreach ($candidates as $path) {
    if (is_dir($path . '/_blocks')) {
        return $path;
    }
}

throw new RuntimeException(
    'Baukasten: _blocks/ directory not found. Looked in: '
    . implode(', ', array_map(fn ($path) => $path . '/_blocks', $candidates))
);
