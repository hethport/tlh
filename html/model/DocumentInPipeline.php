<?php

namespace model;

require_once __DIR__ . '/../vendor/autoload.php';

use GraphQL\Type\Definition\{ObjectType, Type};
use mysqli_stmt;
use sql_helpers\SqlHelpers;

class DocumentInPipeline
{
  static ObjectType $queryType;

  public string $manuscriptIdentifier;
  public string $author;
  public string $creationDate;
  public ?string $appointedTransliterationReviewer;
  public ?string $transliterationReviewDateString;
  public ?string $appointedXmlConverter;
  public ?string $xmlConversionDateString;
  public ?string $appointedFirstXmlReviewer;
  public ?string $firstXmlReviewDateString;
  public ?string $appointedSecondXmlReviewer;
  public ?string $secondXmlReviewDateString;
  public ?string $approvalDateString;

  function __construct(
    string  $manuscriptIdentifier,
    string $author,
    string $creationDate,
    ?string $appointedTransliterationReviewer,
    ?string $transliterationReviewDate,
    ?string $appointedXmlConverter,
    ?string $xmlConversionDateString,
    ?string $appointedFirstXmlReviewer,
    ?string $firstXmlReviewDateString,
    ?string $appointedSecondXmlReviewer,
    ?string $secondXmlReviewDateString,
    ?string $approvalDateString
  )
  {
    $this->manuscriptIdentifier = $manuscriptIdentifier;
    $this->author = $author;
    $this->creationDate = $creationDate;
    $this->appointedTransliterationReviewer = $appointedTransliterationReviewer;
    $this->transliterationReviewDateString = $transliterationReviewDate;
    $this->appointedXmlConverter = $appointedXmlConverter;
    $this->xmlConversionDateString = $xmlConversionDateString;
    $this->appointedFirstXmlReviewer = $appointedFirstXmlReviewer;
    $this->firstXmlReviewDateString = $firstXmlReviewDateString;
    $this->appointedSecondXmlReviewer = $appointedSecondXmlReviewer;
    $this->secondXmlReviewDateString = $secondXmlReviewDateString;
    $this->approvalDateString = $approvalDateString;
  }

  private static function buildWhereClause(?string $filterByStep, ?string $filterByCreator): string
  {
    $conditions = [];

    if ($filterByStep && $filterByStep !== 'all') {
      switch ($filterByStep) {
        case 'transliterationReview':
          $conditions[] = "trans_rev_app.username IS NOT NULL AND translit_rev.review_date IS NULL";
          break;
        case 'xmlConversion':
          $conditions[] = "xml_conv_app.username IS NOT NULL AND xml_conv.conversion_date IS NULL";
          break;
        case 'firstXmlReview':
          $conditions[] = "first_xml_rev_app.username IS NOT NULL AND first_xml_rev.review_date IS NULL";
          break;
        case 'secondXmlReview':
          $conditions[] = "second_xml_rev_app.username IS NOT NULL AND second_xml_rev.review_date IS NULL";
          break;
        case 'completed':
          $conditions[] = "approved_trans.approval_date IS NOT NULL";
          break;
        case 'pending':
          $conditions[] = "approved_trans.approval_date IS NULL";
          break;
      }
    }

    if ($filterByCreator && $filterByCreator !== 'all') {
      $conditions[] = "manuscript.creator_username = '" . addslashes($filterByCreator) . "'";
    }

    return count($conditions) > 0 ? ' WHERE ' . implode(' AND ', $conditions) : '';
  }

  static function selectCount(?string $filterByStep = null, ?string $filterByCreator = null): int
  {
    $whereClause = self::buildWhereClause($filterByStep, $filterByCreator);

    return SqlHelpers::executeSingleReturnRowQuery(
      "
SELECT COUNT(*) as count
FROM tlh_dig_released_transliterations as translits
    JOIN tlh_dig_manuscripts as manuscript USING(main_identifier)
    LEFT OUTER JOIN tlh_dig_transliteration_review_appointments as trans_rev_app USING(main_identifier)
    LEFT OUTER JOIN tlh_dig_transliteration_reviews as translit_rev USING(main_identifier)
    LEFT OUTER JOIN tlh_dig_xml_conversion_appointments as xml_conv_app USING(main_identifier)
    LEFT OUTER JOIN tlh_dig_xml_conversions as xml_conv USING(main_identifier)
    LEFT OUTER JOIN tlh_dig_first_xml_review_appointments as first_xml_rev_app USING(main_identifier)
    LEFT OUTER JOIN tlh_dig_first_xml_reviews as first_xml_rev USING(main_identifier)
    LEFT OUTER JOIN tlh_dig_second_xml_review_appointments as second_xml_rev_app USING(main_identifier)
    LEFT OUTER JOIN tlh_dig_second_xml_reviews as second_xml_rev USING(main_identifier)
    LEFT OUTER JOIN tlh_dig_approved_transliterations as approved_trans USING(main_identifier)
$whereClause;",
      null,
      fn(array $row): int => (int)$row['count']
    );
  }

