<?php

/**
 * Reads the block catalogue from the `_blocks/` directory.
 *
 * This is the single source both Kirby entry points build on:
 * - `site/plugins/baukasten/` registers blueprints and the page-builder groups
 * - `site/config/blocks-resolver.php` collects the field resolvers
 *
 * Returns a callable so the scan happens on demand, keyed by block name:
 *
 *     [
 *       'hero' => [
 *         'name'      => 'hero',
 *         'dir'       => '/abs/path/_blocks/hero',
 *         'meta'      => ['category' => 'sections', 'order' => 10, 'demo' => [...]],
 *         'blueprint' => ['name' => [...], 'icon' => 'home', 'fields' => [...]],
 *         'builtin'   => false,
 *       ],
 *     ]
 */

use Kirby\Data\Yaml;

return function (): array {
    $root = dirname(__DIR__);
    $blocks = [];

    foreach (glob($root . '/*', GLOB_ONLYDIR) as $dir) {
        $name = basename($dir);

        // `_shared` and friends are support folders, not blocks
        if (str_starts_with($name, '_')) {
            continue;
        }

        $file = $dir . '/block.yml';

        if (is_file($file) === false) {
            continue;
        }

        $data = Yaml::read($file);
        $meta = $data['baukasten'] ?? [];

        // Everything except the `baukasten` key is a plain Kirby blueprint
        unset($data['baukasten']);

        $blocks[$name] = [
            'name'      => $name,
            'dir'       => $dir,
            'meta'      => $meta,
            'blueprint' => $data,
            // Builtin blocks reuse Kirby's own blueprint (text, heading, image, …)
            'builtin'   => $meta['builtin'] ?? false,
        ];
    }

    ksort($blocks);

    return $blocks;
};
