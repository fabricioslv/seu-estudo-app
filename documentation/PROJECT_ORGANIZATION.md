# Seu-Estudo Project Organization

## Directory Structure

```
Seu-Estudo/
├── backend/                 # Backend application (Node.js/Express)
├── frontend/                # Frontend application (React/Vue/Angular)
├── documentation/           # Project documentation
│   ├── project/             # Project-level documentation
│   ├── technical/           # Technical documentation
│   └── supabase/            # Supabase-specific documentation
├── docs/                    # Additional documentation
├── scripts/                 # Utility scripts
├── supabase/                # Supabase configuration and migrations
├── .github/                 # GitHub workflows and configurations
├── .vercel/                 # Vercel configurations
├── .vscode/                 # VS Code settings
├── Livros didáticos/        # Educational books directory
└── Provas e gabaritos/      # Exam papers and answer keys
```

## Backend Structure

```
backend/
├── config/                  # Configuration files
├── db/                      # Database-related files
├── docs/                    # Backend documentation
├── logs/                    # Log files
├── middleware/              # Express middleware
├── routes/                  # API route handlers
├── scripts/                 # Backend scripts
├── services/                # Business logic services
├── test/                    # Test files
├── .env*                    # Environment configuration files
├── index.mjs                # Main entry point
├── package.json             # Backend dependencies
└── README.md               # Backend README
```

## Frontend Structure

```
frontend/
├── public/                  # Static assets
├── src/                     # Source code
├── build/                   # Build output
├── node_modules/            # Dependencies
├── package.json             # Frontend dependencies
└── README.md               # Frontend README
```

## Documentation Structure

```
documentation/
├── project/                 # Project-level documentation
│   ├── README.md            # Main project README
│   ├── README-PROJETO.md    # Portuguese project README
│   └── rules-project.md     # Project rules and guidelines
├── technical/               # Technical documentation
│   ├── API_DOCUMENTATION.md # API documentation
│   ├── CHANGELOG.md         # Change log
│   └── ...                  # Other technical docs
└── supabase/                # Supabase documentation
    └── SUPABASE_MIGRATION_SUMMARY.md # Supabase migration summary
```

## Supabase Structure

```
supabase/
├── migrations/              # Database migration files
│   └── *.sql                # SQL migration scripts
├── config.toml              # Supabase configuration
└── .gitignore               # Supabase gitignore
```

## Scripts Structure

```
scripts/                     # Utility and automation scripts
```

## Version Control

```
.github/                     # GitHub workflows and configurations
.gitignore                   # Git ignore rules
```

## Development Tools

```
.vscode/                     # VS Code settings and configurations
.vercel/                     # Vercel development configurations
```

## Content Directories

```
Livros didáticos/            # Educational books and materials
Provas e gabaritos/          # Exam papers and answer keys
```

## Environment Files

- `.env` - Development environment variables
- `.env.local` - Local development overrides
- `.env.production` - Production environment variables
- `.env.staging` - Staging environment variables
- `.env.test` - Test environment variables

## Package Management

- `package.json` - Root project dependencies and scripts
- `package-lock.json` - Locked dependency versions