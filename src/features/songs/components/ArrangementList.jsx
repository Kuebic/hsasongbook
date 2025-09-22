import ArrangementCard from './ArrangementCard'

export default function ArrangementList({ arrangements }) {
  if (!arrangements || arrangements.length === 0) {
    return null
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {arrangements.map((arrangement) => (
        <ArrangementCard
          key={arrangement.id}
          arrangement={arrangement}
        />
      ))}
    </div>
  )
}