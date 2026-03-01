import { Test, TestingModule } from '@nestjs/testing';
import { AdminTimeSlotController } from './admin-time-slot.controller';

describe('AdminTimeSlotController', () => {
  let controller: AdminTimeSlotController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminTimeSlotController],
    }).compile();

    controller = module.get<AdminTimeSlotController>(AdminTimeSlotController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
