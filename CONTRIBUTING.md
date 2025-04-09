# Contributing to Calctra

Thank you for your interest in contributing to Calctra! This document provides guidelines and instructions for contributing to the project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Environment](#development-environment)
- [Contribution Workflow](#contribution-workflow)
- [Coding Standards](#coding-standards)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)
- [Testing](#testing)
- [Documentation](#documentation)
- [Community Channels](#community-channels)

## Code of Conduct

Our community is based on mutual respect, tolerance, and encouragement. We aim to foster an open and welcoming environment. All participants in our community are expected to be respectful and considerate of others. All forms of abuse, harassment, or discrimination will not be tolerated.

## Getting Started

1. **Fork the Repository**: Start by forking the [Calctra repository](https://github.com/CalctraAI/Calctra).

2. **Clone Your Fork**: 
   ```
   git clone https://github.com/your-username/Calctra.git
   cd Calctra
   ```

3. **Add Upstream Remote**:
   ```
   git remote add upstream https://github.com/CalctraAI/Calctra.git
   ```

4. **Create a Branch**:
   ```
   git checkout -b feature/your-feature-name
   ```

## Development Environment

### Prerequisites

- Node.js (v14 or newer)
- npm or yarn
- Solana CLI tools
- Phantom Wallet or other compatible Solana wallet
- Docker (for local deployment)

### Setup

1. Install dependencies:
   ```
   npm install
   ```

2. Copy the example environment file:
   ```
   cp .env.example .env
   ```

3. Configure the environment variables in `.env`.

4. Run the development server:
   ```
   npm run dev
   ```

## Contribution Workflow

1. **Select an Issue**: Find an issue to work on from the [issue tracker](https://github.com/CalctraAI/Calctra/issues). You can also create a new issue if you've found a bug or have a feature proposal.

2. **Discuss**: For significant changes, it's best to discuss your proposed changes in the issue before starting work.

3. **Develop**: Make your changes in your feature branch.

4. **Test**: Ensure your changes pass all tests.

5. **Submit a Pull Request**: Once you're ready, submit a pull request from your fork to the main repository.

## Coding Standards

We follow these coding standards:

- **JavaScript/TypeScript**: We use ESLint with our configuration. Run `npm run lint` to check your code.
- **Solidity**: Follow the [Solidity style guide](https://docs.soliditylang.org/en/latest/style-guide.html).
- **Documentation**: Document all public functions, classes, and modules.
- **Tests**: Write tests for all new functionality.

## Commit Guidelines

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

- `feat:` for new features
- `fix:` for bug fixes
- `docs:` for documentation changes
- `style:` for formatting changes that don't affect code functionality
- `refactor:` for code refactoring without functionality changes
- `test:` for adding or modifying tests
- `chore:` for build process or tooling changes

Example:
```
feat: implement resource matching algorithm
```

## Pull Request Process

1. **Create a Pull Request**: Submit a PR from your fork to the main repository.

2. **PR Description**: Include a clear description of the changes, reference related issues, and explain your approach.

3. **Code Review**: Wait for code review from maintainers. Make any requested changes.

4. **CI Checks**: Ensure all CI checks pass.

5. **Approval and Merge**: After approval, a maintainer will merge your PR.

## Testing

- Write tests for all new functionality.
- Ensure all tests pass before submitting a PR.
- Run tests with `npm test`.
- Include both unit and integration tests where appropriate.

## Documentation

- Document all public APIs, functions, and classes.
- Update the README.md if necessary.
- For significant changes, update or add to the project documentation.
- Consider adding examples for new features.

## Community Channels

- **Discord**: [Join our Discord server](https://discord.gg/calctra)
- **Twitter**: Follow us [@calctra_sol](https://x.com/calctra_sol)
- **GitHub Discussions**: For technical discussions and questions

---

Thank you for contributing to Calctra! Your efforts help make scientific computing more accessible to everyone. 