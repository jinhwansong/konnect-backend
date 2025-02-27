import { DataSource } from 'typeorm';
import dotenv from 'dotenv';
import { Comments } from './src/entities/Comments';
import { Likes } from './src/entities/Likes';
import { MentoringPrograms } from './src/entities/MentoringPrograms';
import { Mentors } from './src/entities/Mentors';
import { Payments } from './src/entities/Payments';
import { Posts } from './src/entities/Posts';
import { Users } from './src/entities/Users';
import { join } from 'path';
import { MentorProfile } from './src/entities/MentorProfile';
import { Reservations } from './src/entities/Reservations';
import { AvailableSchedule } from './src/entities/AvailableSchedule';
import { Contact } from './src/entities/Contact';
import { Review } from './src/entities/Review';
import { Notification } from './src/entities/Notification';

dotenv.config();

const dataSource = new DataSource({
  type: 'mysql',
  host: 'localhost',
  port: 3306,
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  entities: [
    Comments,
    Likes,
    MentoringPrograms,
    Mentors,
    Payments,
    Posts,
    Users,
    MentorProfile,
    Reservations,
    AvailableSchedule,
    Contact,
    Review,
    Notification,
  ],
  migrations: [join(__dirname, 'src/migrations/**/*{.ts,.js}')],
  migrationsRun: process.env.NODE_ENV !== 'production' ? true : false,
  migrationsTableName: 'migrations',
  charset: 'utf8mb4_general_ci',
  synchronize: false,
  logging: true,
  extra: {
    connectionLimit: 10, // 동시 연결 수 제한
    connectTimeout: 60000, // 연결 시도 제한 시간 (ms)
    enableKeepAlive: true, // TCP Keep-Alive 활성화
    keepAliveInitialDelay: 30000, // Keep-Alive 초기 지연 시간 (ms)
    retryAttempts: 3,
    retryDelay: 3000,
    keepConnectionAlive: true,
  },
});

export default dataSource;
