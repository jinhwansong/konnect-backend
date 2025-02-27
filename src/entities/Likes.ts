import {
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Users } from './Users';
import { Posts } from './Posts';

@Entity({ schema: 'konnect', name: 'likes' })
export class Likes {
  // 키값
  @PrimaryGeneratedColumn({ type: 'int', name: 'id' })
  id: number;
  @CreateDateColumn()
  createdAt: Date;
  // 좋아요한 사용자
  @ManyToOne(() => Users, (user) => user.likes)
  @JoinColumn({ name: 'userId' })
  users: Users;
  // 좋아요한 게시물
  @ManyToOne(() => Posts, (post) => post.likes)
  @JoinColumn({ name: 'postId' })
  posts: Posts;
}
