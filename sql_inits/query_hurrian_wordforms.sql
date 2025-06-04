select lemma.stem, /*transcription,*/ segmentation, lemma.translation_de, suffix_chain.morph_tag
  from wordform
  inner join lemma on wordform.lemma_id=lemma.lemma_id
  inner join suffix_chain on wordform.suffix_chain_id=suffix_chain.suffix_chain_id
  order by lemma.stem, transcription;
