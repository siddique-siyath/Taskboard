import { appConfig } from './app.config';

describe('appConfig', () => {
  it('should be defined', () => {
    expect(appConfig).toBeTruthy();
    expect(appConfig.providers).toBeTruthy();
  });
});
