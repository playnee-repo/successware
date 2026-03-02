import type { IMembroRepository } from '../api/IMembroRepository'
import type { Membro } from './types'

export class MembroService {
  constructor(private readonly repo: IMembroRepository) {}

  findAll(): Promise<Membro[]> {
    return this.repo.findAll()
  }

  addByEmail(email: string, role: string): Promise<'ok' | 'not_found'> {
    return this.repo.addByEmail(email, role)
  }

  add(userId: string, role: string): Promise<void> {
    return this.repo.add(userId, role)
  }

  remove(userId: string): Promise<void> {
    return this.repo.remove(userId)
  }
}
