import { Fuente } from './fuente.enum';

export class Lead {
  id: string;
  nombre: string;
  email: string;
  telefono: string | null;
  fuente: Fuente;
  producto_interes: string | null;
  presupuesto: number | null;
  creator_id: string | null;
  updater_id: string | null;
  deleter_id: string | null;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;

  constructor(props: {
    id: string;
    nombre: string;
    email: string;
    telefono?: string | null;
    fuente: Fuente;
    producto_interes?: string | null;
    presupuesto?: number | null;
    creator_id?: string | null;
    updater_id?: string | null;
    deleter_id?: string | null;
    created_at?: Date;
    updated_at?: Date;
    deleted_at?: Date | null;
  }) {
    this.id = props.id;
    this.nombre = props.nombre;
    this.email = props.email;
    this.telefono = props.telefono ?? null;
    this.fuente = props.fuente;
    this.producto_interes = props.producto_interes ?? null;
    this.presupuesto = props.presupuesto ?? null;
    this.creator_id = props.creator_id ?? null;
    this.updater_id = props.updater_id ?? null;
    this.deleter_id = props.deleter_id ?? null;
    this.created_at = props.created_at ?? new Date();
    this.updated_at = props.updated_at ?? new Date();
    this.deleted_at = props.deleted_at ?? null;
  }
}
