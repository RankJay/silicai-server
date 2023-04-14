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

  @ManyToOne(() => UserEntity, (user) => user)
  user: UserEntity;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
