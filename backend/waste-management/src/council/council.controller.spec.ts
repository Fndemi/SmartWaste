import { Test, TestingModule } from '@nestjs/testing';
import { CouncilController } from './council.controller';

describe('CouncilController', () => {
  let controller: CouncilController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CouncilController],
    }).compile();

    controller = module.get<CouncilController>(CouncilController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
