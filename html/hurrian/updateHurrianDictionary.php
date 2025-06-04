<?php
require_once '../mysqliconn.php';
header('Access-Control-Allow-Origin: *');
include('commonHurrian.php');
$word = $_POST['word'];
$analysis = $_POST['analysis'];
list($segmentation, $translation, $tag, $template, $det) = explode(' @ ', $analysis);
$pos = getPos($template);
list($stem, $suffixes) = parseSegmentation($segmentation);

//Datenbank öffnen
$db = connect_to_db('hurrian_lexical_database');

//Lemma finden oder hinzufügen
$findLemma = <<<SQL
SELECT lemma_id
FROM lemma
WHERE stem = '$stem'
AND part_of_speech = '$pos'
AND translation_de = '$translation'
AND determinative = '$det';
SQL;
$result = $db->query($findLemma);
$row = $result->fetch_assoc();
if (!$row) {
  $sql = <<<SQL
  INSERT INTO lemma (lemma_id, stem, part_of_speech, translation_de, determinative)
  VALUES (null, '$stem', '$pos', '$translation', '$det');
  SQL;
  $db->query($sql);
  $result = $db->query($findLemma);
  $row = $result->fetch_assoc();
}
$lemma_id = $row['lemma_id'];

//Suffixkette finden oder hinzufügen
$findSuffixChain = <<<SQL
SELECT suffix_chain_id
FROM suffix_chain
WHERE suffixes = '$suffixes'
AND morph_tag = '$tag'
AND part_of_speech = '$pos';
SQL;
$result = $db->query($findSuffixChain);
$row = $result->fetch_assoc();
if (!$row) {
  $sql = <<<SQL
  INSERT INTO suffix_chain (suffix_chain_id, suffixes, morph_tag, part_of_speech)
  VALUES (null, '$suffixes', '$tag', '$pos');
  SQL;
  $db->query($sql);
  $result = $db->query($findSuffixChain);
  $row = $result->fetch_assoc();
}
$suffix_chain_id = $row['suffix_chain_id'];

//Wortform finden oder hinzufügen
$findWordform = <<<SQL
SELECT wordform_id
FROM wordform
WHERE transcription = '$word'
AND segmentation = '$segmentation'
AND lemma_id = '$lemma_id'
AND suffix_chain_id = '$suffix_chain_id';
SQL;
$result = $db->query($findWordform);
$row = $result->fetch_assoc();
  if (!$row) {
  $sql = <<<SQL
  INSERT INTO wordform (wordform_id, transcription, segmentation, lemma_id, suffix_chain_id)
  VALUES (null, '$word', '$segmentation', '$lemma_id', '$suffix_chain_id')
  SQL;
  $db->query($sql);
}
?>