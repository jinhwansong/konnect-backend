import { MigrationInterface, QueryRunner } from 'typeorm';

export class Chat1741332132941 implements MigrationInterface {
  name = 'Chat1741332132941';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE \`chatmember\` (\`id\` int NOT NULL AUTO_INCREMENT, \`role\` enum ('mentee', 'mentor', 'admin') NOT NULL DEFAULT 'mentee', \`isActive\` tinyint NOT NULL DEFAULT 0, \`chatRoomId\` int NOT NULL, \`userId\` int NOT NULL, \`joinedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`chatroom\` (\`id\` int NOT NULL AUTO_INCREMENT, \`name\` varchar(255) NOT NULL, \`reservationId\` int NOT NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`chatRoomId\` int NULL, UNIQUE INDEX \`REL_22a79154691a7a66cd6f66f1d6\` (\`chatRoomId\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `ALTER TABLE \`chatmember\` ADD CONSTRAINT \`FK_2ba571895ccadd0aef53058c21d\` FOREIGN KEY (\`userId\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`chatmember\` ADD CONSTRAINT \`FK_6bbdea87925af920c211d3dc70c\` FOREIGN KEY (\`chatRoomId\`) REFERENCES \`chatroom\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
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
      `ALTER TABLE \`chatmember\` DROP FOREIGN KEY \`FK_6bbdea87925af920c211d3dc70c\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`chatmember\` DROP FOREIGN KEY \`FK_2ba571895ccadd0aef53058c21d\``,
    );
    await queryRunner.query(
      `DROP INDEX \`REL_22a79154691a7a66cd6f66f1d6\` ON \`chatroom\``,
    );
    await queryRunner.query(`DROP TABLE \`chatroom\``);
    await queryRunner.query(`DROP TABLE \`chatmember\``);
  }
}
