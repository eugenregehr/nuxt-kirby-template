<?php

// This site is headless: content is served via the KQL API (/api/kql).
// Anyone hitting a page's backend URL directly is sent to the Panel.
go(\Kirby\Panel\Panel::url('site'));
