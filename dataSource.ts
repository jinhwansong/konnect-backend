import { DataSource } from 'typeorm';
import dotenv from 'dotenv';
import { join } from 'path';
import * as Entities from './src/entities';

dotenv.config();

const dataSource = new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST,
  port: 3306,
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  entities: Object.values(Entities).map((entity) => entity),
  migrations: [join(__dirname, 'src/migrations/**/*{.ts,.js}')],
  migrationsRun: process.env.NODE_ENV === 'production' ? false : true,
  migrationsTableName: 'migrations',
  charset: 'utf8mb4_general_ci',
  // 직접 만들고 db에 만들때 처음에 만들때만 true로
  synchronize: false,
  poolSize: 20,
  logging: process.env.NODE_ENV === 'production' ? false : true,
  extra: {
    connectionLimit: 10, // 동시 연결 수 제한
    connectTimeout: 60000, // 연결 시도 제한 시간 (ms)
    enableKeepAlive: true, // TCP Keep-Alive 활성화
    keepAliveInitialDelay: 30000, // Keep-Alive 초기 지연 시간 (ms)
  },
});

export default dataSource;
