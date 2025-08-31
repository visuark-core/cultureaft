import React, { useState } from 'react';
import { GripVertical } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  UniqueIdentifier,
  useDroppable,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// --- Types and Sample Data ---
interface Product {
  id: string;
  name: string;
  sku: string;
}
type ProductStatus = 'inStock' | 'outOfStock' | 'live';
const initialProducts: Record<ProductStatus, Product[]> = {
  inStock: [
    { id: 'prod-1', name: 'Royal Carved Throne Chair', sku: 'SKU-001' },
    { id: 'prod-2', name: 'Ornate Storage Cabinet', sku: 'SKU-002' },
  ],
  outOfStock: [
    { id: 'prod-3', name: 'Decorative Mirror Frame', sku: 'SKU-003' },
  ],
  live: [
    { id: 'prod-4', name: 'Wooden Coffee Table', sku: 'SKU-004' },
  ],
};

// --- Draggable Product Card Component ---
const DraggableProductCard = ({ product }: { product: Product }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: product.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.7 : 1,
    zIndex: isDragging ? 100 : 'auto',
  };
  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="bg-white p-4 mb-4 rounded-lg shadow border flex items-center justify-between cursor-grab active:cursor-grabbing"
    >
      <div>
        <p className="font-semibold text-gray-800">{product.name}</p>
        <p className="text-sm text-gray-500">{product.sku}</p>
      </div>
      <GripVertical className="text-gray-400" />
    </div>
  );
};

// --- Column Component (Acts as a Drop Zone) ---
const InventoryColumn = ({
  id,
  title,
  products,
  bgColor,
}: {
  id: string;
  title: string;
  products: Product[];
  bgColor: string;
}) => {
  const { setNodeRef } = useDroppable({ id });
  return (
    <div ref={setNodeRef} className={`rounded-xl p-4 ${bgColor}`}>
      <h3 className="text-xl font-bold text-center mb-4 text-gray-800">{title}</h3>
      <SortableContext
        id={id}
        items={products.map((p) => p.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="min-h-[400px]">
          {products.map((product) => (
            <DraggableProductCard key={product.id} product={product} />
          ))}
        </div>
      </SortableContext>
    </div>
  );
};

// --- Main Inventory Component ---
const InventoryFormFields = () => {
  const [products, setProducts] = useState(initialProducts);
  const sensors = useSensors(useSensor(PointerSensor));

  const findContainer = (id: UniqueIdentifier): ProductStatus | undefined => {
    if (id in products) {
      return id as ProductStatus;
    }
    return Object.keys(products).find((key) =>
      products[key as ProductStatus].some((p) => p.id === id)
    ) as ProductStatus | undefined;
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;
    const activeContainer = findContainer(active.id);
    const overContainer = findContainer(over.id);
    if (!activeContainer || !overContainer) return;

    if (activeContainer === overContainer) {
      if (active.id !== over.id) {
        const activeIndex = products[activeContainer].findIndex((p) => p.id === active.id);
        const overIndex = products[overContainer].findIndex((p) => p.id === over.id);

        setProducts((prev) => ({
          ...prev,
          [overContainer]: arrayMove(prev[overContainer], activeIndex, overIndex),
        }));
      }
    } else {
      const activeItems = products[activeContainer];
      const overItems = products[overContainer];

      const activeIndex = activeItems.findIndex((p) => p.id === active.id);
      const overIndex = over.id in products ? overItems.length : overItems.findIndex((p) => p.id === over.id);
      setProducts((prev) => {
        const newProductsState = { ...prev };
        const [movedItem] = newProductsState[activeContainer].splice(activeIndex, 1);
        newProductsState[overContainer].splice(overIndex, 0, movedItem);
        return newProductsState;
      });
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <div className="w-full max-w-7xl mx-auto">
        <p className="text-center text-gray-600 mb-6">
          Drag and drop products between columns to update their stock status on the feed.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Object.entries(products).map(([id, items]) => (
            <InventoryColumn
              key={id}
              id={id}
              title={
                id === 'inStock'
                  ? 'In Stock Products'
                  : id === 'outOfStock'
                  ? 'Out of Stock Products'
                  : 'Live Products'
              }
              products={items}
              bgColor={
                id === 'inStock' ? 'bg-green-100' : id === 'outOfStock' ? 'bg-red-100' : 'bg-blue-100'
              }
            />
          ))}
        </div>
      </div>
    </DndContext>
  );
};

export default InventoryFormFields;
