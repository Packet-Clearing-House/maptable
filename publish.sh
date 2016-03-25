BRANCH=`git rev-parse --abbrev-ref HEAD`

if [[ $BRANCH != "master" ]]; then
  echo "You should publish on master"
  exit 1
fi

# Edit From https://github.com/benmanbs/javascript-skeleton/
# Make sure a version type is passed in
if [[ -z "$1" || ( "$1" != "patch" && "$1" != "minor" && "$1" !=  "major" ) ]]
then
  echo "Please call this with one of the following version options: patch, minor, major"
  exit 1
fi

# Get the current git status, and make sure there's nothing to commit on this branch
STATUS=$(git status)

if [[ $STATUS != *"nothing to commit"* || $STATUS != *"Your branch is up-to-date"* ]]
then
  echo "You must have a branch that is up to date to run this publisher. Please commit all changes and try again."
  exit 1
fi

# Get the current version and roll it in package.json
VERSION=$(ruby update_version.rb $1)
echo "Upgrading to version $VERSION"

# Call gulp dist to create the distribution of the code, which also calls bower to create the bower file
gulp dist

# Publish github pages
cp -R dist/maptable.min.js site/maptable.min.js
cp -R dist/maptable.css site/maptable.css

# Push the change to the version numbers in the json files
git commit -a -m "updated to version $VERSION"
git push origin

# Create a tag
git tag -a $VERSION -m "released $VERSION"
git push origin $VERSION

# Update gh-pages
git subtree push --prefix site origin gh-pages

# Publish on npm
npm publish ./

# Publish on bower
bower register maptable git://github.com/Packet-Clearing-House/maptable.git
exit 0
