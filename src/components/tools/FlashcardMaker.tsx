import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Plus, Trash2, Download, RotateCcw, ChevronLeft, ChevronRight, Shuffle, BookMarked } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

interface Flashcard {
  id: number;
  front: string;
  back: string;
  known: boolean;
}

export const FlashcardMaker = () => {
  const [deckName, setDeckName] = useState("");
  const [cards, setCards] = useState<Flashcard[]>([
    { id: 1, front: "", back: "", known: false }
  ]);
  const [studyMode, setStudyMode] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showBack, setShowBack] = useState(false);
  const [studyCards, setStudyCards] = useState<Flashcard[]>([]);

  const addCard = () => {
    setCards([...cards, { id: Date.now(), front: "", back: "", known: false }]);
  };

  const removeCard = (id: number) => {
    if (cards.length > 1) {
      setCards(cards.filter(c => c.id !== id));
    }
  };

  const updateCard = (id: number, field: "front" | "back", value: string) => {
    setCards(cards.map(c => 
      c.id === id ? { ...c, [field]: value } : c
    ));
  };

  const startStudy = (shuffle: boolean = false) => {
    const validCards = cards.filter(c => c.front && c.back);
    if (validCards.length === 0) {
      toast.error("Please add at least one complete flashcard");
      return;
    }
    
    let cardsToStudy = [...validCards];
    if (shuffle) {
      cardsToStudy = cardsToStudy.sort(() => Math.random() - 0.5);
    }
    
    setStudyCards(cardsToStudy);
    setCurrentIndex(0);
    setShowBack(false);
    setStudyMode(true);
  };

  const nextCard = () => {
    if (currentIndex < studyCards.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setShowBack(false);
    }
  };

  const prevCard = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setShowBack(false);
    }
  };

  const markKnown = (known: boolean) => {
    const updatedCards = studyCards.map((c, i) => 
      i === currentIndex ? { ...c, known } : c
    );
    setStudyCards(updatedCards);
    
    // Also update the original cards
    const currentCard = studyCards[currentIndex];
    setCards(cards.map(c => c.id === currentCard.id ? { ...c, known } : c));
    
    if (currentIndex < studyCards.length - 1) {
      nextCard();
    }
  };

  const getProgress = () => {
    const known = studyCards.filter(c => c.known).length;
    return studyCards.length > 0 ? (known / studyCards.length) * 100 : 0;
  };

  const exportDeck = () => {
    const deckData = {
      name: deckName,
      cards: cards.filter(c => c.front && c.back).map(c => ({
        front: c.front,
        back: c.back
      }))
    };
    
    const blob = new Blob([JSON.stringify(deckData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${deckName || "flashcards"}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Flashcard deck exported!");
  };

  if (studyMode) {
    const currentCard = studyCards[currentIndex];
    
    return (
      <div className="px-4 py-6 md:py-8">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={() => setStudyMode(false)}>
              ← Exit Study Mode
            </Button>
            <Badge variant="secondary">
              {currentIndex + 1} / {studyCards.length}
            </Badge>
          </div>

          {/* Progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Progress</span>
              <span>{studyCards.filter(c => c.known).length} known</span>
            </div>
            <Progress value={getProgress()} className="h-2" />
          </div>

          {/* Flashcard */}
          <div 
            className="perspective-1000 cursor-pointer"
            onClick={() => setShowBack(!showBack)}
          >
            <Card 
              className={`min-h-[300px] transition-all duration-500 transform-style-3d ${showBack ? 'rotate-y-180' : ''}`}
              style={{
                transformStyle: 'preserve-3d',
                transform: showBack ? 'rotateY(180deg)' : 'rotateY(0deg)'
              }}
            >
              <CardContent className="flex items-center justify-center h-full min-h-[300px] p-8">
                <div 
                  className="text-center"
                  style={{ 
                    transform: showBack ? 'rotateY(180deg)' : 'rotateY(0deg)',
                    backfaceVisibility: 'hidden'
                  }}
                >
                  <Badge variant="outline" className="mb-4">
                    {showBack ? "Answer" : "Question"}
                  </Badge>
                  <p className="text-xl md:text-2xl font-medium">
                    {showBack ? currentCard.back : currentCard.front}
                  </p>
                  <p className="text-sm text-muted-foreground mt-4">
                    Click to flip
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Controls */}
          <div className="flex flex-col gap-4">
            {showBack && (
              <div className="flex gap-3 justify-center">
                <Button 
                  variant="outline" 
                  className="flex-1 border-red-200 hover:bg-red-50 text-red-600"
                  onClick={() => markKnown(false)}
                >
                  Still Learning
                </Button>
                <Button 
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  onClick={() => markKnown(true)}
                >
                  Got It! ✓
                </Button>
              </div>
            )}
            
            <div className="flex justify-between">
              <Button 
                variant="outline" 
                onClick={prevCard}
                disabled={currentIndex === 0}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>
              <Button 
                variant="outline" 
                onClick={() => startStudy(true)}
                className="gap-2"
              >
                <Shuffle className="h-4 w-4" />
                Shuffle
              </Button>
              <Button 
                variant="outline" 
                onClick={nextCard}
                disabled={currentIndex === studyCards.length - 1}
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>

          {/* Summary at end */}
          {currentIndex === studyCards.length - 1 && showBack && (
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="pt-6 text-center">
                <h3 className="text-lg font-semibold mb-2">Study Session Complete!</h3>
                <p className="text-muted-foreground">
                  You marked {studyCards.filter(c => c.known).length} out of {studyCards.length} cards as known.
                </p>
                <div className="flex gap-3 justify-center mt-4">
                  <Button variant="outline" onClick={() => startStudy(true)}>
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Study Again
                  </Button>
                  <Button onClick={() => setStudyMode(false)}>
                    Edit Cards
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 md:py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <BookMarked className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <CardTitle>Flashcard Maker</CardTitle>
                <CardDescription>Create and study flashcards for effective learning</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Deck Name</Label>
              <Input
                value={deckName}
                onChange={(e) => setDeckName(e.target.value)}
                placeholder="e.g., Biology Chapter 5"
              />
            </div>
            <div className="flex flex-wrap gap-3">
              <Button onClick={() => startStudy(false)} className="gap-2">
                Study Now
              </Button>
              <Button variant="outline" onClick={() => startStudy(true)} className="gap-2">
                <Shuffle className="h-4 w-4" />
                Study Shuffled
              </Button>
              <Button variant="outline" onClick={exportDeck} className="gap-2 ml-auto">
                <Download className="h-4 w-4" />
                Export Deck
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Cards */}
        <div className="space-y-4">
          {cards.map((card, idx) => (
            <Card key={card.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Card {idx + 1}</CardTitle>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => removeCard(card.id)}
                    disabled={cards.length === 1}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Badge variant="outline">Front</Badge>
                      Question
                    </Label>
                    <Textarea
                      value={card.front}
                      onChange={(e) => updateCard(card.id, "front", e.target.value)}
                      placeholder="Enter the question or term..."
                      rows={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Badge variant="secondary">Back</Badge>
                      Answer
                    </Label>
                    <Textarea
                      value={card.back}
                      onChange={(e) => updateCard(card.id, "back", e.target.value)}
                      placeholder="Enter the answer or definition..."
                      rows={3}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Button variant="outline" onClick={addCard} className="w-full gap-2">
          <Plus className="h-4 w-4" />
          Add Flashcard
        </Button>

        {/* Stats */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Total Cards</span>
              <Badge variant="secondary">{cards.filter(c => c.front && c.back).length}</Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
