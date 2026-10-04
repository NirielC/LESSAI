import type { ImageSourcePropType } from 'react-native';

/**
 * EQUIPO LESSAI. El orden es el que se muestra.
 *
 * FOTOS: copia cada foto a LESSAI_MOVIL/assets/equipo/ con el nombre indicado
 * (cuadrada, ~400×400, .jpg) y descomenta su línea `foto`. Mientras no haya
 * foto se muestran sus iniciales.
 */
export interface Miembro {
  nombre: string;
  correo: string;
  rol: string;
  color: string;
  foto?: ImageSourcePropType;
}

export const EQUIPO: Miembro[] = [
  {
    nombre: 'Elías Niriel López Casoverde',
    correo: 'elsnirielc@gmail.com',
    rol: 'Equipo de desarrollo',
    color: '#1E5A6E',
    // foto: require('../../assets/equipo/elias.jpg'),
  },
  {
    nombre: 'Diego Josué Elías López',
    correo: 'eliaslopezdiegojosue@gmail.com',
    rol: 'Equipo de desarrollo',
    color: '#6BA7A0',
    // foto: require('../../assets/equipo/diego.jpg'),
  },
  {
    nombre: 'Cesar Daniel Elías Villanueva',
    correo: 'cesarelias0207@gmail.com',
    rol: 'Equipo de desarrollo',
    color: '#F08A5D',
    // foto: require('../../assets/equipo/cesar.jpg'),
  },
  {
    nombre: 'Victoria Rebeca Leiva Padilla',
    correo: 'victoria.leivapadilla07@gmail.com',
    rol: 'Equipo de desarrollo',
    color: '#F6C453',
    // foto: require('../../assets/equipo/victoria.jpg'),
  },
  {
    nombre: 'Andrea Sofia Argueta Dominguez',
    correo: 'asofiaargueta.2008@gmail.com',
    rol: 'Equipo de desarrollo',
    color: '#B7D4E6',
    // foto: require('../../assets/equipo/andrea.jpg'),
  },
];

export const APP_VERSION = 'Alfa 0.5';
export const APP_YEAR = 2026;
