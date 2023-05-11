# Config

Library enables typesafe environment configuration and allows overrides from `.env.<environment>` files or environment
variables, similar to Microprofile.

## Usage

```typescript
import { Var, initializeEnvironment } from '@zarja/config'
import { LogLevel } from './logger'

export const config = initializeEnvironment({
  port: Var.number(8080),
  db: {
    url: Var.string(),
  },
  log: {
    level: Var.enum(LogLevel).default(LogLevel.INFO),
  },
  server: {
    greeting: Var.string('Hello').transform((message, ctx) => `${message}, ${ctx.info.env}!`), // Hello, local!
  },
})
```

Then in `.env.local`:

```
# Provide database url for path db.url
DB_URL=postgres://localhost:5432/db

# Override default port
PORT=3000
```

## Motivation

A library that would glue configuration and validation together does not seem to exist in Typescript or when it does,
it seems to be clunky (looking at you `@nestjs/config`). Working with pure `process.env` turns into a pain, because you
would have to validate it every time you use it across the codebase. We can address both "validate it" and "across the
codebase", by specifying environment variables that we need in a single file and validating them using a validation
library of choice:

```
const schema = /* schema definition */

export const config = schema.validate(process.env)
```

But this gives us a flat config structure with UPPERCASE_VARIABLES by convention. To improve this, we can do the
following:

```
const schema = /* schema definition */

const definition = {
    db: {
        url: process.env.DB_URL
    }
}

export const config = schema.validate(definition)
```

However, the ergonomics of this are shitty, because you have to always update schema and definition for the same
reason. There is inherent disconnect between the two, that this project intends to address.

# Docs

## TODO