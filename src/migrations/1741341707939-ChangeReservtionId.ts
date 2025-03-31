import { MigrationInterface, QueryRunner } from 'typeorm';

export class ChangeReservtionId1741341707939 implements MigrationInterface {
  name = 'ChangeReservtionId1741341707939';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`chatroom\` DROP COLUMN \`reservationId\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`chatroom\` DROP FOREIGN KEY \`FK_22a79154691a7a66cd6f66f1d60\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`chatroom\` CHANGE \`chatRoomId\` \`chatRoomId\` int NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`chatroom\` ADD CONSTRAINT \`FK_22a79154691a7a66cd6f66f1d60\` FOREIGN KEY (\`chatRoomId\`) REFERENCES \`reservations\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`chatroom\` DROP FOREIGN KEY \`FK_22a79154691a7a66cd6f66f1d60\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`chatroom\` CHANGE \`chatRoomId\` \`chatRoomId\` int NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`chatroom\` ADD CONSTRAINT \`FK_22a79154691a7a66cd6f66f1d60\` FOREIGN KEY (\`chatRoomId\`) REFERENCES \`reservations\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`chatroom\` ADD \`reservationId\` int NOT NULL`,
    );
  }
}
