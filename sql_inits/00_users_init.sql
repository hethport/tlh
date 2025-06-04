create user hpm@'%' identified by '1234';

grant all on hpm.* to hpm@'%';
grant all on hurrian_lexical_database.* to hpm@'%';

flush privileges;
