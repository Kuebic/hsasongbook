import { useNavigate } from 'react-router-dom'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Music, Clock, Guitar, Hash, PlayCircle } from 'lucide-react'

export default function ArrangementCard({ arrangement }) {
  const navigate = useNavigate()

  const handleViewArrangement = () => {
    navigate(`/arrangement/${arrangement.id}`)
  }

  return (
    <Card className="h-full flex flex-col hover:shadow-lg transition-all hover:scale-[1.02]">
      <CardHeader>
        <CardTitle className="text-lg line-clamp-2 flex items-start justify-between">
          <span>{arrangement.name}</span>
          {arrangement.tags?.includes('default') && (
            <Badge variant="outline" className="ml-2 text-xs">
              Default
            </Badge>
          )}
        </CardTitle>
        <CardDescription className="space-y-1">
          <div className="flex items-center gap-2">
            <Music className="h-3 w-3" />
            <span>Key: {arrangement.key}</span>
          </div>
          {arrangement.capo > 0 && (
            <div className="flex items-center gap-2">
              <Guitar className="h-3 w-3" />
              <span>Capo: {arrangement.capo}</span>
            </div>
          )}
        </CardDescription>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col justify-between">
        <div className="space-y-3 mb-4">
          {/* Musical properties */}
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary" className="text-xs">
              <Clock className="h-3 w-3 mr-1" />
              {arrangement.tempo} BPM
            </Badge>
            {arrangement.timeSignature && (
              <Badge variant="secondary" className="text-xs">
                {arrangement.timeSignature}
              </Badge>
            )}
          </div>

          {/* Tags */}
          {arrangement.tags && arrangement.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {arrangement.tags
                .filter(tag => tag !== 'default')
                .map((tag, index) => (
                  <Badge key={index} variant="outline" className="text-xs capitalize">
                    <Hash className="h-2 w-2 mr-1" />
                    {tag}
                  </Badge>
                ))}
            </div>
          )}
        </div>

        {/* Action button */}
        <Button
          onClick={handleViewArrangement}
          className="w-full"
          size="sm"
        >
          <PlayCircle className="mr-2 h-4 w-4" />
          View Arrangement
        </Button>
      </CardContent>
    </Card>
  )
}