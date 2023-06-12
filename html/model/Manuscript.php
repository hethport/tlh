<?php

namespace model;

require_once __DIR__ . '/../vendor/autoload.php';
require_once __DIR__ . '/../sql_helpers.php';
require_once __DIR__ . '/ManuscriptIdentifier.php';
require_once __DIR__ . '/ManuscriptStatus.php';
require_once __DIR__ . '/AbstractManuscript.php';

use GraphQL\Type\Definition\{ObjectType, Type};
use MySafeGraphQLException;
use mysqli_stmt;
use function sql_helpers\{executeMultiSelectQuery, executeSingleChangeQuery, executeSingleSelectQuery};

/** @return string[] */
function getPictures(string $manuscriptMainIdentifier): array
{
  $folder = __DIR__ . "/../uploads/$manuscriptMainIdentifier/";

  return file_exists($folder) && is_dir($folder)
    ? array_filter(scandir($folder), fn(string $value): bool => !in_array($value, ['.', '..']))
    : [];
}

class Manuscript extends AbstractManuscript
{
  static ObjectType $graphQLType;
  static ObjectType $graphQLMutationsType;

  public string $status;

  function __construct(
    ManuscriptIdentifier $mainIdentifier,
    string               $palaeographicClassification,
    bool                 $palaeographicClassificationSure,
    ?string              $provenance,
    ?int                 $cthClassification,
    ?string              $bibliography,
    string               $status,
    string               $creatorUsername
  )
  {
    parent::__construct($mainIdentifier, $palaeographicClassification, $palaeographicClassificationSure, $provenance, $cthClassification, $bibliography, $creatorUsername);
    $this->status = $status;
  }

  static function fromDbAssocArray(array $row): Manuscript
  {
    $status = $row['approval_performed']
      ? ManuscriptStatus::approved
      : ($row['second_xml_rev_performed']
        ? ManuscriptStatus::secondXmlReviewed
        : ($row['first_xml_rev_performed']
          ? ManuscriptStatus::firstXmlReviewPerformed
          : ($row['xml_conv_performed']
            ? ManuscriptStatus::xmlConversionPerformed
            : ($row['transliteration_reviewed']
              ? ManuscriptStatus::transliterationReviewed
              : ($row['transliteration_released']
                ? ManuscriptStatus::transliterationReleased
                : ManuscriptStatus::created
              )
            )
          )
        )
      );

    return new Manuscript(
      new ManuscriptIdentifier($row['main_identifier_type'], $row['main_identifier']),
      $row['palaeo_classification'],
      $row['palaeo_classification_sure'],
      $row['provenance'],
      $row['cth_classification'],
      $row['bibliography'],
      $status,
      $row['creator_username']
    );
  }

  static function selectManuscriptsCount(): int
  {
    return executeSingleSelectQuery(
      "select count(*) as manuscript_count from tlh_dig_manuscripts;",
      null,
      fn(array $row): int => (int)$row['manuscript_count']
    ) ?? -1;
  }

  /** @return Manuscript[] */
  static function selectAllManuscriptsPaginated(int $page): array
  {
    $pageSize = 10;
    $first = $page * $pageSize;

    return executeMultiSelectQuery(
      "
select manuscript.main_identifier,
       main_identifier_type,
       palaeo_classification,
       palaeo_classification_sure,
       provenance,
       cth_classification,
       bibliography,
       creator_username,
       rel_trans.release_date is not null       as transliteration_released,
       translit_rev.review_date is not null     as transliteration_reviewed,
       xml_conv.conversion_date is not null     as xml_conv_performed,
       first_xml_rev.review_date is not null    as first_xml_rev_performed,
       second_xml_rev.review_date is not null   as second_xml_rev_performed,
       approved_trans.approval_date is not null as approval_performed
from tlh_dig_manuscripts as manuscript
         left outer join tlh_dig_released_transliterations as rel_trans
                         on rel_trans.main_identifier = manuscript.main_identifier
         left outer join tlh_dig_transliteration_reviews as translit_rev
                         on translit_rev.main_identifier = manuscript.main_identifier
         left outer join tlh_dig_xml_conversions as xml_conv
                         on xml_conv.main_identifier = manuscript.main_identifier
         left outer join tlh_dig_first_xml_reviews as first_xml_rev
                         on first_xml_rev.main_identifier = manuscript.main_identifier
         left outer join tlh_dig_second_xml_reviews as second_xml_rev
                         on second_xml_rev.main_identifier = manuscript.main_identifier
         left outer join tlh_dig_approved_transliterations as approved_trans
                         on approved_trans.main_identifier = manuscript.main_identifier
order by creation_date desc
limit ?, ?;",
      fn(mysqli_stmt $stmt) => $stmt->bind_param('ii', $first, $pageSize),
      fn(array $row): Manuscript => Manuscript::fromDbAssocArray($row)
    );
  }

