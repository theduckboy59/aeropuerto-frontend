import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-placeholder',
  templateUrl: './placeholder.component.html',
  styleUrl: './placeholder.component.css'
})
export class PlaceholderComponent {
  title = 'Módulo';

  constructor(route: ActivatedRoute) {
    const routeTitle = route.snapshot.data?.['title'] as string | undefined;
    if (routeTitle) this.title = routeTitle;
  }
}

