import postgres from 'postgres';

const sql = postgres(process.env.POSTGRES_DSN!, {
  transform: postgres.toCamel,
});

export { sql };
