import { Test, TestingModule } from '@nestjs/testing';
import { HackerRoomController } from './hacker-room.controller';

describe('HackerRoomController', () => {
  let controller: HackerRoomController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HackerRoomController],
    }).compile();

    controller = module.get<HackerRoomController>(HackerRoomController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
