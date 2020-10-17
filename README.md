# graphql-date-scalars

[![Build status](https://github.com/neofinancial/graphql-date-scalars/workflows/CI/badge.svg)](https://github.com/neofinancial/graphql-date-scalars/actions)
![TypeScript 3.5.3](https://img.shields.io/badge/TypeScript-3.5.3-brightgreen.svg)

Graphql Scalars for Date (YYYY-MM-DD), DateTime (YYYY-MM-DDTHH:MM:SSZ), and Time (HH:MM:SSZ)

## Usage

TODO

## Contributing

1. Fork this repo
1. Clone the forked repo
1. Install dependencies: `yarn`

### Building

#### `yarn build`

To clean the build directory run `yarn clean`

### Running Tests

#### `yarn test`

## Publishing

1. Update the version in `package.json`
1. Add a `CHANGELOG.md` entry
1. Commit your changes
1. Run `npm pack` to see what will be published then delete the `.tgz` file that was created
1. Run `npm publish`
1. Create a release on GitHub. Use the version as the tag and release name. For example for version `1.0.0` the tag and release name would be `v1.0.0`.

## Contributors

This project started as a fork of https://github.com/excitement-engineer/graphql-iso-date
