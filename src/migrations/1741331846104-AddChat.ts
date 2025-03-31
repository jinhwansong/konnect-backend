import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddChat1741331846104 implements MigrationInterface {
  name = 'AddChat1741331846104';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. 기존 데이터 확인 (디버깅용)
    const roles = await queryRunner.query(`SELECT id, role FROM users`);
    console.log('Current roles:', roles);

    // 2. approved 컬럼 삭제 시도 (없을 수 있음)
    try {
      await queryRunner.query(
        `ALTER TABLE \`reservations\` DROP COLUMN \`approved\``,
      );
    } catch (error) {
      console.log(
        'Error dropping approved column, might not exist:',
        error.message,
      );
    }

    // 3. 먼저 enum을 확장하여 두 세트의 값을 모두 포함하도록 함
    try {
      await queryRunner.query(
        `ALTER TABLE \`users\` CHANGE \`role\` \`role\` enum ('user', 'mentor', 'admin', 'mentee') NOT NULL DEFAULT 'user'`,
      );
      console.log('Expanded enum values to include both old and new values');
    } catch (error) {
      console.log('Error expanding role enum:', error.message);
      throw error;
    }

    // 4. 이제 데이터 업데이트 (확장된 enum으로 가능)
    try {
      await queryRunner.query(`
        UPDATE \`users\` 
        SET \`role\` = CASE 
          WHEN \`role\` = 'user' THEN 'mentee'
          ELSE \`role\`
        END
      `);
      console.log('Updated user roles from "user" to "mentee"');
    } catch (error) {
      console.log('Error updating role values:', error.message);
      throw error;
    }

    // 5. 마지막으로 enum 값을 최종적으로 제한
    try {
      await queryRunner.query(
        `ALTER TABLE \`users\` CHANGE \`role\` \`role\` enum ('mentee', 'mentor', 'admin') NOT NULL DEFAULT 'mentee'`,
      );
      console.log('Finalized enum values to only include new values');
    } catch (error) {
      console.log('Error finalizing role enum:', error.message);
      throw error;
    }

    // 6. 외래 키 제약조건 추가
    try {
      await queryRunner.query(
        `ALTER TABLE \`chatmember\` ADD CONSTRAINT \`FK_2ba571895ccadd0aef53058c21d\` FOREIGN KEY (\`userId\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
      );
    } catch (error) {
      console.log(
        'Error adding FK_2ba571895ccadd0aef53058c21d:',
        error.message,
      );
    }

    try {
      await queryRunner.query(
        `ALTER TABLE \`chatmember\` ADD CONSTRAINT \`FK_6bbdea87925af920c211d3dc70c\` FOREIGN KEY (\`chatRoomId\`) REFERENCES \`chatroom\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
      );
    } catch (error) {
      console.log(
        'Error adding FK_6bbdea87925af920c211d3dc70c:',
        error.message,
      );
    }

    try {
      await queryRunner.query(
        `ALTER TABLE \`chatroom\` ADD CONSTRAINT \`FK_22a79154691a7a66cd6f66f1d60\` FOREIGN KEY (\`chatRoomId\`) REFERENCES \`reservations\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
      );
    } catch (error) {
      console.log(
        'Error adding FK_22a79154691a7a66cd6f66f1d60:',
        error.message,
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 각 단계를 try/catch로 감싸서 하나가 실패해도 다른 것은 진행
    try {
      await queryRunner.query(
        `ALTER TABLE \`chatroom\` DROP FOREIGN KEY \`FK_22a79154691a7a66cd6f66f1d60\``,
      );
    } catch (error) {
      console.log(
        'Error dropping FK_22a79154691a7a66cd6f66f1d60:',
        error.message,
      );
    }

    try {
      await queryRunner.query(
        `ALTER TABLE \`chatmember\` DROP FOREIGN KEY \`FK_6bbdea87925af920c211d3dc70c\``,
      );
    } catch (error) {
      console.log(
        'Error dropping FK_6bbdea87925af920c211d3dc70c:',
        error.message,
      );
    }

    try {
      await queryRunner.query(
        `ALTER TABLE \`chatmember\` DROP FOREIGN KEY \`FK_2ba571895ccadd0aef53058c21d\``,
      );
    } catch (error) {
      console.log(
        'Error dropping FK_2ba571895ccadd0aef53058c21d:',
        error.message,
      );
    }

    // 다운그레이드도 단계적으로 수행
    try {
      // 1. 확장된 enum으로 변경
      await queryRunner.query(
        `ALTER TABLE \`users\` CHANGE \`role\` \`role\` enum ('user', 'mentor', 'admin', 'mentee') NOT NULL DEFAULT 'mentee'`,
      );

      // 2. 데이터 변환
      await queryRunner.query(`
        UPDATE \`users\` 
        SET \`role\` = CASE 
          WHEN \`role\` = 'mentee' THEN 'user'
          ELSE \`role\`
        END
      `);

      // 3. 최종 enum 제한
      await queryRunner.query(
        `ALTER TABLE \`users\` CHANGE \`role\` \`role\` enum ('user', 'mentor', 'admin') NOT NULL DEFAULT 'user'`,
      );
    } catch (error) {
      console.log('Error reverting role column:', error.message);
    }

    try {
      await queryRunner.query(
        `ALTER TABLE \`reservations\` ADD \`approved\` tinyint NOT NULL DEFAULT '0'`,
      );
    } catch (error) {
      console.log('Error adding approved column:', error.message);
    }
  }
}
