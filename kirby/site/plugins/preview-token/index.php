<?php

use Kirby\Cms\App;
use Kirby\Content\VersionId;
use Kirby\Exception\PermissionException;
use Kirby\Http\Uri;

/**
 * Headless live preview for a decoupled (Nuxt) frontend.
 *
 * Kirby's Panel preview button appends `_token` and `_version` query params
 * to the preview URL (computed from the page's `frontendUrl()`, see
 * PageBlueprint::preview() + Content\Version::url()). The frontend forwards
 * these values back on its KQL request as headers:
 *
 *   X-Preview-Token:   value of the `_token` query param
 *   X-Preview-Version: value of the `_version` query param
 *                      ("changes" for unpublished edits, "latest" for drafts)
 *   X-Preview-Page:    id/uri of the page being previewed
 *
 * The frontend must also send `X-Cacheable: false` (supported by the
 * kirby-headless KQL route) so draft content never ends up in the shared
 * response cache.
 *
 * When the token is valid, Kirby's global `VersionId::$render` switch is set,
 * so every `content()` call in this request resolves against the requested
 * version. When preview headers are present but the token is invalid, the
 * request is rejected — this also protects drafts fetched via
 * `site.findPageOrDraft(...)` in preview-mode KQL queries.
 */
App::plugin('template/preview-token', [
    'hooks' => [
        'route:before' => function () {
            $kirby = App::instance();
            $request = $kirby->request();

            $token      = $request->header('X-Preview-Token');
            $versionRaw = $request->header('X-Preview-Version');
            $pageUri    = $request->header('X-Preview-Page');

            if (empty($token) || empty($versionRaw) || empty($pageUri)) {
                return;
            }

            $reject = function (string $reason): never {
                throw new PermissionException('Invalid preview request: ' . $reason);
            };

            try {
                $versionId = VersionId::from($versionRaw);
            } catch (Throwable) {
                $reject('unknown version');
            }

            // The Panel generates the token in the language being previewed;
            // switch to it before computing the page's frontend URL
            $languageCode = $request->header('X-Language');
            if ($kirby->multilang() && !empty($languageCode)) {
                $kirby->setCurrentLanguage($languageCode);
            }

            $page = $kirby->site()->findPageOrDraft($pageUri);

            if ($page === null) {
                $reject('page not found');
            }

            $frontendUrl = $page->frontendUrl();

            if (empty($frontendUrl)) {
                $reject('no frontend URL configured');
            }

            $uri = new Uri($frontendUrl);
            $uri->setFragment(null);
            $uri->setParams(null);
            $uri->setQuery(null);

            $expected = substr(
                $kirby->contentToken(null, json_encode([
                    'url' => $uri->toString(),
                    'versionId' => $versionId->value()
                ], JSON_UNESCAPED_SLASHES)),
                0,
                10
            );

            if (hash_equals($expected, (string)$token) === false) {
                $reject('token mismatch');
            }

            // Global switch Kirby itself uses for live-preview rendering:
            // every content() call for the rest of this request now
            // resolves against the verified version
            VersionId::$render = $versionId;
        }
    ]
]);
