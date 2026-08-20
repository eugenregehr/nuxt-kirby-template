<?php

use Kirby\Cms\App;
use Kirby\Cms\Page;

return [
    'debug' => env('KIRBY_DEBUG', false),

    'content' => [
        'salt' => env('KIRBY_CONTENT_SALT')
    ],

    'cookie' => [
        'key' => env('KIRBY_COOKIE_KEY')
    ],

    'yaml' => [
        'handler' => 'symfony'
    ],

    'date' => [
        'handler' => 'intl'
    ],

    // Toggle multi-language support via .env (languages live in site/languages/)
    'languages' => env('KIRBY_MULTILANG', true),

    'panel' => [
        'install' => env('KIRBY_PANEL_INSTALL', false),
        'slug' => env('KIRBY_PANEL_SLUG', 'panel'),
        'vue' => [
            'compiler' => false
        ]
    ],

    'thumbs' => [
        'format' => 'webp',
        'quality' => 80,
        'presets' => [
            'default' => ['format' => 'webp', 'quality' => 80]
        ],
        'srcsets' => [
            'default' => [360, 720, 1024, 1280, 1536]
        ]
    ],

    'cache' => [
        'pages' => [
            'active' => env('KIRBY_CACHE', false),
            'ignore' => fn (Page $page) => $page->kirby()->user() !== null
        ]
    ],

    // KQL requests are authenticated with the bearer token from `headless.token`
    'kql' => [
        'auth' => 'bearer'
    ],

    // Maps block fields to plain JSON for the frontend, see blocks-resolver.php
    'blocksResolver' => require __DIR__ . '/blocks-resolver.php',

    // Rich-text permalinks (page://, file://) are resolved to path-only URLs,
    // so the frontend can use them directly as router links
    'permalinksResolver' => [
        'urlParser' => function (string $url, App $kirby) {
            return parse_url($url, PHP_URL_PATH);
        }
    ],

    'headless' => [
        'token' => env('KIRBY_HEADLESS_API_TOKEN'),
        'panel' => [
            // Base URL of the deployed Nuxt frontend; used for the Panel
            // preview button via the `frontendUrl` page/site method
            'frontendUrl' => env('KIRBY_HEADLESS_FRONTEND_URL')
        ],
        'sitemap' => [
            'isIndexable' => fn (Page $page) => $page->isListed() || $page->isHomePage(),
            'exclude' => [
                'templates' => [],
                'pages' => ['error']
            ]
        ]
    ]
];
