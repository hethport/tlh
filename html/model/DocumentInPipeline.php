<?php

namespace model;

require_once __DIR__ . '/../vendor/autoload.php';

use GraphQL\Type\Definition\{ObjectType, Type};
use mysqli_stmt;
use function sql_helpers\executeMultiSelectQuery;

class DocumentInPipeline
{
  static ObjectType $queryType;

  public string $manuscriptIdentifier;
  public ?string $appointedTransliterationReviewer;
  public ?string $transliterationReviewDateString;
  public ?string $appointedXmlConverter;
  public ?string $xmlConversionDateString;
  public ?string $appointedFirstXmlReviewer;
  public ?string $firstXmlReviewDateString;
  public ?string $appointedSecondXmlReviewer;
  public ?string $secondXmlReviewDateString;

  function __construct(
    string  $manuscriptIdentifier,
    ?string $appointedTransliterationReviewer,
    ?string $transliterationReviewDate,
    ?string $appointedXmlConverter,
    ?string $xmlConversionDateString,
    ?string $appointedFirstXmlReviewer,
    ?string $firstXmlReviewDateString,
    ?string $appointedSecondXmlReviewer,
    ?string $secondXmlReviewDateString
  )
  {
    $this->manuscriptIdentifier = $manuscriptIdentifier;
    $this->appointedTransliterationReviewer = $appointedTransliterationReviewer;
    $this->transliterationReviewDateString = $transliterationReviewDate;
    $this->appointedXmlConverter = $appointedXmlConverter;
    $this->xmlConversionDateString = $xmlConversionDateString;
    $this->appointedFirstXmlReviewer = $appointedFirstXmlReviewer;
    $this->firstXmlReviewDateString = $firstXmlReviewDateString;
    $this->appointedSecondXmlReviewer = $appointedSecondXmlReviewer;
    $this->secondXmlReviewDateString = $secondXmlReviewDateString;
  }

  static function selectCount(): int
  {
    // FIXME: implement with query!
    return 0;
  }

  static function selectDocumentsInPipeline(int $page = 0): array
  {
    $pageSize = 10;
    $firstIndex = $page * $pageSize;

    return executeMultiSelectQuery(
      "
select translits.main_identifier,
       trans_rev_app.username as app_translit_reviewer,
       translit_rev.review_date as translit_review_date,
       xml_conv_app.username as app_xml_converter,
       xml_conv.conversion_date as xml_conv_date,
       first_xml_rev_app.username as first_xml_reviewer,
       first_xml_rev.review_date as first_xml_rev_date,
       second_xml_rev_app.username as second_xml_reviewer,
       second_xml_rev.review_date as second_xml_rev_date
from tlh_dig_released_transliterations as translits
    -- join for appointed transliteration reviewer
    left outer join tlh_dig_transliteration_review_appointments as trans_rev_app
        on trans_rev_app.main_identifier = translits.main_identifier
    -- join for transliteration review date
    left outer join tlh_dig_transliteration_reviews as translit_rev
        on translit_rev.main_identifier = translits.main_identifier
    -- join for appointed xml converter
    left outer join tlh_dig_xml_conversion_appointments as xml_conv_app
        on xml_conv_app.main_identifier = translits.main_identifier
    -- join for xml conversion date
    left outer join tlh_dig_xml_conversions as xml_conv
        on xml_conv.main_identifier = translits.main_identifier
    -- join for appointed first xml reviewer
    left outer join tlh_dig_first_xml_review_appointments as first_xml_rev_app
        on first_xml_rev_app.main_identifier = translits.main_identifier
    -- join for first xml review date
    left outer join tlh_dig_first_xml_reviews as first_xml_rev
        on first_xml_rev.main_identifier = translits.main_identifier
    -- join for second appointed xml reviewer
    left outer join tlh_dig_second_xml_review_appointments as second_xml_rev_app
        on second_xml_rev_app.main_identifier = translits.main_identifier
    -- join for second xml review date
    left outer join tlh_dig_second_xml_reviews as second_xml_rev
        on second_xml_rev.main_identifier = translits.main_identifier
limit ?, ?;",
      fn(mysqli_stmt $stmt): bool => $stmt->bind_param('ii', $firstIndex, $pageSize),
      fn(array $row): DocumentInPipeline => new DocumentInPipeline(
        $row['main_identifier'],
        $row['app_translit_reviewer'],
        $row['translit_review_date'],
        $row['app_xml_converter'],
        $row['xml_conv_date'],
        $row['first_xml_reviewer'],
        $row['first_xml_rev_date'],
        $row['second_xml_reviewer'],
        $row['second_xml_rev_date']
      )
    );
  }
}

DocumentInPipeline::$queryType = new ObjectType([
  'name' => 'DocumentInPipeline',
  'fields' => [
    'manuscriptIdentifier' => Type::nonNull(Type::string()),
    'appointedTransliterationReviewer' => Type::string(),
    'transliterationReviewDateString' => Type::string(),
    'appointedXmlConverter' => Type::string(),
    'xmlConversionDateString' => Type::string(),
    'appointedFirstXmlReviewer' => Type::string(),
    'firstXmlReviewDateString' => Type::string(),
    'appointedSecondXmlReviewer' => Type::string(),
    'secondXmlReviewDateString' => Type::string()
  ]
]);