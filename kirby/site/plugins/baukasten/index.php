<?php

/**
 * Baukasten — registers the block and page packages with Kirby.
 *
 * For each folder in `_blocks/` this plugin
 * 1. registers `blocks/<name>` as a block blueprint (unless the block is
 *    `builtin`, i.e. one of Kirby's own block types), and
 * 2. assembles the `fields/blocks` page-builder field, grouping the blocks
 *    by their `baukasten.category` and sorting them by `baukasten.order`.
 *
 * For each folder in `_pages/` it registers `pages/<name>` as a page
 * blueprint — the Panel form (tabs, sections, fields) of a page type that
 * brings its own frontend rendering.
 *
 * Adding either means adding a folder — there is no list to update here.
 */

use Kirby\Cms\App as Kirby;
use Kirby\Data\Yaml;

$root = require __DIR__ . '/package-root.php';
$blocksRoot = $root . '/_blocks';
$pagesRoot = $root . '/_pages';

$catalog = (require $blocksRoot . '/_shared/catalog.php')();
$categories = Yaml::read($blocksRoot . '/_shared/categories.yml');

$blueprints = [];

// 1. One blueprint per non-builtin block
foreach ($catalog as $name => $block) {
    if ($block['builtin'] === false) {
        $blueprints['blocks/' . $name] = $block['blueprint'];
    }
}

// 2. Group the catalogue into the page-builder fieldsets
$grouped = [];

foreach ($catalog as $name => $block) {
    $category = $block['meta']['category'] ?? 'sections';
    $grouped[$category][$name] = $block['meta']['order'] ?? 100;
}

$fieldsets = [];

// Categories appear in the order defined in categories.yml
uasort($categories, fn ($a, $b) => ($a['order'] ?? 100) <=> ($b['order'] ?? 100));

foreach ($categories as $key => $category) {
    if (isset($grouped[$key]) === false) {
        continue;
    }

    // Blocks inside a group are sorted by their own `order`
    asort($grouped[$key]);

    $fieldsets[$key] = [
        'label'     => $category['label'] ?? $key,
        'type'      => 'group',
        'fieldsets' => array_keys($grouped[$key]),
    ];
}

$blueprints['fields/blocks'] = [
    'label'     => ['en' => 'Blocks', 'de' => 'Blöcke'],
    'type'      => 'blocks',
    'fieldsets' => $fieldsets,
];

// 3. One blueprint per page-type package. Page types without their own
// rendering (default, home, error) stay in site/blueprints/pages/.
if (is_dir($pagesRoot)) {
    foreach ((require $pagesRoot . '/_shared/catalog.php')() as $name => $type) {
        $blueprints['pages/' . $name] = $type['blueprint'];
    }
}

Kirby::plugin('baukasten/blocks', [
    'blueprints' => $blueprints,
]);
