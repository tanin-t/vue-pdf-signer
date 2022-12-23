#!/usr/bin/env bash

# Exit immediately if any command returns a non-zero exit code
set -e

# Exit if you try to use an uninitialized variable
set -u

# Enable debugging output
set -x

# Change to the directory that contains the current script
cd "$(dirname "$0")"

# Install the jq tool if it's not already installed
# yarn add -D jq

# Get the version from package.json
version=$(jq '.version' package.json)

# Ask the user for confirmation
echo "Publishing version $version to npm. Continue [Y/n]"
read -r response

# Check the value of $response
if [[ "$response" =~ ^([yY][eE][sS]|[yY])+$ ]]; then
  # Build the library
  yarn build-lib

  # Publish the package to npm
  npm publish

  # Commit the changes and create a tag
  git add .
  git commit -m "Version $version"
  git tag -a "$version" -m "$version"
  git push && git push --tags
else
  echo "Aborted!"
fi
