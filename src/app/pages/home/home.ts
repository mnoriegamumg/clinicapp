import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

type Specialty = {
  icon: string;
  name: string;
  description: string;
};

@Component({
  selector: 'app-home',
  imports: [RouterLink],
  templateUrl: './home.html',
  styleUrl: './home.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Home {
  protected readonly specialties: Specialty[] = [
    {
      icon: '心',
      name: 'Cardiología',
      description: 'Prevención y cuidado integral del corazón.',
    },
    {
      icon: '✚',
      name: 'Medicina general',
      description: 'Atención cercana para cada etapa de tu salud.',
    },
    {
      icon: '◌',
      name: 'Dermatología',
      description: 'Diagnóstico y tratamiento especializado de la piel.',
    },
    {
      icon: '☼',
      name: 'Pediatría',
      description: 'Acompañamiento médico para niños y adolescentes.',
    },
  ];
}