  /** @return string[] */
  static function selectManuscriptIdentifiersForUser(string $username): array
  {
    return executeMultiSelectQuery(
      "select main_identifier from tlh_dig_manuscripts where creator_username = ?;",
      fn(mysqli_stmt $stmt) => $stmt->bind_param('s', $username),
      fn(array $row): string => (string)$row['main_identifier'],
    );
  }

  static function selectManuscriptById(string $mainIdentifier): ?Manuscript
  {
    return executeSingleSelectQuery(
      "
select manuscript.main_identifier,
       main_identifier_type,
       palaeo_classification,
       palaeo_classification_sure,
       provenance,
       cth_classification,
       bibliography,
       creator_username,
       rel_trans.release_date is not null       as transliteration_released,
       translit_rev.review_date is not null     as transliteration_reviewed,
       xml_conv.conversion_date is not null     as xml_conv_performed,
       first_xml_rev.review_date is not null    as first_xml_rev_performed,
       second_xml_rev.review_date is not null   as second_xml_rev_performed,
       approved_trans.approval_date is not null as approval_performed
from tlh_dig_manuscripts as manuscript
         left outer join tlh_dig_released_transliterations as rel_trans
                         on rel_trans.main_identifier = manuscript.main_identifier
         left outer join tlh_dig_transliteration_reviews as translit_rev
                         on translit_rev.main_identifier = manuscript.main_identifier
         left outer join tlh_dig_xml_conversions as xml_conv
                         on xml_conv.main_identifier = manuscript.main_identifier
         left outer join tlh_dig_first_xml_reviews as first_xml_rev
                         on first_xml_rev.main_identifier = manuscript.main_identifier
         left outer join tlh_dig_second_xml_reviews as second_xml_rev
                         on second_xml_rev.main_identifier = manuscript.main_identifier
         left outer join tlh_dig_approved_transliterations as approved_trans
                         on approved_trans.main_identifier = manuscript.main_identifier
where manuscript.main_identifier = ?;",
      fn(mysqli_stmt $stmt) => $stmt->bind_param('s', $mainIdentifier),
      fn(array $row): Manuscript => Manuscript::fromDbAssocArray($row)
    );
  }

  /** @return ManuscriptIdentifier[] */
  function selectOtherIdentifiers(): array
  {
    return executeMultiSelectQuery(
      "select identifier_type, identifier from tlh_dig_manuscript_other_identifiers where main_identifier = ?;",
      fn(mysqli_stmt $stmt): bool => $stmt->bind_param('s', $this->mainIdentifier->identifier),
      fn(array $row): ManuscriptIdentifier => ManuscriptIdentifier::fromDbAssocArray($row),
    );
  }

  // Transliterations

  function upsertProvisionalTransliteration(string $transliteration): bool
  {
    return executeSingleChangeQuery(
      "insert into tlh_dig_provisional_transliterations (main_identifier, input) values (?, ?) on duplicate key update input = ?;",
      fn(mysqli_stmt $stmt) => $stmt->bind_param('sss', $this->mainIdentifier->identifier, $transliteration, $transliteration)
    );
  }

  function selectProvisionalTransliteration(): ?string
  {
    return executeSingleSelectQuery(
      "select input from tlh_dig_provisional_transliterations where main_identifier = ?;",
      fn(mysqli_stmt $stmt): bool => $stmt->bind_param('s', $this->mainIdentifier->identifier),
      fn(array $row): string => $row['input']
    );
  }

