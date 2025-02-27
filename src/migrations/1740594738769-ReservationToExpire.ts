import { MigrationInterface, QueryRunner } from 'typeorm';

export class ReservationToExpire1740594738769 implements MigrationInterface {
  name = 'ReservationToExpire1740594738769';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE \`notification\` (\`id\` int NOT NULL AUTO_INCREMENT, \`message\` text NULL, \`type\` enum ('reservation_requested', 'reservation_confirmed', 'reservation_rejected', 'reservation_cancelled', 'mentoring_upcoming', 'mentoring_started', 'mentoring_completed', 'review_received', 'new_follower', 'post_liked') NOT NULL DEFAULT 'mentoring_upcoming', \`isRead\` tinyint NOT NULL DEFAULT 0, \`userId\` int NOT NULL, \`reservationId\` int NULL, \`programId\` int NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `ALTER TABLE \`reservations\` ADD \`expire\` timestamp NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`notification\` ADD CONSTRAINT \`FK_1ced25315eb974b73391fb1c81b\` FOREIGN KEY (\`userId\`) REFERENCES \`users\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`notification\` ADD CONSTRAINT \`FK_0dbb41113fb3fe18842b0686df1\` FOREIGN KEY (\`reservationId\`) REFERENCES \`reservations\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`notification\` ADD CONSTRAINT \`FK_0f6cd62a8a56a674fa44dbd04d1\` FOREIGN KEY (\`programId\`) REFERENCES \`mentoringprograms\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`notification\` DROP FOREIGN KEY \`FK_0f6cd62a8a56a674fa44dbd04d1\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`notification\` DROP FOREIGN KEY \`FK_0dbb41113fb3fe18842b0686df1\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`notification\` DROP FOREIGN KEY \`FK_1ced25315eb974b73391fb1c81b\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`reservations\` DROP COLUMN \`expire\``,
    );
    await queryRunner.query(`DROP TABLE \`notification\``);
  }
}
