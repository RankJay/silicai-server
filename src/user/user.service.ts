import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindConditions, Repository } from 'typeorm';
import { UserEntity } from './user.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  async getAllUsers(): Promise<UserEntity[]> {
    return await this.userRepository.find();
  }

  async getUser(
    filter: FindConditions<UserEntity>,
    relations?: string[],
    select?: (keyof UserEntity)[],
  ): Promise<UserEntity> {
    return await this.userRepository.findOne({
      where: { ...filter },
      relations,
      select,
    });
  }

  async createUser(user: Partial<UserEntity>): Promise<UserEntity> {
    const silicUser = this.userRepository.create(user);
    return await this.userRepository.save(silicUser);
  }
}
