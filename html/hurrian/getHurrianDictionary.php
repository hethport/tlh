<?php
require_once '../mysqliconn.php';
header('Access-Control-Allow-Origin: *');
header('Content-Type: text/json');
$db = connect_to_db('hurrian_lexical_database');
$sql = <<<SQL
SELECT w.transcription, w.segmentation, l.translation_de, s.morph_tag, l.part_of_speech, l.determinative
FROM wordform w
  INNER JOIN lemma l ON l.lemma_id = w.lemma_id
  INNER JOIN suffix_chain s ON s.suffix_chain_id = w.suffix_chain_id;
SQL;
$result = $db->query($sql);
$data = array();
while ($row = $result->fetch_assoc())
{
  $fields = array($row['segmentation'],
                  $row['translation_de'],
                  $row['morph_tag'],
                  $row['part_of_speech'],
                  $row['determinative']);
  $data[$row['transcription']][] = implode(' @ ', $fields);
}
echo json_encode($data, JSON_UNESCAPED_UNICODE);
?>