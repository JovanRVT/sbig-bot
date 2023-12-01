import assert from 'assert';
import dotenv from 'dotenv';

dotenv.config();

const required = (name: string, val: string | undefined) =>
  assert(val, `${name} is not defined`);

const optional = (name: string, val: string | undefined) => {
  if (!val) {
    console.warn(`Warning: ${name} is not defined, some features may not work`);
  }
};

required('DISCORD_BOT_TOKEN', process.env.DISCORD_BOT_TOKEN);
required('DISCORD_CLIENT_ID', process.env.DISCORD_CLIENT_ID);
required('MOD_LOG_CHANNEL_ID', process.env.MOD_LOG_CHANNEL_ID);
required('DB_USERNAME', process.env.DB_USERNAME);
required('DB_PASSWORD', process.env.DB_PASSWORD);
required('DB_HOST', process.env.DB_HOST);
required('DB_NAME', process.env.DB_NAME);
required('DB_DIALECT', process.env.DB_DIALECT);
optional('MODERATOR_ROLE_ID', process.env.MODERATOR_ROLE_ID);
optional('OMDB_ACCESS_TOKEN', process.env.OMDB_ACCESS_TOKEN);
