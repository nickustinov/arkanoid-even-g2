import { createArkanoidActions } from './main'
import type { AppModule } from '../_shared/app-types'

export const app: AppModule = {
  id: 'arkanoid',
  name: 'Arkanoid',
  pageTitle: 'Arkanoid',
  autoConnect: true,
  initialStatus: 'Arkanoid ready',
  createActions: createArkanoidActions,
}

export default app
