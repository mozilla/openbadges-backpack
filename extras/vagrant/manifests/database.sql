create database if not exists `openbadges`;
create database if not exists `openbadges_test`;
create user 'badgemaker'@'localhost' identified by 'secret';
grant all on *.* to 'badgemaker'@'localhost';
