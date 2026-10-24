import type { NavigationId } from './navigation'

const paths: Record<NavigationId, string> = {
  home: 'M3 10 10 4l7 6v8h-5v-5H8v5H3Z',
  projects: 'M3 6h6l2-2h6v13H3Z M3 9h14',
  tasks: 'M6 4H4v14h12V4h-2 M7 3h6v3H7Z M7 10l1 1 2-2 M11 10h3 M7 14h7',
  requirements: 'M5 3h7l4 4v11H5Z M12 3v5h4 M8 11h5 M8 14h5',
  roles: 'M5 8h10v8H5Z M8 4h4 M10 4v4 M3 10v4 M17 10v4 M8 11v1 M12 11v1 M8 14h4',
  teams:
    'M7 10a3 3 0 1 0 0-6 3 3 0 0 0 0 6 M2 18v-2a5 5 0 0 1 10 0v2 M13 4a3 3 0 0 1 0 6 M15 13a4 4 0 0 1 3 4v1',
  skills: 'M7 3h6v4h4v6h-4v4H7v-4H3V7h4Z',
  settings: 'M8 3h4l1 3 3 1 1 4-2 2v3l-4 1-3-2H5l-2-4 2-3V5Z M10 7a3 3 0 1 0 0 6 3 3 0 0 0 0-6',
}

export const NavigationIcon = ({ name }: { name: NavigationId }) => (
  <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
    <path
      d={paths[name]}
      stroke="currentColor"
      strokeWidth="1.35"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)
