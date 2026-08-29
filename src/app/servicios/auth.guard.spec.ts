import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';

import { AuthService } from './auth.service';
import { authGuard } from './auth.guard';

describe('authGuard', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideRouter([])],
    });
  });

  it('should redirect to login when no JWT token is present', () => {
    const authService = TestBed.inject(AuthService);
    const router = TestBed.inject(Router);

    spyOn(authService, 'getToken').and.returnValue(null);

    const result = TestBed.runInInjectionContext(() =>
      authGuard({} as any, {} as any),
    );

    expect(result).toEqual(router.createUrlTree(['/login']));
  });
});
