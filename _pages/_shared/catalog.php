<?php

/**
 * Reads the page-type catalogue from the `_pages/` directory.
 *
 * Mirrors `_blocks/_shared/catalog.php`: `site/plugins/baukasten/` builds on it
 * to register one `pages/<name>` blueprint per package.
 *
 * Returns a callable so the scan happens on demand, keyed by page type:
 *
 *     [
 *       'team' => [
 *         'name'      => 'team',
 *         'dir'       => '/abs/path/_pages/team',
 *         'blueprint' => ['title' => 'Team', 'icon' => 'users', 'tabs' => [...]],
 *       ],
 *     ]
 */

use Kirby\Data\Yaml;

return function (): array {
    $root = dirname(__DIR__);
    $types = [];

    foreach (glob($root . '/*', GLOB_ONLYDIR) as $dir) {
        $name = basename($dir);

        // `_shared` and friends are support folders, not page types
        if (str_starts_with($name, '_')) {
            continue;
        }

        $file = $dir . '/page.yml';

        if (is_file($file) === false) {
            continue;
        }

        $data = Yaml::read($file);

        // Reserved for future package metadata; everything else is a plain
        // Kirby page blueprint (tabs, sections, fields, options)
        unset($data['baukasten']);

        $types[$name] = [
            'name'      => $name,
            'dir'       => $dir,
            'blueprint' => $data,
        ];
    }

    ksort($types);

    return $types;
};
