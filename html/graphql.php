<?php

require_once 'sql_queries.inc';
require_once 'cors.inc';

require_once 'vendor/autoload.php';

require_once 'graphql/MyGraphQLExceptions.inc';
require_once 'graphql/LoggedInUser.inc';

require_once 'model/ManuscriptMetaData.inc';
require_once 'model/ManuscriptLanguages.inc';
require_once 'model/User.inc';

use GraphQL\Error\{DebugFlag, FormattedError};
use GraphQL\GraphQL;
use GraphQL\Type\{Schema, SchemaConfig};
use GraphQL\Type\Definition\{ObjectType, Type};
use tlh_dig\graphql\{LoggedInUser, MySafeGraphQLException};
use tlh_dig\model\{ManuscriptLanguage, ManuscriptMetaData, Transliteration, User};
use function tlh_dig\graphql\{register, resolveUser, verifyUser};
use function tlh_dig\model\allManuscriptLanguages;

# Must be 12 characters in length, contain upper and lower case letters, a number, and a special character `*&!@%^#$``
$jwtSecret = '1234%ASDf_0aosd';

$jwtValidityTime = 24 * 60 * 60; // 24 h

$queryType = new ObjectType([
  'name' => 'Query',
  'fields' => [
    'manuscriptLanguages' => [
      'type' => Type::nonNull(Type::listOf(Type::nonNull(ManuscriptLanguage::$graphQLType))),
      'resolve' => fn() => allManuscriptLanguages()
    ],
    'manuscriptCount' => [
      'type' => Type::nonNull(Type::int()),
      'resolve' => fn() => allManuscriptsCount()
    ],
    'allManuscripts' => [
      'type' => Type::nonNull(Type::listOf(Type::nonNull(ManuscriptMetaData::$graphQLType))),
      'args' => [
        'paginationSize' => Type::nonNull(Type::int()),
        'page' => Type::nonNull(Type::int())
      ],
      'resolve' => fn($rootValue, array $args) => allManuscriptMetaData($args['paginationSize'], $args['page'])
    ],
    'manuscript' => [
      'type' => ManuscriptMetaData::$graphQLType,
      'args' => [
        'mainIdentifier' => Type::nonNull(Type::string())
      ],
      'resolve' => fn($rootValue, array $args) => manuscriptMetaDataById($args['mainIdentifier'])
    ]
  ]
]);

$manuscriptMutationsType = new ObjectType([
  'name' => 'ManuscriptMutations',
  'fields' => [
    'updateTransliteration' => [
      'type' => Type::nonNull(Type::boolean()),
      'args' => [
        'values' => Type::nonNull(Type::listOf(Type::nonNull(Transliteration::$graphQLInputObjectType)))
      ],
      'resolve' => function (ManuscriptMetaData $manuscriptMetaData, array $args): ?string {
        $mainIdentifier = $manuscriptMetaData->mainIdentifier->identifier;

        $mapped = array_map(fn($x) => Transliteration::readFromGraphQLInput($mainIdentifier, $x), $args['values']);

        $allSaved = true;

        $connection = connect_to_db();

        $connection->begin_transaction();

        try {
          foreach ($mapped as $transliterationLine) {
            $allSaved &= $transliterationLine->saveToDb($connection);
          }

          error_log("All saved: " . ($allSaved ? "true" : "false"));

          if ($allSaved) {
            $connection->commit();
          } else {
            $connection->rollback();
          }
        } catch (mysqli_sql_exception $e) {
          $connection->rollback();
        }

        $connection->close();

        return $allSaved;
      }
    ]
  ]
]);

$loggedInUserMutationsType = new ObjectType([
  'name' => 'LoggedInUserMutations',
  'fields' => [
    'createManuscript' => [
      'type' => Type::string(),
      'args' => [
        'values' => ManuscriptMetaData::$graphQLInputObjectType
      ],
      'resolve' => function (string $username, array $args): ?string {
        $manuscript = ManuscriptMetaData::fromGraphQLInput($args['values'], $username);

        $manuscriptIdentifier = $manuscript->mainIdentifier->identifier;

        $manuscriptInserted = insertManuscriptMetaData($manuscript);

        if ($manuscriptInserted) {
          return $manuscriptIdentifier;
        } else {
          throw new MySafeGraphQLException("Could not save manuscript $manuscriptIdentifier to Database!");
        }
      }
    ],
    'manuscript' => [
      'type' => $manuscriptMutationsType,
      'args' => [
        'mainIdentifier' => Type::nonNull(Type::string())
      ],
      'resolve' => fn(string $username, array $args) => manuscriptMetaDataById($args['mainIdentifier'])
    ]
  ]
]);

$mutationType = new ObjectType([
  "name" => "Mutation",
  'fields' => [
    'register' => [
      'args' => [
        'userInput' => Type::nonNull(User::$graphQLInputObjectType)
      ],
      'type' => Type::string(),
      'resolve' => fn($rootValue, array $args) => register($args)
    ],
    'login' => [
      'args' => [
        'username' => Type::nonNull(Type::string()),
        'password' => Type::nonNull(Type::string())
      ],
      'type' => LoggedInUser::$graphQLType,
      'resolve' => fn($rootValue, array $args) => verifyUser($args['username'], $args['password'])
    ],
    'me' => [
      'type' => $loggedInUserMutationsType,
      'resolve' => fn($rootValue, array $args) => resolveUser()
    ]
  ]
]);

cors();

try {
  $schema = new Schema(
    SchemaConfig::create()
      ->setQuery($queryType)
      ->setMutation($mutationType)
  );

  $rawInput = file_get_contents('php://input');
  $input = json_decode($rawInput, true);

  $authHeader = apache_request_headers()['Authorization'] ?? null;

  if ($input != null) {

    $variablesValues = $input['variables'] ?? null;
    $operationName = $input['operationName'] ?? null;

    $debug = DebugFlag::INCLUDE_DEBUG_MESSAGE | DebugFlag::INCLUDE_TRACE | DebugFlag::RETHROW_INTERNAL_EXCEPTIONS | DebugFlag::RETHROW_UNSAFE_EXCEPTIONS;

    $query = $input['query'];

    $output = GraphQL::executeQuery($schema, $query, null, $authHeader, $variablesValues, $operationName)->toArray($debug);
  } else {
    $output = [
      'data' => null,
      'errors' => [FormattedError::createFromException(new Exception('No input given!'))]
    ];
  }
} catch (Throwable $e) {
  error_log($e);

  $output = [
    'data' => null,
    'errors' => [FormattedError::createFromException($e)]
  ];
}


header('Content-Type: application/json; charset=UTF-8', true, 200);

echo json_encode($output);
