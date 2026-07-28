import { PropertyType } from '../../enums/property-type.enum';

export interface CreatePropertyDto {
  name: string;
  type: PropertyType;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  ownerId: string;
  totalUnits: number;
}
