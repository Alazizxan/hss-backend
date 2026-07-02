import { Test, TestingModule } from '@nestjs/testing';
import { CyberLabService } from './cyber-lab.service';

describe('CyberLabService', () => {
  let service: CyberLabService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CyberLabService],
    }).compile();

    service = module.get<CyberLabService>(CyberLabService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
