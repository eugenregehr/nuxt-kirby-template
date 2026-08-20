<?php

use Kirby\Cms\Block;
use Kirby\Content\Field;

return fn (array $r) => [
    'level' => $r['headingLevel'],

    'items' => fn (Field $field, Block $block) => $field->toStructure()->map(fn ($item) => [
        'question' => $item->question()->value(),
        'answer' => $item->answer()->kirbytext()->permalinksToUrls()->value(),
    ])->values(),
];
