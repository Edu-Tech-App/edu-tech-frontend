import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { Star } from "lucide-react";

const popularBooks = [
  {
    id: 1,
    title: "The Midnight Library",
    author: "Matt Haig",
    image: "https://images.unsplash.com/photo-1637962638310-e6787f7eb324?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxvcGVuJTIwYm9vayUyMHJlYWRpbmd8ZW58MXx8fHwxNzYyNjY5MjY1fDA&ixlib=rb-4.1.0&q=80&w=1080",
    available: 3,
    total: 5,
    rating: 4.5,
  },
  {
    id: 2,
    title: "Project Hail Mary",
    author: "Andy Weir",
    image: "https://images.unsplash.com/photo-1758796629109-4f38e9374f45?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxib29rJTIwY292ZXIlMjBmaWN0aW9ufGVufDF8fHx8MTc2MjU3MjU2NHww&ixlib=rb-4.1.0&q=80&w=1080",
    available: 1,
    total: 4,
    rating: 4.8,
  },
  {
    id: 3,
    title: "The Seven Husbands",
    author: "Taylor Jenkins Reid",
    image: "https://images.unsplash.com/photo-1762113246655-05f2cb669f34?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx2aW50YWdlJTIwYm9va3MlMjBjb2xsZWN0aW9ufGVufDF8fHx8MTc2MjYxMTIyNnww&ixlib=rb-4.1.0&q=80&w=1080",
    available: 2,
    total: 3,
    rating: 4.6,
  },
  {
    id: 4,
    title: "Atomic Habits",
    author: "James Clear",
    image: "https://images.unsplash.com/photo-1662582631700-676a217d511f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsaWJyYXJ5JTIwYm9va3MlMjBzaGVsdmVzfGVufDF8fHx8MTc2MjY0MDkyMHww&ixlib=rb-4.1.0&q=80&w=1080",
    available: 5,
    total: 8,
    rating: 4.9,
  },
];

export function PopularBooks() {
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3>Popular Books</h3>
        <Button variant="link" className="text-blue-600">
          View All
        </Button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {popularBooks.map((book) => (
          <div key={book.id} className="group">
            <div className="relative aspect-[3/4] mb-3 rounded-lg overflow-hidden bg-gray-100">
              <ImageWithFallback
                src={book.image}
                alt={book.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            </div>
            <div>
              <h4 className="line-clamp-1 mb-1">{book.title}</h4>
              <p className="text-sm text-gray-500 mb-2">{book.author}</p>
              <div className="flex items-center gap-2 text-sm">
                <div className="flex items-center gap-1 text-yellow-500">
                  <Star className="w-3 h-3 fill-current" />
                  <span className="text-gray-700">{book.rating}</span>
                </div>
                <span className="text-gray-500">•</span>
                <span className={book.available > 0 ? "text-green-600" : "text-red-600"}>
                  {book.available}/{book.total} available
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
