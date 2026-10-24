import { createRoot } from 'react-dom/client'
import { App } from './app'
import './styles.css'
import './theme.css'
import './shell.css'

const root = document.getElementById('root')
if (!root) throw new Error('缺少应用根节点')
createRoot(root).render(<App />)
