<?php
require_once '../mysqliconn.php';
header('Access-Control-Allow-Origin: *');
header('Content-Type: text/json');
$db = connect_to_db('hurrian_lexical_database');
$sql = <<<SQL
SELECT stem, part_of_speech, translation_de
FROM lemma;
SQL;
$result = $db->query($sql);
$data = array();
while ($row = $result->fetch_assoc())
{
  $key = $row['stem'].','.$row['part_of_speech'];
  $data[$key][] = $row['translation_de'];
}
echo json_encode($data, JSON_UNESCAPED_UNICODE);
?>