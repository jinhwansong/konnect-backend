import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddNotitype1741101514068 implements MigrationInterface {
  name = 'AddNotitype1741101514068';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`notification\` CHANGE \`type\` \`type\` enum ('reservation_requested', 'reservation_confirmed', 'reservation_rejected', 'reservation_cancelled', 'mentoring_upcoming', 'mentoring_started', 'mentoring_completed', 'review_received', 'new_follower', 'post_liked', 'mento_confirmed', 'mento_rejected') NOT NULL DEFAULT 'mentoring_upcoming'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`notification\` CHANGE \`type\` \`type\` enum ('reservation_requested', 'reservation_confirmed', 'reservation_rejected', 'reservation_cancelled', 'mentoring_upcoming', 'mentoring_started', 'mentoring_completed', 'review_received', 'new_follower', 'post_liked') NOT NULL DEFAULT 'mentoring_upcoming'`,
    );
  }
}
