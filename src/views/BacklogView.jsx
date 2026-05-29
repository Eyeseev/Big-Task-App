import { StatusView } from '../components/StatusView'

export function BacklogView(props) {
  return <StatusView status="backlog" title="Later" {...props} />
}
