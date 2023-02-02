<?php

namespace model;

use GraphQL\Type\Definition\EnumType;

class ManuscriptColumn
{
  static EnumType $graphQLType;
}

ManuscriptColumn::$graphQLType = new EnumType([
  'name' => 'ManuscriptColumn',
  'values' => [
    'None', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'LeftColumn', 'MiddleColumn', 'RightColumn', 'ColumnDivider'
  ]
]);

class ManuscriptColumnModifier
{
  static EnumType $graphQLType;
}

ManuscriptColumnModifier::$graphQLType = new EnumType([
  'name' => 'ManuscriptColumnModifier',
  'values' => [
    'None', 'Slash', 'SlashQuestion'
  ]
]);