import { Brain, Zap, Shield, Server } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const AI_MODELS = [
  {
    id: "openai",
    name: "OpenAI GPT",
    description: "Most versatile AI model",
    icon: Brain,
    color: "text-green-500",
  },
  {
    id: "gemini",
    name: "Google Gemini",
    description: "Google's most capable AI",
    icon: Zap,
    color: "text-blue-500",
  },
];

interface ModelSelectorProps {
  selectedModel: string;
  onModelChange: (model: string) => void;
}

export function ModelSelector({ selectedModel, onModelChange }: ModelSelectorProps) {
  const selectedModelData = AI_MODELS.find(model => model.id === selectedModel);

  return (
    <div className="space-y-3">
      <label className="text-sm font-medium text-foreground">
        Choose Your AI Assistant 🤖
      </label>
      <Select value={selectedModel} onValueChange={onModelChange}>
        <SelectTrigger className="h-14 bg-card border-border shadow-soft transition-smooth hover:shadow-card">
          <div className="flex items-center gap-3">
            {selectedModelData && (
              <>
                <selectedModelData.icon className={`h-5 w-5 ${selectedModelData.color}`} />
                <div className="text-left">
                  <div className="font-medium text-foreground">{selectedModelData.name}</div>
                  <div className="text-xs text-muted-foreground">{selectedModelData.description}</div>
                </div>
              </>
            )}
            <SelectValue placeholder="Select an AI model" />
          </div>
        </SelectTrigger>
        <SelectContent className="bg-card border-border shadow-card">
          {AI_MODELS.map((model) => (
            <SelectItem 
              key={model.id} 
              value={model.id}
              className="h-14 hover:bg-muted transition-smooth"
            >
              <div className="flex items-center gap-3">
                <model.icon className={`h-5 w-5 ${model.color}`} />
                <div>
                  <div className="font-medium text-foreground">{model.name}</div>
                  <div className="text-xs text-muted-foreground">{model.description}</div>
                </div>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}