<?php

namespace model;

require_once __DIR__ . '/ManuscriptSide.php';
require_once __DIR__ . '/TransliterationColumnInput.php';
require_once __DIR__ . '/../sql_queries.php';

use Exception;
use GraphQL\Type\Definition\{InputObjectType, Type};
use mysqli;
use mysqli_stmt;

const sideIndexName = 'sideIndex';
const sideName = 'side';
const columnsName = 'columns';

class TransliterationSideInput
{
  const insertQuery = "insert into tlh_dig_transliteration_sides (main_identifier, side_index, side, version) values (?, ?, ?, ?);";

  static InputObjectType $graphQLInputObjectType;

  public int $sideIndex;
  public string $side;
  /** @var TransliterationColumnInput[] */
  public array $columns;

  function __construct(int $sideIndex, string $side, array $columns)
  {
    $this->sideIndex = $sideIndex;
    $this->side = $side;
    $this->columns = $columns;
  }

  static function fromGraphQLInput(array $input): TransliterationSideInput
  {
    return new TransliterationSideInput(
      $input[sideIndexName],
      $input[sideName],
      array_map(fn(array $colInput): TransliterationColumnInput => TransliterationColumnInput::fromGraphQLInput($colInput), $input[columnsName])
    );
  }

  function saveToDb(mysqli $connection, string $mainIdentifier, int $version): bool
  {
    try {
      execute_query_with_connection(
        $connection,
        TransliterationSideInput::insertQuery,
        fn(mysqli_stmt $stmt) => $stmt->bind_param('sisi', $mainIdentifier, $this->sideIndex, $this->side, $version),
        fn(mysqli_stmt $_result) => true
      );
    } catch (Exception $e) {
      error_log('Could not insert transliteration side: ' . $e->getMessage());
      return false;
    }

    return array_reduce(
      $this->columns,
      fn(bool $allSaved, TransliterationColumnInput $column): bool => $allSaved && $column->saveToDb($connection, $mainIdentifier, $this->sideIndex, $version),
      true
    );
  }
}

TransliterationSideInput::$graphQLInputObjectType = new InputObjectType([
  'name' => 'TransliterationSideInput',
  'fields' => [
    sideIndexName => Type::nonNull(Type::int()),
    sideName => Type::nonNull(ManuscriptSide::$graphQLType),
    columnsName => Type::nonNull(Type::listOf(Type::nonNull(TransliterationColumnInput::$graphQLInputObjectType)))
  ]
]);