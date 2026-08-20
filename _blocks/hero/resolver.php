<?php

use Kirby\Cms\Block;
use Kirby\Content\Field;

return fn (array $r) => [
    'link' => $r['link'],

    // Content saved before the field existed has no level — a hero is the
    // top of its page by default, so fall back to `h1`.
    'level' => fn (Field $field, Block $block) => $field->value() ?: 'h1',
];
