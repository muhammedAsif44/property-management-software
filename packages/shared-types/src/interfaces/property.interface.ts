import { PropertyType } from '../enums/property-type.enum';

export interface IAddress {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  latitude?: number;
  longitude?: number;
}

export interface IProperty {
  id: string;
  name: string;
  type: PropertyType;
  address: IAddress;
  ownerId: string;
  totalUnits: number;
  occupiedUnits?: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
