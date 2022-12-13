# vue-pdf-signer

TODO: Add readme

## Start Dev Server
```bash
yarn dev
```

## Publish Updates
1. Update version number in package.json

2. Build and publish to NPM
```
yarn build-lib
npm publish
```

3. Commit to github
```
git add .
git commit -m "<message>"
git push
git tag -a <version-number> -m "<message>"
```