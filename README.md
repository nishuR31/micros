# Microservice Boilerplate Generator


[![Stargazers](https://img.shields.io/github/stars/nishur31/micros?style=social)](https://github.com/nishur31/micros/stargazers)
[![Issues](https://img.shields.io/github/issues/nishur31/micros)](https://github.com/nishur31/micros/issues)
[![Forks](https://img.shields.io/github/forks/nishur31/micros)](https://github.com/nishur31/micros/network/members)
[![Size](https://img.shields.io/github/repo-size/nishur31/micros)](https://github.com/nishur31/micros)
[![License](https://img.shields.io/github/license/nishur31/micros)](https://github.com/nishur31/micros/blob/main/LICENSE)

---

## Overview

This project is a robust, modular microservice boilerplate generator for Node.js. It supports dynamic runtime installation, interactive prompts, ESM compatibility, and generates a complete microservice project structure with best practices.

## Features
- Modular codebase with centralized utilities
- Dynamic runtime module installation (installs only valid npm packages)
- Interactive package.json creation and updating
- Prettier and .gitignore generator
- Custom logging and error handling
- ESM (ECMAScript Module) support
- Multi-database and Redis caching support
- Automatic folder and file structure generation
- Shields.io badges for repo status, stargazers, issues, forks, size, and license

## Usage

1. Clone the repository:
   ```bash
   git clone https://github.com/nishur31/micros.git
   cd micros
   ```
2. Run the generator:
   ```bash
   node index.js
   ```
4. Follow the interactive prompts to configure your microservices, databases, and caching.

## Project Structure
- `index.js`: Main generator CLI
- `package.js`: Handles package.json creation
- `importModule.js`: Dynamic module installer
- `codeBase.js`: Centralized code templates
- `prettier.js`: Prettier config generator
- `gitignore.js`: .gitignore generator
- `handler.js`: Error handling wrapper
- `log.js`: Custom logging

## Extra
- Supports custom service names and gateway service by default
- Generates README.md for each service ( will be fixed in patches)
- Annotates Prisma schema with selected DB type
- Cleans up temp directories after .gitignore generation
- No emojis used in README or logs

## Contributing
Contributions are welcome! Please open issues or pull requests for suggestions, bug reports, or improvements.

## License
This project is licensed under the MIT License. See the LICENSE file for details.

## Links
- [GitHub Repository](https://github.com/nishur31/micros)
- [Stargazers](https://github.com/nishur31/micros/stargazers)
- [Issues](https://github.com/nishur31/micros/issues)
