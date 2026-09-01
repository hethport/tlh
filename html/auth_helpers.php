<?php

require_once __DIR__ . '/jwt_helpers.php';
require_once __DIR__ . '/MySafeGraphQLException.php';
require_once __DIR__ . '/model/User.php';

use model\User;
use function jwt_helpers\extractJsonWebToken;

function getAuthorization(): ?string
{
  $auth = null;

  if (isset($_SERVER['Authorization'])) {
    $auth = trim($_SERVER["Authorization"]);
  } elseif (isset($_SERVER['HTTP_AUTHORIZATION'])) {
    $auth = trim($_SERVER["HTTP_AUTHORIZATION"]);
  } elseif (function_exists('apache_request_headers')) {
    $requestHeaders = apache_request_headers();
    $requestHeaders = array_combine(
      array_map('ucwords', array_keys($requestHeaders)),
      array_values($requestHeaders)
    );

    if (isset($requestHeaders['Authorization'])) {
      $auth = trim($requestHeaders['Authorization']);
    }
  }

  return $auth;
}

/** @throws MySafeGraphQLException */
function resolveUser(): ?User
{
  $jwt = getAuthorization();

  if (is_null($jwt)) {
    return null;
  }

  $username = extractJsonWebToken($jwt);

  return User::selectUserFromDatabase($username);
}
