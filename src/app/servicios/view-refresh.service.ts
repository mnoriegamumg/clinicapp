import { ApplicationRef, Injectable, inject } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ViewRefreshService {
  private readonly appRef = inject(ApplicationRef);

  refresh(): void {
    this.appRef.tick();
  }
}
