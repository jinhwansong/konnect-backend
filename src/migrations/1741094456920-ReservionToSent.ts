import { MigrationInterface, QueryRunner } from 'typeorm';

export class ReservionToSent1741094456920 implements MigrationInterface {
  name = 'ReservionToSent1741094456920';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`reservations\` ADD \`reminderSent\` tinyint NOT NULL DEFAULT 0`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`reservations\` DROP COLUMN \`reminderSent\``,
    );
  }
}
