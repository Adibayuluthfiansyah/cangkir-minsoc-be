import { Test, TestingModule } from '@nestjs/testing';
import { AdminBookingController } from './admin-booking.controller';

describe('AdminBookingController', () => {
  let controller: AdminBookingController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminBookingController],
    }).compile();

    controller = module.get<AdminBookingController>(AdminBookingController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
