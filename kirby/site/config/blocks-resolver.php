<?php

use Kirby\Cms\File;

/**
 * Collects the block field resolvers from the block packages in `_blocks/`.
 *
 * Every block may ship a `resolver.php` returning a closure that receives the
 * shared resolvers (`_blocks/_shared/resolvers.php`) and maps field names to
 * transforms:
 *
 *     // _blocks/hero/resolver.php
 *     return fn (array $r) => ['link' => $r['link']];
 *
 * The keys are prefixed with the block name here, so the example above becomes
 * the `hero:link` resolver that `page.blocks.toResolvedBlocks` applies.
 * Blocks without a `resolver.php` need no entry at all — scalar fields pass
 * through unchanged and file fields fall back to `defaultResolvers` below.
 */

$blocksRoot = (require __DIR__ . '/../plugins/baukasten/package-root.php') . '/_blocks';

$catalog = (require $blocksRoot . '/_shared/catalog.php')();
$shared = require $blocksRoot . '/_shared/resolvers.php';

$resolvers = [];

foreach ($catalog as $name => $block) {
    $file = $block['dir'] . '/resolver.php';

    if (is_file($file) === false) {
        continue;
    }

    foreach ((require $file)($shared) as $field => $resolver) {
        $resolvers[$name . ':' . $field] = $resolver;
    }
}

return [
    'resolvers' => $resolvers,

    // Fallback shape for any file/image field inside a block that has no
    // custom resolver (kirby-headless applies this to `image:image` etc.)
    'defaultResolvers' => [
        'files' => fn (File $file) => [
            'url' => $file->url(),
            'width' => $file->width(),
            'height' => $file->height(),
            'srcset' => $file->srcset(),
            'alt' => $file->alt()->value(),
        ]
    ]
];
