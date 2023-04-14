import { InventoryEntity } from 'src/inventory/inventory.entity';
import {
  Entity,
  BaseEntity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
} from 'typeorm';

@Entity('user')
export class UserEntity extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  email: string;

  @Column({ nullable: true })
  firstName?: string;

  @Column({ nullable: true })
  lastName?: string;

  @Column({ nullable: true })
  username?: string;

  @ManyToOne(() => InventoryEntity, (inventory) => inventory.user)
  inventory: InventoryEntity[];

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
