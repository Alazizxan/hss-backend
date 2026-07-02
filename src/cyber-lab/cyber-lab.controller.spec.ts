import { Test, TestingModule } from '@nestjs/testing';
import { CyberLabController } from './cyber-lab.controller';

describe('CyberLabController', () => {
  let controller: CyberLabController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CyberLabController],
    }).compile();

    controller = module.get<CyberLabController>(CyberLabController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
