<?php
function getPos($template)
{
  if ($template === 'noun' || $template === 'indecl' || $template === '')
  {
    return $template;
  }
  else
  {
    return 'verb';
  }
}
function findBoundary($word)
{
	for ($i = 0; $i < strlen($word); $i++)
	{
		$char = $word[$i];
		if ($char === '-' || $char === '=' || $char === '.')
		{
			return $i;
		}
	}
	return -1;
}
$auxiliary = array('(', ')');
function normalizeStem($stem)
{
  global $auxiliary;
  $stem = str_replace($auxiliary, '', $stem);
  return $stem;
}
function parseSegmentation($analysis)
{
  $index = findBoundary($analysis);
  if ($index !== -1)
  {
    $stem = substr($analysis, 0, $index);
    if ($analysis[$index] === '-')
    {
      $index++;
    }
    $suffixChain = substr($analysis, $index);
  }
  else
  {
    $stem = $analysis;
    $suffixChain = '';
  }
  $stem = normalizeStem($stem);
  return array($stem, $suffixChain);
}
?>
