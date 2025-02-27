import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Users } from './Users';
import { Posts } from './Posts';

@Entity({ schema: 'konnect', name: 'comments' })
export class Comments {
  // 키값
  @PrimaryGeneratedColumn({ type: 'int', name: 'id' })
  id: number;
  // 내용
  @Column('text', { name: 'content' })
  content: string;
  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
  // 유저와 묶기
  @ManyToOne(() => Users, (user) => user.comments)
  @JoinColumn({ name: 'userId' })
  users: Users;
  // 게시물과 묶기
  @ManyToOne(() => Posts, (post) => post.comments)
  @JoinColumn({ name: 'postId' })
  posts: Posts;
  // 대댓글 관계 부모 댓글
  @ManyToOne(() => Comments, (comment) => comment.replies)
  @JoinColumn({ name: 'parentId' })
  parentComment: Comments | null;
  // 헌재댓글의 대댓글
  @OneToMany(() => Comments, (comment) => comment.parentComment)
  replies: Comments[];
  // 현재댓글에 대댓글이 없을수도 잇으니 만든거.
  @Column({ type: 'int', nullable: true })
  parentId: number | null;
}
