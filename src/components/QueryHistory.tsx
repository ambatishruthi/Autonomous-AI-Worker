import { Clock, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export interface HistoryItem {
  id: string;
  query: string;
  response: string;
  model: string;
  timestamp: Date;
}

interface QueryHistoryProps {
  history: HistoryItem[];
  onSelectHistory: (item: HistoryItem) => void;
  onClearHistory: () => void;
}

export function QueryHistory({ history, onSelectHistory, onClearHistory }: QueryHistoryProps) {
  if (history.length === 0) return null;

  return (
    <Card className="shadow-card">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Clock className="h-5 w-5 text-primary" />
            Recent Queries
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={onClearHistory}
            className="gap-2 text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
            Clear
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {history.slice(0, 5).map((item) => (
          <div
            key={item.id}
            onClick={() => onSelectHistory(item)}
            className="p-3 rounded-lg border border-border bg-muted/30 hover:bg-muted/50 cursor-pointer transition-smooth"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {item.query}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-muted-foreground">
                    {item.model}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {item.timestamp.toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}