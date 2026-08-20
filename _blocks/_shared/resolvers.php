<?php

/**
 * Reusable field resolvers, handed to every block's `resolver.php`.
 *
 * A block package receives this array as `$r` and picks what it needs:
 *
 *     return fn (array $r) => ['link' => $r['link']];
 *
 * The Baukasten plugin prefixes the returned keys with the block name, so
 * `['link' => ...]` in `_blocks/hero/` becomes the `hero:link` resolver.
 */

use Kirby\Cms\Block;
use Kirby\Content\Field;

return [
    // Select fields for heading levels always resolve to a plain string
    'headingLevel' => fn (Field $field, Block $block) => $field->value() ?: 'h2',

    // Rich text: turn page://, file:// permalinks into usable URLs
    'richText' => fn (Field $field, Block $block) => $field->permalinksToUrls()->value(),

    // Textarea with kirbytext formatting, permalinks resolved
    'kirbytext' => fn (Field $field, Block $block) => $field->kirbytext()->permalinksToUrls()->value(),

    // Link fields resolve to a URL string. Internal links are reduced to a
    // path so the frontend can pass them straight to <NuxtLink>.
    'link' => function (Field $field, Block $block) {
        if ($field->isEmpty()) {
            return null;
        }

        $url = $field->toUrl();

        if ($url === null) {
            return null;
        }

        $kirbyUrl = $field->parent()->kirby()->url();

        if ($kirbyUrl && str_starts_with($url, $kirbyUrl)) {
            return parse_url($url, PHP_URL_PATH) ?: '/';
        }

        return $url;
    },
];
