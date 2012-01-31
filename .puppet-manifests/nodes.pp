node lucid32 {
  include essentials
  include mysql::server
  include openbadges::db
  include nginx
  include nodejs
  include openbadges::app
}