  static function selectDocumentsInPipeline(
    int $page = 0,
    int $pageSize = 50,
    ?string $sortBy = 'creationDate',
    ?string $sortDirection = 'DESC',
    ?string $filterByStep = null,
    ?string $filterByCreator = null
  ): array
  {
    $firstIndex = $page * $pageSize;

    // Validate and sanitize sort parameters
    $allowedSortFields = [
      'creationDate' => 'manuscript.creation_date',
      'manuscriptIdentifier' => 'translits.main_identifier',
      'transliterationReviewDate' => 'translit_rev.review_date',
      'xmlConversionDate' => 'xml_conv.conversion_date',
      'firstXmlReviewDate' => 'first_xml_rev.review_date',
      'secondXmlReviewDate' => 'second_xml_rev.review_date'
    ];

    $sortField = $allowedSortFields[$sortBy] ?? $allowedSortFields['creationDate'];
    $sortDir = strtoupper($sortDirection) === 'ASC' ? 'ASC' : 'DESC';

    $whereClause = self::buildWhereClause($filterByStep, $filterByCreator);

    return SqlHelpers::executeMultiSelectQuery(
      "
SELECT translits.main_identifier,
       manuscript.creator_username as author,
       manuscript.creation_date,
       trans_rev_app.username as app_translit_reviewer,
       translit_rev.review_date as translit_review_date,
       xml_conv_app.username as app_xml_converter,
       xml_conv.conversion_date as xml_conv_date,
       first_xml_rev_app.username as first_xml_reviewer,
       first_xml_rev.review_date as first_xml_rev_date,
       second_xml_rev_app.username as second_xml_reviewer,
       second_xml_rev.review_date as second_xml_rev_date,
       approved_trans.approval_date as approval_date
FROM tlh_dig_released_transliterations as translits
    JOIN tlh_dig_manuscripts as manuscript USING(main_identifier)
    -- join for appointed transliteration reviewer
    LEFT OUTER JOIN tlh_dig_transliteration_review_appointments as trans_rev_app USING(main_identifier)
    -- join for transliteration review date
    LEFT OUTER JOIN tlh_dig_transliteration_reviews as translit_rev USING(main_identifier)
    -- join for appointed xml converter
    LEFT OUTER JOIN tlh_dig_xml_conversion_appointments as xml_conv_app USING(main_identifier)
    -- join for xml conversion date
    LEFT OUTER JOIN tlh_dig_xml_conversions as xml_conv USING(main_identifier)
    -- join for appointed first xml reviewer
    LEFT OUTER JOIN tlh_dig_first_xml_review_appointments as first_xml_rev_app USING(main_identifier)
    -- join for first xml review date
    LEFT OUTER JOIN tlh_dig_first_xml_reviews as first_xml_rev USING(main_identifier)
    -- join for second appointed xml reviewer
    LEFT OUTER JOIN tlh_dig_second_xml_review_appointments as second_xml_rev_app USING(main_identifier)
    -- join for second xml review date
    LEFT OUTER JOIN tlh_dig_second_xml_reviews as second_xml_rev USING(main_identifier)
    -- join for approval
    LEFT OUTER JOIN tlh_dig_approved_transliterations as approved_trans USING(main_identifier)
$whereClause
ORDER BY $sortField $sortDir
LIMIT ?, ?;",
      fn(mysqli_stmt $stmt): bool => $stmt->bind_param('ii', $firstIndex, $pageSize),
      fn(array $row): DocumentInPipeline => new DocumentInPipeline(
        $row['main_identifier'],
        $row['author'],
        $row['creation_date'],
        $row['app_translit_reviewer'],
        $row['translit_review_date'],
        $row['app_xml_converter'],
        $row['xml_conv_date'],
        $row['first_xml_reviewer'],
        $row['first_xml_rev_date'],
        $row['second_xml_reviewer'],
        $row['second_xml_rev_date'],
        $row['approval_date']
      )
    );
  }
}

DocumentInPipeline::$queryType = new ObjectType([
  'name' => 'DocumentInPipeline',
  'fields' => [
    'manuscriptIdentifier' => Type::nonNull(Type::string()),
    'author' => Type::nonNull(Type::string()),
    'creationDate' => Type::nonNull(Type::string()),
    'appointedTransliterationReviewer' => Type::string(),
    'transliterationReviewDateString' => Type::string(),
    'appointedXmlConverter' => Type::string(),
    'xmlConversionDateString' => Type::string(),
    'appointedFirstXmlReviewer' => Type::string(),
    'firstXmlReviewDateString' => Type::string(),
    'appointedSecondXmlReviewer' => Type::string(),
    'secondXmlReviewDateString' => Type::string(),
    'approvalDateString' => Type::string()
  ]
]);
