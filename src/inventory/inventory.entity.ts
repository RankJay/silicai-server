import { UserEntity } from 'src/user/user.entity';
import {
  Entity,
  BaseEntity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
} from 'typeorm';

@Entity('inventory')
export class InventoryEntity extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  image: string;

  // all creators that this user is following
  @ManyToOne(() => UserEntity, (author) => author.email)
  author: UserEntity;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
