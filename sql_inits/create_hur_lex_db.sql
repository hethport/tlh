create database if not exists hurrian_lexical_database;
use hurrian_lexical_database;

/*drop table if exists
  wordform,
  lemma,
  suffix_chain;*/

/* begin table creation */

CREATE TABLE if not exists lemma (
  lemma_id mediumint unsigned not null auto_increment,
  stem text not null,
  part_of_speech text not null,
  translation_de text not null,
  determinative text not null,
  constraint pk_lemma primary key (lemma_id)
);

CREATE TABLE if not exists suffix_chain (
  suffix_chain_id mediumint unsigned not null auto_increment,
  suffixes text not null,
  morph_tag text not null,
  part_of_speech text not null,
  constraint pk_suffix_chain primary key (suffix_chain_id)
);

CREATE TABLE if not exists wordform (
  wordform_id mediumint unsigned not null auto_increment,
  transcription text not null,
  segmentation text not null,
  lemma_id mediumint unsigned not null,
  suffix_chain_id mediumint unsigned not null,
  constraint fk_lemma_id foreign key (lemma_id)
    references lemma (lemma_id),
  constraint fk_suffix_chain_id foreign key (suffix_chain_id)
    references suffix_chain (suffix_chain_id),
  constraint pk_wordform primary key (wordform_id)
);

/* end table creation */

/* begin data population */

/* lemma data */
insert into lemma (lemma_id, stem, part_of_speech, translation_de, determinative)
values (null, 'nāli', 'noun', 'Rehbock', '');
insert into lemma (lemma_id, stem, part_of_speech, translation_de, determinative)
values (null, 'tāri', 'noun', 'Feuer', '');
insert into lemma (lemma_id, stem, part_of_speech, translation_de, determinative)
values (null, 'id', 'verb', 'schlagen', '');
insert into lemma (lemma_id, stem, part_of_speech, translation_de, determinative)
values (null, 'am', 'verb', 'brennen', '');

/* suffix chain data */
insert into suffix_chain (suffix_chain_id, suffixes, morph_tag, part_of_speech)
values (null, '(n>)re-ž', 'RELAT.SG-ERG', 'noun');

/* wordform data */
insert into wordform (wordform_id, transcription, segmentation, lemma_id, suffix_chain_id)
values (null, 'tārrež', 'tār(i)-(n>)re-ž', 2, 1);

/* end data population */