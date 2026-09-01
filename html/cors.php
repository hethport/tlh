<?php
/**
 * In production the frontend is served from the same origin as this API (see urls.ts /
 * documentation/de/deployment.md), so this allowlist only needs to cover local development,
 * where the React dev server (localhost:3000) talks to the PHP dev server (localhost:8066).
 */
const allowedCorsOrigins = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
];

function cors(): void
{

  // Only allow the configured, known frontend origins - reflecting any origin back together
  // with Access-Control-Allow-Credentials would let any website make authenticated requests
  // on behalf of a logged-in user.
  if (isset($_SERVER['HTTP_ORIGIN']) && in_array($_SERVER['HTTP_ORIGIN'], allowedCorsOrigins, true)) {
    header("Access-Control-Allow-Origin: {$_SERVER['HTTP_ORIGIN']}");
    header('Access-Control-Allow-Credentials: true');
    header('Access-Control-Max-Age: 86400');    // cache for 1 day
  }

  // Access-Control headers are received during OPTIONS requests
  if (isset($_SERVER['REQUEST_METHOD']) && $_SERVER['REQUEST_METHOD'] == 'OPTIONS') {

    if (isset($_SERVER['HTTP_ACCESS_CONTROL_REQUEST_METHOD'])) {
      // may also be using PUT, PATCH, HEAD etc
      header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
    }

    if (isset($_SERVER['HTTP_ACCESS_CONTROL_REQUEST_HEADERS'])) {
      header("Access-Control-Allow-Headers: {$_SERVER['HTTP_ACCESS_CONTROL_REQUEST_HEADERS']}");
    }

    exit(0);
  }
}