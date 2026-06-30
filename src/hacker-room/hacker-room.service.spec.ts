import { Test, TestingModule } from '@nestjs/testing';
import { HackerRoomService } from './hacker-room.service';

describe('HackerRoomService', () => {
  let service: HackerRoomService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [HackerRoomService],
    }).compile();

    service = module.get<HackerRoomService>(HackerRoomService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
