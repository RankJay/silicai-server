import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindConditions, Repository } from 'typeorm';
import { InventoryEntity } from './inventory.entity';
import { SilicUserInventory } from './inventory.dto';
import { UserService } from 'src/user/user.service';

@Injectable()
export class InventoryService {
  constructor(
    @InjectRepository(InventoryEntity)
    private readonly inventoryRepository: Repository<InventoryEntity>,
    @Inject(UserService) private userService: UserService,
  ) {}

  async getUserInventory(
    filter: FindConditions<InventoryEntity>,
    relations?: string[],
    select?: (keyof InventoryEntity)[],
  ): Promise<InventoryEntity> {
    return this.inventoryRepository.findOne({
      where: { ...filter },
      relations,
      select,
    });
  }

  async addToUserInventory(body: SilicUserInventory): Promise<InventoryEntity> {
    const exisitingSilicUser = await this.userService.getUser({
      email: body.author,
    });

    console.log(exisitingSilicUser, body.author);

    if (exisitingSilicUser) {
      const silicUserCreation = this.inventoryRepository.create({
        image: body.image,
        user: exisitingSilicUser,
      });
      return await this.inventoryRepository.save(silicUserCreation);
    } else {
      const silicRandomUserCreation = this.inventoryRepository.create({
        image: body.image,
      });
      return await this.inventoryRepository.save(silicRandomUserCreation);
    }
  }
}
