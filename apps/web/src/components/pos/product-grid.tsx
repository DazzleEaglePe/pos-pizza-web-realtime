import { Plus, Minus } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  available: number;
  sold: number;
  category: string;
  badge?: string;
}

const mockProducts: Product[] = [
  {
    id: "1",
    name: "Caramel Java Frappuccino",
    price: 35.0,
    image: "https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=400&h=400&fit=crop",
    available: 24,
    sold: 6,
    category: "Coffee",
  },
  {
    id: "2",
    name: "Java Chip Frappuccino",
    price: 35.0,
    image: "https://images.unsplash.com/photo-1620916297397-a4a5402a3c6c?w=400&h=400&fit=crop",
    available: 0,
    sold: 12,
    category: "Coffee",
  },
  {
    id: "3",
    name: "Original Cheese Burger",
    price: 23.99,
    image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=400&fit=crop",
    available: 15,
    sold: 45,
    category: "Main Course",
    badge: "Non Veg",
  },
  {
    id: "4",
    name: "Tasty Veggie Salad",
    price: 17.99,
    image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=400&fit=crop",
    available: 8,
    sold: 23,
    category: "Salads",
    badge: "20% Off",
  },
];

export function ProductGrid() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-24">
      {mockProducts.map((product) => (
        <div
          key={product.id}
          className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow relative overflow-hidden group"
        >
          {/* Status/Badge */}
          {product.badge && (
            <Badge className="absolute top-4 left-4 bg-[#ffbf00] hover:bg-[#ffbf00] text-gray-900 border-none rounded-xl font-bold px-3 py-1 z-10">
              {product.badge}
            </Badge>
          )}

          {/* Image */}
          <div className="w-full aspect-square rounded-2xl overflow-hidden mb-5 bg-gray-50 relative">
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
          </div>

          {/* Details */}
          <div className="space-y-1 mb-4">
            <h3 className="font-bold text-gray-900 text-lg leading-tight line-clamp-2 min-h-[44px]">
              {product.name}
            </h3>
            <div className="flex items-center text-xs text-gray-500 gap-2 font-medium">
              <span className={product.available === 0 ? "text-red-500" : ""}>
                 {product.available} Available 
              </span>
              <span>•</span>
              <span>{product.sold} Sold</span>
            </div>
          </div>

          <div className="flex items-center justify-between mt-auto">
             <span className="text-xl font-black text-gray-900">${product.price.toFixed(2)}</span>
             
             {/* Add Button Area based on Wireframe */}
             {product.available === 0 ? (
               <button disabled className="bg-gray-100 text-gray-400 font-bold px-6 py-3 rounded-2xl text-sm transition-all cursor-not-allowed w-full ml-3">
                 Sold Out
               </button>
             ) : (
                <div className="flex items-center gap-2">
                   <button className="w-10 h-10 rounded-full border-2 border-gray-100 flex items-center justify-center text-gray-500 hover:border-primary hover:text-primary transition-colors">
                     <Minus className="w-4 h-4" />
                   </button>
                   <span className="font-bold text-lg w-4 text-center">1</span>
                   <button className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center hover:bg-primary/90 transition-colors shadow-sm shadow-primary/30">
                     <Plus className="w-5 h-5" />
                   </button>
                </div>
             )}
          </div>
        </div>
      ))}
    </div>
  );
}
