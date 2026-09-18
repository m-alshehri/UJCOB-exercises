# tamareen database

This folder contains the first database layer for tamareen using Supabase/PostgreSQL.

## Tables

- courses — six tamareen courses
- topics — course topics
- questions — question bank and explanations
- resources — course references
- profiles — optional student profiles linked to Supabase Auth
- attempts — quiz attempts and scores
- attempt_answers — answers and mistake history

## Setup

1. Create/open the tamareen Supabase project.
2. Open **SQL Editor**.
3. Run `schema.sql`.
4. Add the Supabase project URL and anon/publishable key to the application configuration.
5. The next application migration will read questions/resources from Supabase and write completed attempts and answers.

The existing static question bank remains untouched during this database foundation step, so the live practice experience is not replaced until the database-backed client is ready.
