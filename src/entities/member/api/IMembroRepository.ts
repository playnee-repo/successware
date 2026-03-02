import type { Membro } from '../model/types'

export interface IMembroRepository {
  findAll(): Promise<Membro[]>
  addByEmail(email: string, role: string): Promise<'ok' | 'not_found'>
  add(userId: string, role: string): Promise<void>
  remove(userId: string): Promise<void>
}