  function selectReleasedTransliteration(): ?string
  {
    return executeSingleSelectQuery(
      "select main_identifier from tlh_dig_released_transliterations where main_identifier = ?;",
      fn(mysqli_stmt $stmt): bool => $stmt->bind_param('s', $this->mainIdentifier->identifier),
      fn(array $row): string => $row['main_identifier']
    );
  }

  function transliterationIsReleased(): bool
  {
    return !is_null($this->selectReleasedTransliteration());
  }

  function insertReleasedTransliteration(): bool
  {
    return executeSingleChangeQuery(
      "insert into tlh_dig_released_transliterations (main_identifier) values (?);",
      fn(mysqli_stmt $stmt): bool => $stmt->bind_param('s', $this->mainIdentifier->identifier)
    );
  }
}

// GraphQL

Manuscript::$graphQLType = new ObjectType([
  'name' => 'ManuscriptMetaData',
  'fields' => [
    'mainIdentifier' => Type::nonNull(ManuscriptIdentifier::$graphQLType),
    'provenance' => Type::string(),
    'cthClassification' => Type::int(),
    'bibliography' => Type::string(),
    'creatorUsername' => Type::nonNull(Type::string()),
    'palaeographicClassification' => Type::nonNull(AbstractManuscript::$palaeographicClassificationGraphQLEnumType),
    'palaeographicClassificationSure' => Type::nonNull(Type::boolean()),
    'status' => [
      // TODO: remove!
      'type' => ManuscriptStatus::$graphQLType,
      'deprecationReason' => 'will be removed!',
      'resolve' => fn(Manuscript $manuscript): string => $manuscript->status
    ],
    'otherIdentifiers' => [
      'type' => Type::nonNull(Type::listOf(Type::nonNull(ManuscriptIdentifier::$graphQLType))),
      'resolve' => fn(Manuscript $manuscript): array => $manuscript->selectOtherIdentifiers()
    ],
    'pictureUrls' => [
      'type' => Type::nonNull(Type::listOf(Type::nonNull(Type::string()))),
      'resolve' => fn(Manuscript $manuscript): array => getPictures($manuscript->mainIdentifier->identifier)
    ],
    'provisionalTransliteration' => [
      'type' => Type::string(),
      'resolve' => fn(Manuscript $manuscript): ?string => $manuscript->selectProvisionalTransliteration()
    ],
    'transliterationReleased' => [
      // FIXME: also resolve creator!
      'type' => Type::nonNull(Type::boolean()),
      'resolve' => fn(Manuscript $manuscript): bool => $manuscript->transliterationIsReleased()
    ]
  ]
]);

Manuscript::$graphQLMutationsType = new ObjectType([
  'name' => 'ManuscriptMutations',
  'fields' => [
    'updateTransliteration' => [
      'type' => Type::nonNull(Type::boolean()),
      'args' => [
        'input' => Type::nonNull(Type::string())
      ],
      'resolve' => function (Manuscript $manuscript, array $args, ?User $user): bool {
        if (is_null($user)) {
          throw new MySafeGraphQLException('User is not logged in!');
        }
        if ($manuscript->creatorUsername !== $user->username) {
          throw new MySafeGraphQLException("Can only change own transliterations!");
        }
        if ($manuscript->transliterationIsReleased()) {
          throw new MySafeGraphQLException("Transliteration is already released!");
        }

        return $manuscript->upsertProvisionalTransliteration($args['input']);
      }
    ],
    'releaseTransliteration' => [
      'type' => Type::nonNull(Type::boolean()),
      'resolve' => function (Manuscript $manuscript, array $args, ?User $user): bool {
        if (is_null($user)) {
          throw new MySafeGraphQLException('User is not logged in!');
        }
        if ($manuscript->creatorUsername !== $user->username) {
          throw new MySafeGraphQLException('Only the owner can release the transliteration!');
        }
        if ($manuscript->transliterationIsReleased()) {
          return true;
        }

        $provisionalTransliteration = $manuscript->selectProvisionalTransliteration();

        if (is_null($provisionalTransliteration)) {
          throw new MySafeGraphQLException('Can\'t release a non-existing transliteration!');
        }

        // FIXME: send mail to executive editors!

        return $manuscript->insertReleasedTransliteration();
      }
    ]
  ]
]);

