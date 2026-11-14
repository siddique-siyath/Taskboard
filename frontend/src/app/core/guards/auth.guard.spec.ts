import { authGuard, guestGuard } from './auth.guard';

describe('authGuard', () => {
  it('should be defined', () => {
    expect(authGuard).toBeTruthy();
    expect(guestGuard).toBeTruthy();
  });
});
