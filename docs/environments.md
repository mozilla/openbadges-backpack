# Environments
## Development, Staging, and Production AWS Information
* The current development branch can be found at http://openbadgesdev.mofostaging.net
* The current staging environment can be found at http://openbadges.mofostaging.net
* The current production environment can be found at http://openbadges.mofoprod.net (NOTE: Once we've migrated to AWS)

To get changes onto development, please make your changes, commit or merge to development branch, and then tag as indicated here.
* Tag version number must be 0.0.*
* Annotated tag must begin with dev

For example:
If the current dev tag is dev0.0.1, use the following:
** git tag -a dev0.0.2 -m "Some notes about 0.0.2"

For staging and production tags, we will avoid using the 0.0.* series version numbers.