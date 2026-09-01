<?php

namespace jwt_helpers;

require_once __DIR__ . '/MySafeGraphQLException.php';

use Exception;
use model\User;
use MySafeGraphQLException;
use ReallySimpleJWT\Token;

const jwtValidityTime = 24 * 60 * 60; // 24 h

# Must be 12 characters in length, contain upper and lower case letters, a number, and a special character `*&!@%^#$``
# In production this MUST be overridden via the JWT_SECRET environment variable - anyone with
# read access to this source file could otherwise forge a valid login token for any user.
function jwtSecret(): string
{
  $secret = getenv('JWT_SECRET');
  return $secret !== false && $secret !== '' ? $secret : '1234%ASDf_0asd';
}

function createJsonWebToken(User $user): ?string
{
  try {
    return Token::builder()
      ->setSecret(jwtSecret())
      ->setSubject($user->username)
      ->setPayloadClaim('rights', $user->rights)
      ->setExpiration(time() + jwtValidityTime)
      ->setIssuer('tlh_dig')
      ->build()
      ->getToken();
  } catch (Exception $exception) {
    error_log("Error while creating JWT: " . $exception->getMessage());
    return null;
  }
}

/**
 * @throws MySafeGraphQLException
 */
function extractJsonWebToken(string $token): string
{
  if (!Token::validate($token, jwtSecret())) {
    throw new MySafeGraphQLException('Invalid login information. Maybe your login is expired? Try logging out and logging back in again.');
  }

  try {
    return Token::getPayload($token, jwtSecret())['sub'];
  } catch (Exception $exception) {
    error_log("Error while decoding jwt: " . $exception->getMessage());
    throw new MySafeGraphQLException('Invalid login information. Maybe your login is expired? Try logging out and logging back in again.');
  }
}